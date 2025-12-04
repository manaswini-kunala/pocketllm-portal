// const { pipeline } = require('@xenova/transformers'); // ESM only
const path = require('path');

// Configuration
let currentModel = 'Xenova/Qwen1.5-0.5B-Chat'; // Better reasoning, still fast
let maxContextMessages = 10;
let maxResponseLength = 256; // Shorter, more concise responses

// Pipeline instance
let generator = null;

let loadingPromise = null;

const initializeModel = async () => {
    if (generator) return;

    if (loadingPromise) {
        await loadingPromise;
        return;
    }

    loadingPromise = (async () => {
        try {
            console.log(`Loading model: ${currentModel}...`);
            const { pipeline, env } = await import('@xenova/transformers');

            // Set cache directory to match the one used in build
            env.cacheDir = path.join(__dirname, '../../models');

            // Use text-generation for Qwen/Llama style models
            const newGenerator = await pipeline('text-generation', currentModel);

            // Warmup
            console.log('Performing warmup generation...');
            await newGenerator("Hello", {
                max_new_tokens: 1,
                do_sample: false,
                return_full_text: false
            });
            console.log('Warmup complete.');

            generator = newGenerator;
            console.log('Model loaded successfully.');
        } catch (error) {
            console.error('Failed to initialize model:', error);
            throw error;
        } finally {
            loadingPromise = null;
        }
    })();

    await loadingPromise;
};

const updateLLMConfig = async (model, contextLen, responseLen) => {
    if (model && model !== currentModel) {
        currentModel = model;

        if (generator) {
            console.log('Disposing old model...');
            const memBefore = process.memoryUsage();
            console.log(`Memory before disposal: RSS=${Math.round(memBefore.rss / 1024 / 1024)}MB, Heap=${Math.round(memBefore.heapUsed / 1024 / 1024)}MB`);

            // Attempt to dispose if method exists (common in some libraries, or just help GC)
            if (typeof generator.dispose === 'function') {
                await generator.dispose();
            }
            generator = null;

            // Force garbage collection if exposed (usually not in default Node, but good practice to clear refs)
            if (global.gc) {
                global.gc();
                // Give GC some time to actually reclaim memory
                console.log('Waiting for GC...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const memAfter = process.memoryUsage();
            console.log(`Memory after disposal: RSS=${Math.round(memAfter.rss / 1024 / 1024)}MB, Heap=${Math.round(memAfter.heapUsed / 1024 / 1024)}MB`);
        }

        console.log(`Model changed to ${model}. Loading now...`);

        try {
            await initializeModel();
            console.log(`Model ${model} loaded successfully.`);

        } catch (error) {
            console.error(`Failed to load model ${model}:`, error);
            throw error;
        }
    }
    if (contextLen) maxContextMessages = contextLen;
    if (responseLen) maxResponseLength = responseLen;
};

const generateResponse = async (prompt, context, persona) => {
    await initializeModel();

    let systemPrompt = "You are a helpful AI assistant. Be concise and to the point.";
    if (persona === 'Formal') systemPrompt = "You are a formal and professional AI assistant.";
    if (persona === 'Friendly') systemPrompt = "You are a friendly and casual AI assistant.";
    if (persona === 'Technical') systemPrompt = "You are a technical expert.";

    // Construct messages array for chat template
    const messages = [
        { role: 'system', content: systemPrompt },
        ...context.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: prompt }
    ];

    // Use the tokenizer's apply_chat_template if available, but for simplicity with Transformers.js 
    // we can manually format for Qwen/ChatML:
    // <|im_start|>system\n...<|im_end|>\n<|im_start|>user\n...<|im_end|>\n<|im_start|>assistant\n

    let fullInput = "";
    messages.forEach(msg => {
        fullInput += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
    });
    fullInput += "<|im_start|>assistant\n";

    console.log('Generating response...');
    const output = await generator(fullInput, {
        max_new_tokens: maxResponseLength,
        temperature: 0.7,
        do_sample: true,
        top_k: 50,
        repetition_penalty: 1.1, // Reduce repetition
        return_full_text: false // Important for text-generation pipelines
    });

    let responseText = output[0].generated_text;
    return responseText.trim();
};

// Stream response progressively (with fallback for models that don't support real streaming)
const generateResponseStream = async (prompt, context, persona, onChunk) => {
    await initializeModel();

    let systemPrompt = "You are a helpful AI assistant.";
    if (persona === 'Formal') systemPrompt = "You are a formal and professional AI assistant.";
    if (persona === 'Friendly') systemPrompt = "You are a friendly and casual AI assistant.";
    if (persona === 'Technical') systemPrompt = "You are a technical expert.";

    // Construct messages array for chat template
    const messages = [
        { role: 'system', content: systemPrompt },
        ...context.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: prompt }
    ];

    let fullInput = "";
    messages.forEach(msg => {
        fullInput += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
    });
    fullInput += "<|im_start|>assistant\n";

    console.log('Generating response (streaming)...');

    // Track if callback is actually being called (some models don't support it)
    let callbackCalled = false;
    let lastDecodedText = "";

    try {
        // Try real streaming first
        const inputTokenIds = generator.tokenizer(fullInput).input_ids;
        lastDecodedText = generator.tokenizer.decode(inputTokenIds, { skip_special_tokens: true });

        const output = await generator(fullInput, {
            max_new_tokens: maxResponseLength,
            temperature: 0.7,
            do_sample: true,
            top_k: 50,
            repetition_penalty: 1.1,
            return_full_text: false,
            callback_function: (beams) => {
                callbackCalled = true;
                const decodedText = generator.tokenizer.decode(beams[0].output_token_ids, {
                    skip_special_tokens: true,
                });

                if (decodedText.length > lastDecodedText.length) {
                    const newPart = decodedText.slice(lastDecodedText.length);
                    onChunk(newPart);
                    lastDecodedText = decodedText;
                }
            }
        });

        let responseText = output[0].generated_text.trim();

        // Handle empty response (common on first generation after load)
        if (!responseText) {
            console.log('⚠️  Empty response on first try, retrying...');
            const retryOutput = await generator(fullInput, {
                max_new_tokens: maxResponseLength,
                temperature: 0.7,
                do_sample: true,
                top_k: 50,
                return_full_text: false
            });
            responseText = retryOutput[0].generated_text.trim();

            if (!responseText) {
                throw new Error('Model returned empty response after retry');
            }

            // Stream the retry response word-by-word
            const words = responseText.split(' ');
            for (let i = 0; i < words.length; i++) {
                const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
                onChunk(chunk);
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        } else {
            // Fallback: If callback was never called, simulate streaming word-by-word
            if (!callbackCalled) {
                console.log('⚠️  Real streaming not supported for this model, using fallback...');
                const words = responseText.split(' ');
                for (let i = 0; i < words.length; i++) {
                    const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
                    onChunk(chunk);
                    // Small delay to simulate streaming
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            } else {
                // Ensure we streamed everything
                if (responseText.length > lastDecodedText.length) {
                    const remaining = responseText.slice(lastDecodedText.length);
                    console.log(`Streaming remaining ${remaining.length} chars...`);
                    onChunk(remaining);
                }
            }
        }

        return responseText;
    } catch (error) {
        console.error('Streaming error:', error);
        throw error;
    }
};

module.exports = {
    getCurrentModel: () => currentModel,
    getMaxContextMessages: () => maxContextMessages,
    getMaxResponseLength: () => maxResponseLength,
    updateLLMConfig,
    generateResponse,
    generateResponseStream,
    initializeModel
};

