import React, { useState } from 'react';
import { fetchRecommendations } from '../services/api';

const AIWatchlistPanel = ({ onAdd }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await fetchRecommendations();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-xl p-8 text-center mb-8 animate-pulse">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-800 font-medium">AI Agent is analyzing market news, trends, and sectors...</p>
            <p className="text-blue-500 text-sm mt-2">Curating top 10 opportunities</p>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8 text-center">
            <p className="text-red-600 font-medium mb-2">Failed to generate recommendations</p>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
                Try Again
            </button>
        </div>
    );

    if (!data) return (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 mb-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    AI Stock Scout
                </h3>
                <p className="text-blue-100 mt-1 opacity-90">Generate a tailored Top 10 Watchlist based on live market conditions.</p>
            </div>
            <button
                onClick={handleGenerate}
                className="mt-4 md:mt-0 px-6 py-2 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
            >
                Generate Recommendations
            </button>
        </div>
    );

    return (
        <div className="mb-10 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 p-1 rounded-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></span>
                    AI Curated Opportunities
                </h3>
                <button onClick={handleGenerate} className="text-sm text-blue-600 hover:underline">Refresh</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Immediate Opportunities */}
                <div className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden">
                    <div className="bg-green-50 px-4 py-3 border-b border-green-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <h4 className="font-bold text-green-900">Immediate Attention</h4>
                        <span className="ml-auto text-xs font-medium text-green-700 bg-green-200/50 px-2 py-0.5 rounded">High Urgency</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {data.immediate.map((stock) => (
                            <div key={stock.symbol} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-start group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">{stock.symbol}</span>
                                        <span className="text-xs text-gray-400">{stock.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{stock.reason}</p>
                                </div>
                                <button
                                    onClick={() => onAdd(stock.symbol)}
                                    className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                    title="Add to Watchlist"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Radar Screen */}
                <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
                    <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        <h4 className="font-bold text-indigo-900">Radar / Close Monitor</h4>
                        <span className="ml-auto text-xs font-medium text-indigo-700 bg-indigo-200/50 px-2 py-0.5 rounded">Wait for Setup</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {data.watchlist.map((stock) => (
                            <div key={stock.symbol} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-start group">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">{stock.symbol}</span>
                                        <span className="text-xs text-gray-400">{stock.name}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">{stock.reason}</p>
                                </div>
                                <button
                                    onClick={() => onAdd(stock.symbol)}
                                    className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                                    title="Add to Watchlist"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIWatchlistPanel;
