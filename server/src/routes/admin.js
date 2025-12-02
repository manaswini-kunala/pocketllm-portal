const express = require('express');
const os = require('os');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getCacheStats, clearCache, updateCacheConfig } = require('../services/cache');
const { currentModel, maxContextMessages, maxResponseLength, updateLLMConfig } = require('../services/llm');
const { getMetrics, resetMetrics } = require('../services/metrics');

const router = express.Router();
const llm = require('../services/llm');
router.use(authenticateToken);
router.use(requireAdmin);

router.get('/metrics', (req, res) => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = Math.round((usedMem / totalMem) * 100);

    // CPU Load converted to percentage
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const cpuUsagePercent = Math.min(Math.round((loadAvg / cpuCount) * 100), 100);

    const cacheStats = getCacheStats();
    const appMetrics = getMetrics();

    res.json({
        cpuUsage: cpuUsagePercent, // Now as percentage
        cpuLoadAvg: loadAvg.toFixed(2), // Keep raw load for reference
        cpuCores: cpuCount,
        memoryUsage: memUsage, // Percentage
        memoryUsedMB: Math.round(usedMem / 1024 / 1024),
        memoryTotalMB: Math.round(totalMem / 1024 / 1024),
        cacheStats,
        appMetrics,
        currentModel,
        maxContextMessages,
        maxResponseLength,
        currentModel: llm.getCurrentModel(),
        maxContextMessages: llm.getMaxContextMessages(),
        maxResponseLength: llm.getMaxResponseLength(),
        // cacheStats: cache.stats()
    });
});

router.post('/config', (req, res) => {
    const { model, contextLength, responseLength, cacheMax, cacheTTL } = req.body;

    if (model || contextLength || responseLength) {
        updateLLMConfig(model, Number(contextLength), Number(responseLength));
    }

    if (cacheMax || cacheTTL) {
        updateCacheConfig(Number(cacheMax), Number(cacheTTL));
    }

    res.json({ success: true, message: 'Configuration updated' });
});

router.post('/cache/clear', (req, res) => {
    clearCache();
    res.json({ success: true, message: 'Cache cleared' });
});

router.post('/metrics/reset', (req, res) => {
    resetMetrics();
    res.json({ success: true, message: 'Metrics reset' });
});

module.exports = router;
