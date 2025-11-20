// Metrics tracking service
const metricsData = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    responseTimes: [],
    maxResponseTimeSamples: 100 // Keep last 100 response times
};

const trackRequest = () => {
    metricsData.totalRequests++;
};

const trackCacheHit = () => {
    metricsData.cacheHits++;
};

const trackCacheMiss = () => {
    metricsData.cacheMisses++;
};

const trackResponseTime = (timeMs) => {
    metricsData.responseTimes.push(timeMs);
    // Keep only last N samples
    if (metricsData.responseTimes.length > metricsData.maxResponseTimeSamples) {
        metricsData.responseTimes.shift();
    }
};

const getMetrics = () => {
    const totalCacheOps = metricsData.cacheHits + metricsData.cacheMisses;
    const hitRate = totalCacheOps > 0
        ? Math.round((metricsData.cacheHits / totalCacheOps) * 100)
        : 0;

    const avgResponseTime = metricsData.responseTimes.length > 0
        ? Math.round(metricsData.responseTimes.reduce((a, b) => a + b, 0) / metricsData.responseTimes.length)
        : 0;

    return {
        totalRequests: metricsData.totalRequests,
        cacheHits: metricsData.cacheHits,
        cacheMisses: metricsData.cacheMisses,
        cacheHitRate: hitRate,
        avgResponseTime,
        responseTimeSamples: metricsData.responseTimes.length
    };
};

const resetMetrics = () => {
    metricsData.totalRequests = 0;
    metricsData.cacheHits = 0;
    metricsData.cacheMisses = 0;
    metricsData.responseTimes = [];
};

module.exports = {
    trackRequest,
    trackCacheHit,
    trackCacheMiss,
    trackResponseTime,
    getMetrics,
    resetMetrics
};
