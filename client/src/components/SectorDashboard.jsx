import React, { useState, useEffect } from 'react';
import { fetchSectors } from '../services/api';

const SectorDashboard = () => {
    const [sectors, setSectors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    return (
        <div className="space-y-8">
            {/* Heatmap Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Sector Heatmap (YTD Performance)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {sectors.map((sector) => {
                        const ytd = sector.performance?.ytd || 0;
                        // Color scale
                        let bgClass = 'bg-gray-100';
                        if (ytd > 20) bgClass = 'bg-green-600 text-white';
                        else if (ytd > 10) bgClass = 'bg-green-500 text-white';
                        else if (ytd > 0) bgClass = 'bg-green-400 text-white';
                        else if (ytd > -5) bgClass = 'bg-red-300 text-gray-900';
                        else if (ytd > -15) bgClass = 'bg-red-400 text-white';
                        else bgClass = 'bg-red-600 text-white';

                        return (
                            <div key={sector.name} className={`${bgClass} p-4 rounded-lg flex flex-col items-center justify-center text-center transition-transform hover:scale-105 cursor-default`}>
                                <div className="text-xs font-semibold opacity-90 uppercase tracking-wider mb-1">{sector.name}</div>
                                <div className="text-lg font-bold">{ytd > 0 ? '+' : ''}{ytd.toFixed(1)}%</div>
                                <div className="text-xs opacity-75">{sector.etf}</div>
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
