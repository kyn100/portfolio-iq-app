import React, { useState, useEffect } from 'react';
import { fetchSectors } from '../services/api';

const Sparkline = ({ data, color }) => {
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

    return (
        <div
            className="relative w-full h-full group cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverData(null)}
        >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <polyline points={areaPath} fill={color} fillOpacity="0.1" stroke="none" />
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
                            r="3"
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
                    <div className="bg-gray-900 text-white text-[10px] py-1 px-2 rounded shadow-xl whitespace-nowrap">
                        <div className="font-bold">
                            {new Date(hoverData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="font-mono">${hoverData.value.toFixed(2)}</div>
                    </div>
                    {/* Tiny triangle pointer */}
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-900 mx-auto"></div>
                </div>
            )}
        </div>
    );
};

const SectorModal = ({ sector, onClose }) => {
    if (!sector) return null;

    // Use full chart history for details
    const chartData = sector.performance?.sparkline || [];
    const perf = sector.performance || {};

    const getColor = (val) => val >= 0 ? 'text-green-600' : 'text-red-600';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100 p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {sector.name}
                            <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{sector.etf}</span>
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
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <div className="text-sm text-gray-500 uppercase font-semibold tracking-wider">Performance Trend</div>
                                <div className="text-xs text-gray-400 mt-1">1 Year Interactive History</div>
                            </div>
                            <div className={`text-4xl font-bold ${getColor(perf.ytd)}`}>
                                {perf.ytd > 0 ? '+' : ''}{perf.ytd?.toFixed(2)}% <span className="text-sm font-medium text-gray-500">YTD Returns</span>
                            </div>
                        </div>
                        <div className="h-72 w-full bg-white rounded-lg border border-gray-200 shadow-inner p-2 relative">
                            {chartData.length > 0 ? (
                                <>
                                    {/* Min/Max Labels Overlay */}
                                    <div className="absolute top-2 right-2 text-[10px] text-gray-400 font-mono">
                                        High: ${Math.max(...chartData.map(d => d.value || 0)).toFixed(2)}
                                    </div>
                                    <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 font-mono">
                                        Low: ${Math.min(...chartData.map(d => d.value || 0)).toFixed(2)}
                                    </div>
                                    <Sparkline data={chartData} color={perf.ytd >= 0 ? '#16a34a' : '#dc2626'} />
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
                            <div key={m.label} className={`p-4 rounded-xl border ${m.val >= 0 ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'} flex flex-col items-center justify-center text-center`}>
                                <div className="text-xs text-gray-500 font-medium uppercase mb-1">{m.label}</div>
                                <div className={`text-2xl font-bold ${getColor(m.val)}`}>
                                    {m.val > 0 ? '+' : ''}{m.val?.toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Leaders List */}
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                            Top Market Movers
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sector.leaders && sector.leaders.map(leader => (
                                <div key={leader.symbol} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all bg-white group cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center font-bold text-gray-600 text-sm border border-gray-100">
                                            {leader.symbol[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-gray-900 group-hover:text-blue-700">{leader.symbol}</div>
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
                                className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-md hover:border-blue-300 transition-all hover:-translate-y-1 h-36 cursor-pointer"
                            >
                                <div className="p-4 pb-0">
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider truncate mr-2" title={sector.name}>{sector.name}</div>
                                        <div className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{sector.etf}</div>
                                    </div>
                                    <div className={`text-2xl font-bold mt-1 ${textClass}`}>
                                        {val > 0 ? '+' : ''}{val.toFixed(2)}%
                                    </div>
                                </div>

                                {/* Area Chart */}
                                <div className="h-14 w-full mt-auto opacity-90">
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
