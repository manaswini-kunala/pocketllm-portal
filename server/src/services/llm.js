// const { pipeline } = require('@xenova/transformers'); // ESM only
const path = require('path');

// Configuration
let currentModel = 'Xenova/Qwen1.5-0.5B-Chat'; // Better reasoning, still fast
let maxContextMessages = 10;
let maxResponseLength = 100; // Balanced: ~70-80 words, ~10-12 seconds, better completeness

// Pipeline instance
let generator = null;

const initializeModel = async () => {
    if (!generator) {
        console.log(`Loading model: ${currentModel}...`);
        const { pipeline } = await import('@xenova/transformers');
        // Use text-generation for Qwen/Llama style models
        generator = await pipeline('text-generation', currentModel);
        console.log('Model loaded successfully.');
    }
};

const updateLLMConfig = (model, contextLen, responseLen) => {
    if (model && model !== currentModel) {
        currentModel = model;
        generator = null; // Force reload
    }
    if (contextLen) maxContextMessages = contextLen;
    if (responseLen) maxResponseLength = responseLen;
};

const generateResponse = async (prompt, context, persona) => {
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
        return_full_text: false // Important for text-generation pipelines
    });

    let responseText = output[0].generated_text;
    return responseText.trim();
};

module.exports = {
    currentModel,
    maxContextMessages,
    maxResponseLength,
    updateLLMConfig,
    generateResponse
};
