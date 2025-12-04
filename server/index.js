const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./src/routes/auth');
const chatRoutes = require('./src/routes/chat');
const adminRoutes = require('./src/routes/admin');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/sessions', chatRoutes);
app.use('/api/admin', adminRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const llmService = require('./src/services/llm');

app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);

    // Eager load the model so it's ready for the first user
    try {
        console.log('🚀 Pre-loading LLM model into memory...');
        await llmService.initializeModel();
        console.log('✅ LLM model loaded and ready!');
    } catch (error) {
        console.error('❌ Failed to pre-load LLM model:', error);
    }
});

module.exports = { prisma };
