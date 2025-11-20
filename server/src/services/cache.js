const { LRUCache } = require('lru-cache');

const options = {
    max: 500,
    ttl: 1000 * 60 * 60, // 1 hour
};

const responseCache = new LRUCache(options);

const getCacheStats = () => {
    return {
        size: responseCache.size,
        max: responseCache.max,
        ttl: responseCache.ttl,
    };
};

const clearCache = () => {
    responseCache.clear();
};

const updateCacheConfig = (max, ttl) => {
    // responseCache.max = max;
    // responseCache.ttl = ttl;
    console.warn('Dynamic cache update not supported with current lru-cache version');
};

module.exports = { responseCache, getCacheStats, clearCache, updateCacheConfig };
