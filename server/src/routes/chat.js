const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { generateResponse, generateResponseStream, currentModel, maxContextMessages } = require('../services/llm');
const { responseCache } = require('../services/cache');

const router = express.Router();
const prisma = new PrismaClient();

// Get all sessions for user
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, updatedAt: true },
    });
    res.json(sessions);
});

// Get specific session
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await prisma.session.findFirst({
        where: { id, userId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
});

// Create/Continue Chat
router.post('/', authenticateToken, async (req, res) => {
    const { prompt, sessionId, persona = 'Default' } = req.body;
    const userId = req.user.id;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // Track request
    const { trackRequest, trackCacheHit, trackCacheMiss, trackResponseTime } = require('../services/metrics');
    trackRequest();

    let currentSessionId = sessionId;
    let session;

    // 1. Get or Create Session
    if (currentSessionId) {
        session = await prisma.session.findFirst({ where: { id: currentSessionId, userId } });
        if (!session) return res.status(404).json({ error: 'Session not found' });
    } else {
        session = await prisma.session.create({
            data: {
                userId,
                title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
            },
        });
        currentSessionId = session.id;
    }

    // 2. Save User Message
    await prisma.message.create({
        data: {
            content: prompt,
            role: 'user',
            sessionId: currentSessionId,
        },
    });

    // 3. Check Cache
    const cacheKey = `${currentModel}:${persona}:${prompt}`;
    if (responseCache.has(cacheKey)) {
        console.log('Cache Hit!');
        trackCacheHit();
        const cachedResponse = responseCache.get(cacheKey);

        // Save Assistant Message (even if cached)
        const assistantMsg = await prisma.message.create({
            data: {
                content: cachedResponse,
                role: 'assistant',
                sessionId: currentSessionId,
            },
        });

        // Update session timestamp
        await prisma.session.update({
            where: { id: currentSessionId },
            data: { updatedAt: new Date() },
        });

        return res.json({
            sessionId: currentSessionId,
            message: assistantMsg,
            cached: true
        });
    }

    // Track cache miss
    trackCacheMiss();

    // 4. Build Context (Last N messages)
    const recentMessages = await prisma.message.findMany({
        where: { sessionId: currentSessionId },
        orderBy: { createdAt: 'desc' },
        take: maxContextMessages,
    });
    // Reverse to chronological order for LLM
    const context = recentMessages.reverse().map(m => ({ role: m.role, content: m.content }));
    const contextForLLM = context.filter(m => m.content !== prompt);

    // 5. Call LLM
    try {
        const startTime = Date.now();
        const responseText = await generateResponse(prompt, contextForLLM, persona);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Track response time
        trackResponseTime(responseTime);
        console.log(`Response generated in ${responseTime}ms`);

        // 6. Save Assistant Message
        const assistantMsg = await prisma.message.create({
            data: {
                content: responseText,
                role: 'assistant',
                sessionId: currentSessionId,
            },
        });

        // 7. Update Cache
        responseCache.set(cacheKey, responseText);

        // 8. Update Session
        await prisma.session.update({
            where: { id: currentSessionId },
            data: { updatedAt: new Date() },
        });

        res.json({
            sessionId: currentSessionId,
            message: assistantMsg,
            cached: false
        });
    } catch (error) {
        console.error('LLM Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// Streaming Chat Endpoint (Server-Sent Events)
router.post('/stream', authenticateToken, async (req, res) => {
    const { prompt, sessionId, persona = 'Default' } = req.body;
    const userId = req.user.id;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Track request
    const { trackRequest, trackCacheHit, trackCacheMiss, trackResponseTime } = require('../services/metrics');
    trackRequest();

    let currentSessionId = sessionId;
    let session;

    try {
        // 1. Get or Create Session
        if (currentSessionId) {
            session = await prisma.session.findFirst({ where: { id: currentSessionId, userId } });
            if (!session) {
                res.write(`data: ${JSON.stringify({ error: 'Session not found' })}\n\n`);
                res.end();
                return;
            }
        } else {
            session = await prisma.session.create({
                data: {
                    userId,
                    title: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
                },
            });
            currentSessionId = session.id;
            // Send session ID to client
            res.write(`data: ${JSON.stringify({ sessionId: currentSessionId })}\n\n`);
        }

        // 2. Save User Message
        await prisma.message.create({
            data: {
                content: prompt,
                role: 'user',
                sessionId: currentSessionId,
            },
        });

        // 3. Check Cache
        const cacheKey = `${currentModel}:${persona}:${prompt}`;
        if (responseCache.has(cacheKey)) {
            console.log('Cache Hit! (streaming with cached response)');
            trackCacheHit();
            const cachedResponse = responseCache.get(cacheKey);

            // Stream cached response word by word for consistency
            const words = cachedResponse.split(' ');
            for (let i = 0; i < words.length; i++) {
                const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
                res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
                await new Promise(resolve => setTimeout(resolve, 30)); // Faster for cached
            }

            // Save Assistant Message
            const assistantMsg = await prisma.message.create({
                data: {
                    content: cachedResponse,
                    role: 'assistant',
                    sessionId: currentSessionId,
                },
            });

            await prisma.session.update({
                where: { id: currentSessionId },
                data: { updatedAt: new Date() },
            });

            res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMsg.id })}\n\n`);
            res.end();
            return;
        }

        trackCacheMiss();

        // 4. Build Context
        const recentMessages = await prisma.message.findMany({
            where: { sessionId: currentSessionId },
            orderBy: { createdAt: 'desc' },
            take: maxContextMessages,
        });
        const context = recentMessages.reverse().map(m => ({ role: m.role, content: m.content }));
        const contextForLLM = context.filter(m => m.content !== prompt);

        // 5. Stream LLM Response
        const startTime = Date.now();
        let fullResponse = '';

        const responseText = await generateResponseStream(prompt, contextForLLM, persona, (chunk) => {
            fullResponse += chunk;
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        trackResponseTime(responseTime);
        console.log(`Response streamed in ${responseTime}ms`);

        // 6. Save Assistant Message
        const assistantMsg = await prisma.message.create({
            data: {
                content: responseText,
                role: 'assistant',
                sessionId: currentSessionId,
            },
        });

        // 7. Update Cache
        responseCache.set(cacheKey, responseText);

        // 8. Update Session
        await prisma.session.update({
            where: { id: currentSessionId },
            data: { updatedAt: new Date() },
        });

        // Send completion event
        res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMsg.id })}\n\n`);
        res.end();
    } catch (error) {
        console.error('Streaming Error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`);
        res.end();
    }
});

// Delete Session

router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        await prisma.session.delete({ where: { id, userId } });
        res.json({ success: true });
    } catch (e) {
        res.status(404).json({ error: 'Session not found' });
    }
});

// Rename Session
router.patch('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    try {
        const session = await prisma.session.update({
            where: { id, userId },
            data: { title },
        });
        res.json(session);
    } catch (e) {
        res.status(404).json({ error: 'Session not found' });
    }
});

module.exports = router;
