import React, { useState, useEffect } from 'react';
import { fetchSectors, fetchSectorAnalysis } from '../services/api';

import Sparkline from './Sparkline';

const SectorModal = ({ sector, onClose }) => {
    if (!sector) return null;

    const [timeframe, setTimeframe] = useState('1y');

    // AI Analysis State
    const [analysis, setAnalysis] = useState(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);

    // Fetch AI Analysis on mount
    useEffect(() => {
        if (!sector) return;
        setAnalysis(null);
        setAnalysisError(null);
        setLoadingAnalysis(true);
        fetchSectorAnalysis(sector.name, sector.performance, sector.leaders)
            .then(data => {
                if (!data) throw new Error("No data received from AI service");
                setAnalysis(data);
            })
            .catch(err => {
                console.error("Analysis fetch failed", err);
                setAnalysisError(err.message || "Unknown Fetch Error");
            })
            .finally(() => setLoadingAnalysis(false));
    }, [sector]);

    // Use full chart history for details
    const fullChartData = sector.performance?.sparkline || [];
    const perf = sector.performance || {};

    // Filter Data based on timeframe
    let chartData = fullChartData;
    let displayChange = perf.ytd;
    let changeLabel = 'YTD Returns';

    if (timeframe === '1w') {
        chartData = fullChartData.slice(-5);
        displayChange = perf.oneWeek;
        changeLabel = '1 Week Returns';
    } else if (timeframe === '1m') {
        chartData = fullChartData.slice(-22);
        displayChange = perf.oneMonth;
        changeLabel = '1 Month Returns';
    }

    const getColor = (val) => val >= 0 ? 'text-green-600' : 'text-red-600';
    const chartColor = displayChange >= 0 ? '#16a34a' : '#dc2626';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {sector.name}
                            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{sector.etf}</span>
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Main Chart Section */}
                    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${displayChange >= 0 ? 'from-green-50' : 'from-red-50'} to-transparent rounded-bl-full opacity-50 pointer-events-none`}></div>

                        <div className="flex flex-col md:flex-row justify-between items-end mb-6 relative z-10">
                            <div>
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                                        {['1w', '1m', '1y'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTimeframe(t)}
                                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                            >
                                                {t.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 font-medium tracking-wide uppercase">Performance History</div>
                            </div>
                            <div className={`text-4xl font-bold ${getColor(displayChange)}`}>
                                {displayChange > 0 ? '+' : ''}{displayChange?.toFixed(2)}%
                                <span className="text-sm font-medium text-gray-400 ml-2">{changeLabel}</span>
                            </div>
                        </div>

                        <div className="h-80 w-full min-h-[300px] relative">
                            {chartData.length > 0 ? (
                                <>
                                    {/* Min/Max Labels Overlay */}
                                    <div className="absolute top-0 right-0 text-[10px] text-black/40 font-mono bg-white/50 px-1 rounded">
                                        High: ${Math.max(...chartData.map(d => d.value || 0)).toFixed(2)}
                                    </div>
                                    <div className="absolute bottom-0 right-0 text-[10px] text-black/40 font-mono bg-white/50 px-1 rounded">
                                        Low: ${Math.min(...chartData.map(d => d.value || 0)).toFixed(2)}
                                    </div>
                                    <Sparkline data={chartData} color={chartColor} interactive={true} />
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">No chart data available</div>
                            )}
                        </div>
                    </div>

                    {/* AI Outlook Section */}
                    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden border border-slate-700 mb-6">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    AI Strategic Forecast
                                </div>
                                {loadingAnalysis && <div className="animate-spin w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full"></div>}
                            </div>

                            {loadingAnalysis ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-6 bg-white/10 rounded w-1/3"></div>
                                    <div className="h-4 bg-white/5 rounded w-full"></div>
                                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                                </div>
                            ) : analysis ? (
                                <>
                                    <h3 className="text-xl font-bold mb-2 flex items-center gap-3">
                                        Outlook: <span className={`${analysis.outlook === 'BULLISH' ? 'text-emerald-400' : analysis.outlook === 'BEARISH' ? 'text-rose-400' : 'text-amber-400'} tracking-wide`}>{analysis.outlook}</span>
                                    </h3>
                                    <p className="text-slate-300 text-sm leading-relaxed mb-4">{analysis.summary}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.keys?.map((k, i) => (
                                            <span key={i} className="bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md text-[10px] font-medium text-slate-300 transition-colors cursor-default border border-white/5">
                                                {k}
                                            </span>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-400 text-sm italic px-4 py-8 text-center bg-slate-800/20 rounded-lg border border-slate-700/50">
                                    {analysisError ? (
                                        <span className="text-red-400 flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            {analysisError}
                                        </span>
                                    ) : (
                                        "AI Analysis unavailable. Verify API Key."
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "Today", val: perf.todayChange },
                            { label: "1 Week", val: perf.oneWeek },
                            { label: "1 Month", val: perf.oneMonth },
                            { label: "YTD", val: perf.ytd }
                        ].map(m => (
                            <div key={m.label} className={`group p-4 rounded-xl border transition-all hover:shadow-md ${m.val >= 0 ? 'border-green-100 bg-gradient-to-br from-white to-green-50/30' : 'border-red-100 bg-gradient-to-br from-white to-red-50/30'} flex flex-col items-center justify-center text-center`}>
                                <div className="text-xs text-gray-500 font-medium uppercase mb-1 group-hover:text-gray-700">{m.label}</div>
                                <div className={`text-2xl font-bold ${getColor(m.val)}`}>
                                    {m.val > 0 ? '+' : ''}{m.val?.toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Leaders List */}
                    <div className="pt-6 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            </div>
                            Top Market Movers
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sector.leaders && sector.leaders.map(leader => (
                                <div key={leader.symbol} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all bg-white group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 flex items-center justify-center font-bold text-slate-600 text-sm transition-colors">
                                            {leader.symbol[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{leader.symbol}</div>
                                            <div className="text-xs text-gray-500 truncate w-32">{leader.name}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-medium text-gray-900 text-sm">${leader.price?.toFixed(2)}</div>
                                        <div className={`text-xs font-bold ${getColor(leader.change)}`}>
                                            {leader.change > 0 ? '+' : ''}{leader.change?.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SectorDashboard = () => {
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTimeframe, setActiveTimeframe] = useState('today'); // 'today', '1week', 'ytd'
    const [selectedSector, setSelectedSector] = useState(null);
    const [predictions, setPredictions] = useState({}); // { sectorName: { outlook, loading } }

    useEffect(() => {
        const loadSectors = async () => {
            try {
                const data = await fetchSectors();
                setSectors(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadSectors();
    }, []);

    // Fetch AI predictions for all sectors
    useEffect(() => {
        if (sectors.length === 0) return;

        sectors.forEach(sector => {
            // Skip if already loaded or loading
            if (predictions[sector.name]) return;

            setPredictions(prev => ({ ...prev, [sector.name]: { loading: true } }));

            fetchSectorAnalysis(sector.name, sector.performance, sector.leaders)
                .then(data => {
                    setPredictions(prev => ({
                        ...prev,
                        [sector.name]: { outlook: data?.outlook || 'NEUTRAL', loading: false }
                    }));
                })
                .catch(() => {
                    setPredictions(prev => ({
                        ...prev,
                        [sector.name]: { outlook: null, loading: false }
                    }));
                });
        });
    }, [sectors]);

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return <div className="text-red-500 p-6">{error}</div>;

    // Helper to get value based on timeframe
    const getValue = (sector) => {
        const perf = sector.performance || {};
        switch (activeTimeframe) {
            case '1week': return perf.oneWeek || 0;
            case 'ytd': return perf.ytd || 0;
            case 'today': default: return perf.todayChange || 0;
        }
    };

    const getLabel = () => {
        switch (activeTimeframe) {
            case '1week': return '1 Week Performance';
            case 'ytd': return 'YTD Performance';
            case 'today': default: return 'Today\'s Performance';
        }
    };

    return (
        <div className="space-y-8">
            {/* Heatmap Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <h2 className="text-lg font-bold text-gray-900">Sector Heatmap ({getLabel()})</h2>

                    {/* Timeframe Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTimeframe('today')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTimeframe === 'today'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setActiveTimeframe('1week')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTimeframe === '1week'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            1 Week
                        </button>
                        <button
                            onClick={() => setActiveTimeframe('ytd')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTimeframe === 'ytd'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            YTD
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {sectors.map((sector) => {
                        const val = getValue(sector);

                        // Dynamic Sparkline Slicing
                        let chartData = [];
                        if (sector.performance?.sparkline) {
                            const raw = sector.performance.sparkline;
                            // Check if objects (new API) or numbers (old API cache safety)
                            const isObject = raw.length > 0 && typeof raw[0] === 'object';

                            if (isObject) {
                                if (activeTimeframe === 'ytd') {
                                    const year = new Date().getFullYear();
                                    chartData = raw.filter(d => new Date(d.date).getFullYear() === year);
                                } else if (activeTimeframe === '1week') {
                                    // Show 1 Week Trend (5 days)
                                    chartData = raw.slice(-5);
                                } else {
                                    // Show 1 Month Trend (approx 22 trading days) for 'Today' tab context
                                    chartData = raw.slice(-22);
                                }
                            } else {
                                chartData = raw;
                            }
                        }

                        // Color styling
                        let colorHex = '#6b7280'; // gray-500
                        let textClass = 'text-gray-900';

                        if (val > 0) {
                            colorHex = '#16a34a'; // green-600
                            textClass = 'text-green-600';
                        } else if (val < 0) {
                            colorHex = '#dc2626'; // red-600
                            textClass = 'text-red-600';
                        }

                        return (
                            <div
                                key={sector.name}
                                onClick={() => setSelectedSector(sector)}
                                className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-xl hover:border-blue-400 transition-all hover:-translate-y-1 h-36 cursor-pointer group"
                            >
                                <div className="p-4 pb-0 relative z-10">
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate mr-2" title={sector.name}>{sector.name}</div>
                                        <div className="flex items-center gap-1">
                                            {/* AI Prediction Icon */}
                                            {predictions[sector.name]?.loading ? (
                                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"></div>
                                            ) : predictions[sector.name]?.outlook && (
                                                <div
                                                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${predictions[sector.name].outlook === 'BULLISH'
                                                        ? 'bg-emerald-100 text-emerald-600'
                                                        : predictions[sector.name].outlook === 'BEARISH'
                                                            ? 'bg-rose-100 text-rose-600'
                                                            : 'bg-amber-100 text-amber-600'
                                                        }`}
                                                    title={`AI Forecast: ${predictions[sector.name].outlook}`}
                                                >
                                                    {predictions[sector.name].outlook === 'BULLISH' ? '↑' : predictions[sector.name].outlook === 'BEARISH' ? '↓' : '→'}
                                                </div>
                                            )}
                                            <div className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{sector.etf}</div>
                                        </div>
                                    </div>
                                    <div className={`text-2xl font-bold mt-1 ${textClass}`}>
                                        {val > 0 ? '+' : ''}{val.toFixed(2)}%
                                    </div>
                                </div>

                                {/* Area Chart */}
                                <div className="h-16 w-full mt-auto">
                                    {chartData.length > 0 ? (
                                        <Sparkline data={chartData} color={colorHex} />
                                    ) : (
                                        <div className="h-full bg-gray-50 border-t border-gray-100"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Detailed Modal */}
            <SectorModal sector={selectedSector} onClose={() => setSelectedSector(null)} />
        </div>
    );
};

export default SectorDashboard;
