const { LRUCache } = require('lru-cache');

// Default options
let cacheOptions = {
    max: 500,
    ttl: 1000 * 60 * 60, // 1 hour
};

// Map to store caches for each model
const modelCaches = new Map();

const getCacheForModel = (modelId) => {
    if (!modelId) return null;
    if (!modelCaches.has(modelId)) {
        console.log(`Creating new cache for model: ${modelId}`);
        modelCaches.set(modelId, new LRUCache(cacheOptions));
    }
    return modelCaches.get(modelId);
};

const getCacheStats = (modelId) => {
    const cache = getCacheForModel(modelId);
    if (!cache) return { size: 0, max: cacheOptions.max, ttl: cacheOptions.ttl };

    return {
        size: cache.size,
        max: cache.max,
        ttl: cache.ttl,
    };
};

const clearCache = (modelId) => {
    if (modelId) {
        const cache = modelCaches.get(modelId);
        if (cache) {
            cache.clear();
            console.log(`Cache cleared for model: ${modelId}`);
        }
    } else {
        // Clear all
        modelCaches.forEach(cache => cache.clear());
        console.log('All caches cleared');
    }
};

const updateCacheConfig = (max, ttl) => {
    // Check if config actually changed
    if (max === cacheOptions.max && ttl === cacheOptions.ttl) {
        console.log('Cache config unchanged, skipping reset.');
        return;
    }

    cacheOptions = {
        max: max || 500,
        ttl: ttl || 1000 * 60 * 60
    };

    // Re-create all existing caches with new config
    // Note: This still clears them, but now for all models
    for (const [modelId, _] of modelCaches) {
        modelCaches.set(modelId, new LRUCache(cacheOptions));
    }
    console.log(`Cache config updated: max=${max}, ttl=${ttl}. All caches reset.`);
};

module.exports = { getCacheForModel, getCacheStats, clearCache, updateCacheConfig };
