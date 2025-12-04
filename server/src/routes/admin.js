const express = require('express');
const os = require('os');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getCacheStats, clearCache, updateCacheConfig } = require('../services/cache');
const llm = require('../services/llm');
const { updateLLMConfig } = llm;
const { getMetrics, resetMetrics } = require('../services/metrics');

const router = express.Router();
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

    const cacheStats = getCacheStats(llm.getCurrentModel());
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
        currentModel: llm.getCurrentModel(),
        maxContextMessages: llm.getMaxContextMessages(),
        maxResponseLength: llm.getMaxResponseLength(),
    });
});

router.post('/config', async (req, res) => {
    const { model, contextLength, responseLength, cacheMax, cacheTTL } = req.body;

    if (model || contextLength || responseLength) {
        try {
            await updateLLMConfig(model, Number(contextLength), Number(responseLength));
        } catch (error) {
            console.error('Error updating LLM config:', error);
            return res.status(500).json({ success: false, message: 'Failed to load model: ' + error.message });
        }
    }

    if (cacheMax || cacheTTL) {
        updateCacheConfig(Number(cacheMax), Number(cacheTTL));
    }

    res.json({ success: true, message: 'Configuration updated' });
});

router.post('/cache/clear', (req, res) => {
    clearCache(llm.getCurrentModel());
    res.json({ success: true, message: 'Cache cleared' });
});

router.post('/metrics/reset', (req, res) => {
    resetMetrics();
    res.json({ success: true, message: 'Metrics reset' });
});

module.exports = router;
