import React, { useState, useEffect } from 'react';
import { fetchMarketOutlook } from '../services/api';

const HomeDashboard = ({ portfolioSummary, setActiveTab }) => {
    const [outlook, setOutlook] = useState(null);
    const [loadingOutlook, setLoadingOutlook] = useState(true);
    const [loadingError, setLoadingError] = useState(null);

    useEffect(() => {
        const loadOutlook = async () => {
            try {
                const data = await fetchMarketOutlook();
                setOutlook(data);
                setLoadingError(null);
            } catch (e) {
                console.error("Failed to load market outlook", e);
                setLoadingError(e.message);
            } finally {
                setLoadingOutlook(false);
            }
        };
        loadOutlook();
    }, []);

    const getSentimentColor = (sentiment) => {
        switch (sentiment) {
            case 'BULLISH': return 'bg-green-100 text-green-800 border-green-200';
            case 'BEARISH': return 'bg-red-100 text-red-800 border-red-200';
            case 'VOLATILE': return 'bg-amber-100 text-amber-800 border-amber-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getSentimentIcon = (sentiment) => {
        switch (sentiment) {
            case 'BULLISH': return '🚀';
            case 'BEARISH': return '🐻';
            case 'VOLATILE': return '⚡';
            default: return '⚖️';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</h1>
                    <p className="text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: AI Market Outlook (Spans 2 cols) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* AI Market Widget */}
                    <div className="bg-white rounded-xl shadow-sm border border-indigo-100 overflow-hidden relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <svg className="w-32 h-32 text-indigo-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                        </div>

                        <div className="p-6 relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">AI Daily Briefing</h2>
                                {loadingOutlook ? (
                                    <span className="text-xs text-gray-400 animate-pulse ml-auto bg-gray-50 px-2 py-1 rounded">Analyzing...</span>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setLoadingOutlook(true);
                                            fetchMarketOutlook(true).then(data => {
                                                setOutlook(data);
                                                setLoadingOutlook(false);
                                            }).catch(err => {
                                                console.error(err);
                                                setLoadingOutlook(false);
                                            });
                                        }}
                                        className="ml-auto p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                                        title="Force Refresh Analysis"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {loadingOutlook ? (
                                <div className="space-y-3 animate-pulse">
                                    <div className="h-6 bg-gray-100 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                        <div className="h-16 bg-gray-50 rounded"></div>
                                        <div className="h-16 bg-gray-50 rounded"></div>
                                        <div className="h-16 bg-gray-50 rounded"></div>
                                    </div>
                                </div>
                            ) : outlook ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${getSentimentColor(outlook.sentiment)}`}>
                                            {getSentimentIcon(outlook.sentiment)} {outlook.sentiment}
                                        </span>
                                        <p className="text-sm font-medium text-gray-700">{outlook.prediction}</p>
                                    </div>

                                    <p className="text-sm text-gray-600 leading-relaxed bg-indigo-50/50 p-3 rounded-lg border border-indigo-50">
                                        {outlook.reasoning}
                                    </p>

                                    {/* Indices Mini-Ticker */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                                        {outlook.indices?.map(idx => (
                                            <div key={idx.symbol} className="bg-gray-50 rounded p-2 text-center border border-gray-100">
                                                <div className="text-xs font-bold text-gray-500">{idx.name.replace('SPDR S&P 500 ETF Trust', 'S&P 500').replace('Invesco QQQ Trust', 'NASDAQ').replace('SPDR Dow Jones Industrial Average ETF Trust', 'DOW').replace('CBOE Volatility Index', 'VIX')}</div>
                                                <div className={`text-sm font-semibold ${idx.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {idx.changePercent >= 0 ? '+' : ''}{idx.changePercent?.toFixed(2)}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Key Drivers</p>
                                        <ul className="space-y-1">
                                            {outlook.keyDrivers?.map((driver, i) => (
                                                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                                    <span className="text-indigo-400 mt-0.5">•</span> {driver}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Strategies Recommendations */}
                                    {outlook.strategies && outlook.strategies.length > 0 && (
                                        <div className={`mt-4 pt-3 border-t ${outlook.sentiment === 'BEARISH' ? 'border-red-100' : outlook.sentiment === 'BULLISH' ? 'border-green-100' : 'border-gray-100'}`}>
                                            <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${outlook.sentiment === 'BEARISH' ? 'text-red-500' : outlook.sentiment === 'BULLISH' ? 'text-green-600' : 'text-gray-500'}`}>
                                                Strategies Recommendations (AI)
                                            </p>
                                            <div className="space-y-2">
                                                {outlook.strategies.map((strategy, i) => (
                                                    <div key={i} className={`p-2 rounded border text-xs flex items-start gap-2 ${outlook.sentiment === 'BEARISH' ? 'bg-red-50 border-red-100 text-red-800' : outlook.sentiment === 'BULLISH' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                                                        <span className="mt-0.5 text-xs">💡</span>
                                                        <span>{strategy}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    <p>Unable to load market outlook.</p>
                                    {outlook === null && (
                                        <div className="text-xs text-red-400 mt-1 px-4">
                                            <p>Error: {loadingError || "Unknown Error"}</p>
                                            <p className="mt-1 opacity-75">Check network or API keys.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions Grid */}
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Quick Navigation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <button onClick={() => setActiveTab('events')} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all text-left group">
                            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-indigo-600">
                                <span className="text-xl">🌍</span>
                            </div>
                            <div className="font-bold text-gray-900">Events Tracking</div>
                            <div className="text-xs text-gray-500 mt-1">Monitor Black Swans & Gray Rhinos</div>
                        </button>

                        <button onClick={() => setActiveTab('focus-list')} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all text-left group">
                            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="font-bold text-gray-900">Focus List</div>
                            <div className="text-xs text-gray-500 mt-1">Manage active trade setups</div>
                        </button>

                        <button onClick={() => setActiveTab('sectors')} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group">
                            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </div>
                            <div className="font-bold text-gray-900">Market Sectors</div>
                            <div className="text-xs text-gray-500 mt-1">Analyze sector performance</div>
                        </button>

                        <button onClick={() => setActiveTab('portfolio')} className="bg-white p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all text-left group">
                            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="font-bold text-gray-900">My Portfolio</div>
                            <div className="text-xs text-gray-500 mt-1">Deep dive into holdings</div>
                        </button>
                    </div>
                </div>

                {/* Right Column: Portfolio Snapshot */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Portfolio Snapshot</h3>

                        <div className="mb-6">
                            <div className="text-xs text-gray-400 font-medium mb-1">Total Value</div>
                            <div className="text-3xl font-bold text-gray-900">
                                ${portfolioSummary.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-3 rounded-lg border ${portfolioSummary.totalGainLoss >= 0 ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                <div className="text-xs font-medium opacity-75">All Time Return</div>
                                <div className="text-lg font-bold">
                                    {portfolioSummary.totalGainLoss >= 0 ? '+' : ''}{portfolioSummary.totalGainLossPercent?.toFixed(2)}%
                                </div>
                                <div className="text-xs font-medium">
                                    {portfolioSummary.totalGainLoss >= 0 ? '+' : ''}${portfolioSummary.totalGainLoss?.toLocaleString()}
                                </div>
                            </div>

                            <div className="p-3 rounded-lg border bg-gray-50 border-gray-100 text-gray-800">
                                <div className="text-xs font-medium opacity-75">Invested</div>
                                <div className="text-lg font-bold">
                                    ${portfolioSummary.totalCost?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <div className="text-xs font-medium text-gray-500">
                                    {portfolioSummary.stockCount} Positions
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <button onClick={() => setActiveTab('portfolio')} className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2">
                                View Full Portfolio
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeDashboard;
