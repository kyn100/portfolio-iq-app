import React, { useState, useEffect } from 'react';
import { fetchSectors } from '../services/api';

const Sparkline = ({ data, color, interactive = false }) => {
    const [hoverData, setHoverData] = useState(null);

    // Data must be array of { date, value }
    // If simple numbers passed, mapping will fail, so we handle safety in parent or here
    if (!data || data.length < 2) return null;

    // Handle both object format {date, value} and simple number format fallback
    const normalizedData = typeof data[0] === 'number' ? data.map((v, i) => ({ value: v, date: new Date().toISOString() })) : data;
    const values = normalizedData.map(d => d.value);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Coordinate Helpers
    const getX = (idx) => (idx / (normalizedData.length - 1)) * 100;
    const getY = (val) => 100 - ((val - min) / range) * 80 - 10; // Reserve padding

    const points = values.map((val, idx) => `${getX(idx).toFixed(2)},${getY(val).toFixed(2)}`);
    const linePath = points.join(' ');
    const areaPath = `0,100 ${linePath} 100,100`;

    const handleMouseMove = (e) => {
        if (!interactive) return;
        const svgRect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const relativeX = Math.max(0, Math.min(1, x / svgRect.width));

        const idx = Math.round(relativeX * (normalizedData.length - 1));
        setHoverData({
            ...normalizedData[idx],
            x: getX(idx),
            y: getY(values[idx])
        });
    };

    const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div
            className={`relative w-full h-full group ${interactive ? 'cursor-crosshair' : 'cursor-default'}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverData(null)}
        >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polyline points={areaPath} fill={`url(#${gradientId})`} stroke="none" />
                <polyline
                    points={linePath}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Hover Elements */}
                {hoverData && (
                    <>
                        <line
                            x1={hoverData.x} y1="0"
                            x2={hoverData.x} y2="100"
                            stroke="#6b7280"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            vectorEffect="non-scaling-stroke"
                        />
                        <circle
                            cx={hoverData.x} cy={hoverData.y}
                            r="4"
                            fill={color}
                            stroke="white"
                            strokeWidth="2"
                            vectorEffect="non-scaling-stroke"
                        />
                    </>
                )}
            </svg>

            {/* Tooltip */}
            {hoverData && (
                <div
                    className="absolute bottom-full mb-1 left-0 z-50 pointer-events-none transform -translate-x-1/2"
                    style={{ left: `${hoverData.x}%` }}
                >
                    <div className="bg-gray-900/90 backdrop-blur text-white text-[10px] py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap border border-gray-700">
                        <div className="font-bold mb-0.5">
                            {new Date(hoverData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="font-mono text-base leading-none">${hoverData.value.toFixed(2)}</div>
                    </div>
                    {/* Tiny triangle pointer */}
                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-gray-900/90 mx-auto"></div>
                </div>
            )}
        </div>
    );
};

const SectorModal = ({ sector, onClose }) => {
    if (!sector) return null;

    const [timeframe, setTimeframe] = useState('1y');

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
                                        <div className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{sector.etf}</div>
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
