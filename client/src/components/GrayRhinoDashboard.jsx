import React, { useState, useEffect } from 'react';
import { fetchGrayRhinoEvents } from '../services/api';

const GrayRhinoDashboard = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEvent, setExpandedEvent] = useState(null);

    useEffect(() => {
        const loadEvents = async () => {
            try {
                setLoading(true);
                const data = await fetchGrayRhinoEvents();
                setEvents(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadEvents();
    }, []);

    const getIntensityColor = (value) => {
        if (value >= 75) return 'text-orange-600 bg-orange-100 border-orange-200';
        if (value >= 50) return 'text-slate-600 bg-slate-100 border-slate-200';
        return 'text-gray-500 bg-gray-50 border-gray-200';
    };

    const getTrendIcon = (trend) => {
        switch (trend) {
            case 'accelerating': return <span className="text-orange-500 font-bold">↑↑</span>;
            case 'steady': return <span className="text-gray-400">→</span>;
            case 'decelerating': return <span className="text-blue-500">↓</span>;
            default: return <span className="text-gray-400">→</span>;
        }
    };

    const getIntensityLabel = (value) => {
        if (value >= 75) return 'CRITICAL';
        if (value >= 50) return 'ELEVATED';
        return 'WATCHING';
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center animate-pulse">
                            <span className="text-xl">🦏</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Gray Rhino Monitor</h2>
                            <p className="text-sm text-gray-500">Loading slow-motion risk analysis...</p>
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
                <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Gray Rhino Events</h3>
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-xl shadow-lg border border-slate-600 p-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/30">
                        <span className="text-3xl">🦏</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Gray Rhino Monitor</h2>
                        <p className="text-slate-300">Tracking highly probable, high-impact, slow-motion disasters</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-600">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        <span className="text-slate-300">Critical Intensity: 75%+</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-600">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-slate-300">Elevated: 50-75%</span>
                    </div>
                </div>
            </div>

            {/* Events Grid */}
            <div className="grid gap-4">
                {events.map((event, index) => (
                    <div
                        key={event.id}
                        className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${expandedEvent === event.id ? 'border-slate-400 ring-2 ring-slate-100' : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {/* Main Content */}
                        <div
                            className="p-5 cursor-pointer"
                            onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                        >
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className="w-12 h-12 bg-slate-50 text-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
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

                                {/* Intensity Badge */}
                                <div className={`flex flex-col items-end gap-1 flex-shrink-0 px-4 py-2 rounded-xl border ${getIntensityColor(event.probability.value)}`}>
                                    <div className="flex items-center gap-1">
                                        <span className="text-2xl font-bold">{event.probability.value}%</span>
                                        {getTrendIcon(event.probability.trend)}
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider">
                                        {getIntensityLabel(event.probability.value)}
                                    </span>
                                </div>
                            </div>

                            {/* Hedge Preview - Always visible */}
                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="text-xs text-gray-500 font-medium">🛡️ Hedges:</span>
                                {event.hedges && event.hedges.slice(0, 4).map(hedge => (
                                    <span
                                        key={hedge.symbol}
                                        className="px-2 py-1 bg-slate-50 text-slate-700 text-xs font-bold rounded border border-slate-200"
                                    >
                                        {hedge.symbol}
                                    </span>
                                ))}
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

                                {/* Key Risk Drivers */}
                                {event.probability.keyFactors && event.probability.keyFactors.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <span>⚠️</span> Key Risk Drivers
                                        </h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {event.probability.keyFactors.map((factor, i) => (
                                                <li key={i} className="text-sm text-gray-700 leading-relaxed">{factor}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Recent News */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <span>📰</span> Latest Related News
                                    </h4>
                                    {event.news && event.news.length > 0 ? (
                                        <div className="space-y-2">
                                            {event.news.map((item, i) => (
                                                <a
                                                    key={i}
                                                    href={typeof item === 'object' ? item.link : '#'}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block bg-white rounded-lg border border-gray-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all"
                                                >
                                                    <p className="text-sm text-gray-800 font-medium line-clamp-2">
                                                        {typeof item === 'object' ? item.title : item}
                                                    </p>
                                                    {typeof item === 'object' && (item.publisher || item.publishedAt) && (
                                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                            {item.publisher && <span>{item.publisher}</span>}
                                                            {item.publishedAt && <span>• {item.publishedAt}</span>}
                                                        </p>
                                                    )}
                                                </a>
                                            ))}
                                        </div>
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
                                                    className="bg-white rounded-lg border border-gray-200 p-3 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-slate-700">{hedge.symbol}</span>
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
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-500">
                    <strong>⚠️ Disclaimer:</strong> Gray Rhino assessments visualize known, high-impact risks based on current data.
                </p>
            </div>
        </div>
    );
};

export default GrayRhinoDashboard;
