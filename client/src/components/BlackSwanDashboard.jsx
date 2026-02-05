import React, { useState, useEffect } from 'react';
import { fetchBlackSwanEvents, fetchStockDetails } from '../services/api';
import Sparkline from './Sparkline';

const BlackSwanDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEvent, setExpandedEvent] = useState(null);
    const [hedgeData, setHedgeData] = useState({});
    const [loadingHedges, setLoadingHedges] = useState({});

    useEffect(() => {
        const loadEvents = async () => {
            try {
                setLoading(true);
                const data = await fetchBlackSwanEvents();
                setEvents(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);

    const handleExpand = async (eventId) => {
        if (expandedEvent === eventId) {
            setExpandedEvent(null);
            return;
        }

        setExpandedEvent(eventId);

        // Fetch hedge data if not already loaded
        const event = events.find(e => e.id === eventId);
        if (event && event.hedges && !hedgeData[eventId]) {
            setLoadingHedges(prev => ({ ...prev, [eventId]: true }));
            try {
                const updatedHedges = {};
                await Promise.all(event.hedges.map(async (hedge) => {
                    try {
                        const details = await fetchStockDetails(hedge.symbol);
                        updatedHedges[hedge.symbol] = details;
                    } catch (e) {
                        console.error(`Failed to fetch details for ${hedge.symbol}`, e);
                        updatedHedges[hedge.symbol] = { error: true };
                    }
                }));
                setHedgeData(prev => ({ ...prev, [eventId]: updatedHedges }));
            } catch (err) {
                console.error("Error fetching hedges", err);
            } finally {
                setLoadingHedges(prev => ({ ...prev, [eventId]: false }));
            }
        }
    };

    const getProbabilityColor = (value) => {
        if (value >= 50) return 'text-red-500 bg-red-500/10 border-red-500/30';
        if (value >= 25) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
        if (value >= 10) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
        return 'text-green-500 bg-green-500/10 border-green-500/30';
    };

    const getProgressBarColor = (value) => {
        if (value >= 50) return 'bg-red-500';
        if (value >= 25) return 'bg-orange-500';
        if (value >= 10) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'rising': return <span className="text-red-500">↑</span>;
            case 'falling': return <span className="text-green-500">↓</span>;
            default: return <span className="text-gray-400">→</span>;
        }
    };

    const getProbabilityLabel = (value) => {
        if (value >= 50) return 'HIGH RISK';
        if (value >= 25) return 'ELEVATED';
        if (value >= 10) return 'MODERATE';
        return 'LOW';
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center animate-pulse">
                            <span className="text-xl">🦢</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Black Swan Monitor</h2>
                            <p className="text-sm text-gray-500">Loading AI risk analysis...</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-24"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <span className="text-4xl mb-4 block">⚠️</span>
                <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Black Swan Events</h3>
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-slate-900 via-red-900/30 to-slate-900 rounded-xl shadow-lg border border-red-900/30 p-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/30">
                        <span className="text-3xl">🦢</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Black Swan Monitor</h2>
                        <p className="text-slate-400">AI-powered tail risk assessment for catastrophic market events</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-slate-300">High Risk: 50%+</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-slate-300">Elevated: 25-50%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-slate-300">Moderate: 10-25%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-slate-300">Low: &lt;10%</span>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid gap-4">
                {events.map((event, index) => (
                    <div
                        key={event.id}
                        className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${expandedEvent === event.id ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {/* Main Content */}
                        <div
                            className="p-5 cursor-pointer"
                            onClick={() => handleExpand(event.id)}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                                    {event.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-400">#{index + 1}</span>
                                        <h3 className="text-lg font-bold text-gray-900 truncate">{event.name}</h3>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                                </div>

                                {/* Probability Progress Bar */}
                                <div className="flex flex-col items-end min-w-[140px]">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className="text-2xl font-black text-gray-900 tracking-tight">{event.probability.value}%</span>
                                        {getTrendIcon(event.probability.trend)}
                                    </div>
                                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-100/50">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressBarColor(event.probability.value)}`}
                                            style={{ width: `${event.probability.value}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-1.5 flex items-center gap-1">
                                        {getProbabilityLabel(event.probability.value)}
                                    </span>
                                </div>
                            </div>

                            {/* Hedge Preview - Always visible */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-xs text-gray-500 font-medium">🛡️ Hedges:</span>
                                {event.hedges && event.hedges.slice(0, 4).map(hedge => (
                                    <span
                                        key={hedge.symbol}
                                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-200"
                                    >
                                        {hedge.symbol}
                                    </span>
                                ))}
                                {event.hedges && event.hedges.length > 4 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                        +{event.hedges.length - 4} more
                                    </span>
                                )}
                            </div>

                            {/* AI Reasoning */}
                            <div className="mt-3 flex items-start gap-2 text-sm">
                                <span className="text-lg">🤖</span>
                                <p className="text-gray-600 italic">{event.probability.reasoning}</p>
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedEvent === event.id && (
                            <div className="border-t border-gray-100 bg-gray-50 p-5 animate-fadeIn">
                                {/* Two Column Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    {/* LEFT COLUMN: Risk Drivers & News */}
                                    <div className="space-y-6">

                                        {/* Key Risk Drivers */}
                                        {event.probability.keyFactors && event.probability.keyFactors.length > 0 && (
                                            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <span>⚠️</span> Key Risk Drivers
                                                </h4>
                                                <ul className="space-y-2">
                                                    {event.probability.keyFactors.map((factor, i) => (
                                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></span>
                                                            <span className="leading-relaxed">{factor}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Latest Related News */}
                                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2 border-b border-gray-100 pb-2">
                                                <span>📰</span> Latest Related News
                                            </h4>
                                            {event.news && event.news.length > 0 ? (
                                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {event.news.map((item, i) => (
                                                        <a
                                                            key={i}
                                                            href={typeof item === 'object' ? item.link : '#'}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block group"
                                                        >
                                                            <div className="flex flex-col gap-1 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                                                <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 line-clamp-2 leading-snug">
                                                                    {typeof item === 'object' ? item.title : item}
                                                                </p>
                                                                {typeof item === 'object' && (item.publisher || item.publishedAt) && (
                                                                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                                                        {item.publisher && <span className="font-medium">{item.publisher}</span>}
                                                                        {item.publishedAt && <span>• {new Date(item.publishedAt).toLocaleDateString()}</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-500 italic p-2">No recent news available</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* RIGHT COLUMN: Hedging Instruments */}
                                    <div>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 h-full">
                                            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                                <span>🛡️</span> Hedging Instruments
                                            </h4>

                                            {loadingHedges[event.id] ? (
                                                <div className="space-y-3">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="bg-white rounded-xl h-40 animate-pulse border border-gray-200"></div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                                                    {event.hedges && event.hedges.map(hedge => {
                                                        const detail = hedgeData[event.id]?.[hedge.symbol];
                                                        const hasChartConf = detail && detail.historicalData && detail.historicalData.length > 0;
                                                        const change = detail?.change || 0;
                                                        const color = change >= 0 ? '#16a34a' : '#dc2626';
                                                        const textColor = change >= 0 ? 'text-green-600' : 'text-red-600';

                                                        // Map data for Sparkline
                                                        const chartData = hasChartConf ? detail.historicalData.map(d => ({ value: d.close, date: d.date })) : [];

                                                        return (
                                                            <div
                                                                key={hedge.symbol}
                                                                className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col justify-between overflow-hidden hover:shadow-xl hover:border-blue-400 transition-all hover:-translate-y-1 h-36 cursor-pointer group"
                                                            >
                                                                <div className="p-4 pb-0 relative z-10 w-full">
                                                                    <div className="flex justify-between items-center w-full">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{hedge.symbol}</h3>
                                                                            <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium whitespace-nowrap">
                                                                                {hedge.type === 'Inverse ETF' ? 'Bear' : hedge.type === 'Volatility ETN' ? 'Vol' : 'Hedge'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {detail && detail.currentPrice ? (
                                                                        <div className={`text-xl font-bold mt-1 ${textColor}`}>
                                                                            {detail.change >= 0 ? '+' : ''}{detail.changePercent?.toFixed(2)}%
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-sm text-gray-400 mt-2">--</div>
                                                                    )}
                                                                    <div className="text-xs text-gray-500 truncate" title={hedge.name}>{hedge.name}</div>
                                                                </div>

                                                                {/* Chart Area */}
                                                                <div className="h-14 w-full mt-auto">
                                                                    {hasChartConf ? (
                                                                        <Sparkline data={chartData} color={color} />
                                                                    ) : (
                                                                        <div className="h-full bg-gray-50 border-t border-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                                                                            No Data
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-xs text-amber-700">
                    <strong>⚠️ Disclaimer:</strong> Black swan probability assessments are AI-generated estimates based on current news and geopolitical analysis.
                    These are not predictions and should not be used as the sole basis for investment decisions.
                </p>
            </div>
        </div>
    );
};

export default BlackSwanDashboard;
