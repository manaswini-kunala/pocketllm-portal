
const path = require('path');

async function downloadModels() {
    console.log('Starting model pre-download...');

    const { pipeline, env } = await import('@xenova/transformers');

    // Set cache directory to a fixed location in the project
    env.cacheDir = path.join(__dirname, '../models');
    console.log(`Cache directory set to: ${env.cacheDir}`);

    const models = [
        'Xenova/Qwen1.5-0.5B-Chat',
        // Add other models here if needed, e.g., 'Xenova/TinyLlama-1.1B-Chat-v1.0'
    ];

    for (const model of models) {
        console.log(`Downloading ${model}...`);
        try {
            // Initialize pipeline to trigger download
            await pipeline('text-generation', model);
            console.log(`✓ Successfully downloaded ${model}`);
        } catch (error) {
            console.error(`✗ Failed to download ${model}:`, error);
            process.exit(1);
        }
    }

    console.log('All models downloaded successfully.');
}

downloadModels();
