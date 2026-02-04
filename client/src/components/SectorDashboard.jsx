import React, { useState, useEffect } from 'react';
import { fetchSectors } from '../services/api';

const Sparkline = ({ data }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Generate path
    const points = data.map((val, idx) => {
        const x = (idx / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 100;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
};

const SectorDashboard = () => {
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTimeframe, setActiveTimeframe] = useState('today'); // 'today', '1week', 'ytd'

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
                        // Color scale (dynamic ranges)
                        let bgClass = 'bg-gray-100';

                        // Slightly stricter scale for YTD vs Today
                        if (activeTimeframe === 'ytd') {
                            if (val > 20) bgClass = 'bg-green-600 text-white';
                            else if (val > 10) bgClass = 'bg-green-500 text-white';
                            else if (val > 0) bgClass = 'bg-green-400 text-white';
                            else if (val > -5) bgClass = 'bg-red-300 text-gray-900';
                            else if (val > -15) bgClass = 'bg-red-400 text-white';
                            else bgClass = 'bg-red-600 text-white';
                        } else {
                            // Scale for daily/weekly (smaller moves)
                            if (val > 3) bgClass = 'bg-green-600 text-white';
                            else if (val > 1.5) bgClass = 'bg-green-500 text-white';
                            else if (val > 0) bgClass = 'bg-green-400 text-white';
                            else if (val > -1.5) bgClass = 'bg-red-300 text-gray-900';
                            else if (val > -3) bgClass = 'bg-red-400 text-white';
                            else bgClass = 'bg-red-600 text-white';
                        }

                        return (
                            <div key={sector.name} className={`${bgClass} relative p-4 rounded-lg flex flex-col items-center justify-center text-center transition-transform hover:scale-105 cursor-default overflow-hidden`}>
                                {/* Sparkline Background */}
                                {sector.performance?.sparkline && (
                                    <div className="absolute inset-x-0 bottom-0 h-full opacity-25 p-0 pointer-events-none">
                                        <Sparkline data={sector.performance.sparkline} />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="relative z-10">
                                    <div className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">{sector.name}</div>
                                    <div className="text-lg font-bold">{val > 0 ? '+' : ''}{val.toFixed(2)}%</div>
                                    <div className="text-xs opacity-75">{sector.etf}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sector Details & Leaders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectors.map((sector) => (
                    <div key={sector.name} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <h3 className="font-bold text-gray-900">{sector.name}</h3>
                                    <div className="text-xs text-gray-500">{sector.etf} Benchmark</div>
                                </div>
                            </div>
                            {/* Performance Row */}
                            <div className="flex gap-2">
                                <div className={`flex-1 px-2 py-1.5 rounded text-center ${sector.performance?.todayChange >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    <div className="text-xs text-gray-500 font-medium">Today</div>
                                    <div className="text-sm font-bold">
                                        {sector.performance?.todayChange > 0 ? '+' : ''}{sector.performance?.todayChange?.toFixed(1)}%
                                    </div>
                                </div>
                                <div className={`flex-1 px-2 py-1.5 rounded text-center ${sector.performance?.oneWeek >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    <div className="text-xs text-gray-500 font-medium">1 Week</div>
                                    <div className="text-sm font-bold">
                                        {sector.performance?.oneWeek > 0 ? '+' : ''}{sector.performance?.oneWeek?.toFixed(1)}%
                                    </div>
                                </div>
                                <div className={`flex-1 px-2 py-1.5 rounded text-center ${sector.performance?.ytd >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    <div className="text-xs text-gray-500 font-medium">YTD</div>
                                    <div className="text-sm font-bold">
                                        {sector.performance?.ytd > 0 ? '+' : ''}{sector.performance?.ytd?.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Market Leaders</div>
                            <div className="space-y-3">
                                {sector.leaders.map((leader) => (
                                    <div key={leader.symbol} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {leader.symbol[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{leader.symbol}</div>
                                                <div className="text-xs text-gray-500 truncate w-24">{leader.name}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">${leader.price?.toFixed(2)}</div>
                                            <div className={`text-xs ${leader.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {leader.change >= 0 ? '+' : ''}{leader.change?.toFixed(2)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sector.leaders.length === 0 && (
                                    <div className="text-sm text-gray-400 italic">No leaders data available</div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SectorDashboard;
