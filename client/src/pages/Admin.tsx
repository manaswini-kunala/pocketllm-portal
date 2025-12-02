import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Activity, Server, Database, Save, Trash2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'model' | 'cache'>('overview');
    const [metrics, setMetrics] = useState<any>(null);
    const loadedOnceRef = useRef(false);


    const AVAILABLE_MODELS = [
        { id: "Xenova/Qwen1.5-0.5B-Chat",     label: "Qwen 1.5 - 0.5B Chat (fast)" },
        { id: "Xenova/Qwen1.5-1.8B-Chat",     label: "Qwen 1.5 - 1.8B Chat (better reasoning)" },
        // { id: "Xenova/Phi-3-mini-4k-instruct",label: "Phi-3 Mini 4k Instruct" },
        { id: "Xenova/TinyLlama-1.1B-Chat-v1.0", label: "TinyLlama 1.1B Chat" },
        // { id: "Xenova/distilgpt2",            label: "distilGPT2 (tiny baseline)" },
        // { id: "Xenova/gpt2",                  label: "GPT-2 (classic baseline)" }
        // { id: "Xenova/opt-350m",            label: "OPT-350M (Stable)" },
        // { id: "Xenova/opt-1.3b",            label: "OPT-1.3B (Medium)" }
      ];
      
    const [config, setConfig] = useState({
        model: '',
        contextLength: 10,
        responseLength: 512,
        cacheMax: 500,
        cacheTTL: 3600000
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchMetrics = async () => {
        try {
            const res = await api.get('/admin/metrics');
            setMetrics(res.data);
            // Only set config once to avoid overwriting user edits if we were to sync fully, 
            // but here we just sync initial values if needed or keep them separate.
            // For simplicity, let's just load them into the form if it's the first load
            if (!loadedOnceRef.current) {
                setConfig({
                    model: res.data.currentModel,
                    contextLength: res.data.maxContextMessages,
                    responseLength: res.data.maxResponseLength,
                    cacheMax: res.data.cacheStats.max,
                    cacheTTL: res.data.cacheStats.ttl
                });
            
                loadedOnceRef.current = true;
            }
            
            
        } catch (err) {
            console.error('Failed to fetch metrics', err);
            // If unauthorized, redirect
            navigate('/chat');
        }
    };

    const handleSaveConfig = async () => {
        try {
            await api.post('/admin/config', config);
            await fetchMetrics(); // force refresh
            alert('Configuration saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save config');
        }
    };
    

    const handleClearCache = async () => {
        if (!confirm('Are you sure you want to clear the cache?')) return;
        try {
            await api.post('/admin/cache/clear');
            alert('Cache cleared!');
            fetchMetrics();
        } catch (err) {
            console.error(err);
        }
    };

    if (!metrics) return <div className="p-8 text-center">Loading Admin Dashboard...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* Sidebar */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center gap-2">
                    <button onClick={() => navigate('/chat')} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="font-bold text-xl text-gray-800">Admin</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'overview' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Activity size={18} /> Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('model')}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'model' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Server size={18} /> Model & Limits
                    </button>
                    <button
                        onClick={() => setActiveTab('cache')}
                        className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'cache' ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        <Database size={18} /> Cache
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">System Overview</h2>

                        {/* System Metrics */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">System Resources</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <MetricCard
                                    title="CPU Usage"
                                    value={`${metrics.cpuUsage}%`}
                                    subValue={`Load: ${metrics.cpuLoadAvg} (${metrics.cpuCores} cores)`}
                                    icon={<Activity className="text-blue-500" />}
                                />
                                <MetricCard
                                    title="Memory Usage"
                                    value={`${metrics.memoryUsage}%`}
                                    subValue={`${metrics.memoryUsedMB} / ${metrics.memoryTotalMB} MB`}
                                    icon={<Server className="text-purple-500" />}
                                />
                                <MetricCard
                                    title="Cache Size"
                                    value={metrics.cacheStats.size}
                                    subValue={`Max: ${metrics.cacheStats.max}`}
                                    icon={<Database className="text-green-500" />}
                                />
                            </div>
                        </div>

                        {/* Application Metrics */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Application Performance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard
                                    title="Total Requests"
                                    value={metrics.appMetrics.totalRequests}
                                    subValue="Since last reset"
                                />
                                <MetricCard
                                    title="Cache Hit Rate"
                                    value={`${metrics.appMetrics.cacheHitRate}%`}
                                    subValue={`${metrics.appMetrics.cacheHits} hits / ${metrics.appMetrics.cacheMisses} misses`}
                                />
                                <MetricCard
                                    title="Avg Response Time"
                                    value={`${metrics.appMetrics.avgResponseTime}ms`}
                                    subValue={`${metrics.appMetrics.responseTimeSamples} samples`}
                                />
                                <MetricCard
                                    title="Current Model"
                                    value={metrics.currentModel.split('/')[1] || metrics.currentModel}
                                    subValue={metrics.currentModel.split('/')[0]}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'model' && (
                    <div className="max-w-2xl space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Model Configuration</h2>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hugging Face Model
                    </label>

                    <select
                    value={config.model}
                    onChange={e => setConfig({ ...config, model: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                    {AVAILABLE_MODELS.map(m => (
                        <option key={m.id} value={m.id}>
                        {m.label}
                        </option>
                    ))}
                    </select>

                    <p className="text-xs text-gray-500 mt-1">
                    Select a model to load into Pocket LLM (only supported Xenova models shown)
                    </p>
                </div>
                </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Context (Messages)</label>
                                    <input
                                        type="number"
                                        value={config.contextLength}
                                        onChange={e => setConfig({ ...config, contextLength: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Response Tokens</label>
                                    <input
                                        type="number"
                                        value={config.responseLength}
                                        onChange={e => setConfig({ ...config, responseLength: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleSaveConfig}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cache' && (
                    <div className="max-w-2xl space-y-6">
                        <h2 className="text-2xl font-bold text-gray-800">Cache Management</h2>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Current Items</p>
                                    <p className="text-2xl font-bold text-gray-900">{metrics.cacheStats.size}</p>
                                </div>
                                <button
                                    onClick={handleClearCache}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-md transition"
                                >
                                    <Trash2 size={18} /> Clear Cache
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Items</label>
                                    <input
                                        type="number"
                                        value={config.cacheMax}
                                        onChange={e => setConfig({ ...config, cacheMax: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">TTL (ms)</label>
                                    <input
                                        type="number"
                                        value={config.cacheTTL}
                                        onChange={e => setConfig({ ...config, cacheTTL: Number(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    onClick={handleSaveConfig}
                                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                                >
                                    <Save size={18} /> Update Settings
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, subValue, icon, className }: any) => (
    <div className={clsx("bg-white p-6 rounded-xl shadow-sm border border-gray-200", className)}>
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            {icon && <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>}
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            {subValue && <span className="text-sm text-gray-500">{subValue}</span>}
        </div>
    </div>
);

export default Admin;
