import React, { useState, useEffect } from 'react';
import { fetchBlackSwanEvents } from '../services/api';

const BlackSwanDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEvent, setExpandedEvent] = useState(null);

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

    const getProbabilityColor = (value) => {
        if (value >= 50) return 'text-red-500 bg-red-500/10 border-red-500/30';
        if (value >= 25) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
        if (value >= 10) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
        return 'text-green-500 bg-green-500/10 border-green-500/30';
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
                            onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
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

                                {/* Probability Badge */}
                                <div className={`flex flex-col items-end gap-1 flex-shrink-0 px-4 py-2 rounded-xl border ${getProbabilityColor(event.probability.value)}`}>
                                    <div className="flex items-center gap-1">
                                        <span className="text-2xl font-bold">{event.probability.value}%</span>
                                        {getTrendIcon(event.probability.trend)}
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">
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
                            <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4 animate-fadeIn">
                                {/* Recent News */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <span>📰</span> Related Headlines
                                    </h4>
                                    {event.news && event.news.length > 0 ? (
                                        <ul className="space-y-2">
                                            {event.news.map((headline, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="text-blue-500">•</span>
                                                    {headline}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No recent news available</p>
                                    )}
                                </div>

                                {/* Hedge Recommendations */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <span>🛡️</span> Hedging Instruments
                                    </h4>
                                    {event.hedges && event.hedges.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {event.hedges.map(hedge => (
                                                <div
                                                    key={hedge.symbol}
                                                    className="bg-white rounded-lg border border-gray-200 p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-blue-600">{hedge.symbol}</span>
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{hedge.type}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 truncate" title={hedge.name}>{hedge.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No hedging instruments available</p>
                                    )}
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
