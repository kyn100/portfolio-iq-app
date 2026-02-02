import React, { useState, useEffect } from 'react';
import { fetchTrendAlerts } from '../services/api';

const TrendAlertsDashboard = () => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const data = await fetchTrendAlerts();
                setAlerts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadAlerts();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
                <p className="text-gray-500">Analyzing sector trends...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 rounded-xl border border-red-200">
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    const bullishAlerts = alerts.filter(a => a.direction === 'bullish');
    const bearishAlerts = alerts.filter(a => a.direction === 'bearish');

    const renderStrengthBars = (strength) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className={`w-2 h-4 rounded-sm ${i <= strength ? 'bg-current' : 'bg-gray-200'}`}
                    />
                ))}
            </div>
        );
    };

    const renderAlertCard = (alert, idx) => {
        const isBullish = alert.direction === 'bullish';
        const bgGradient = isBullish
            ? 'from-green-50 to-emerald-50 border-green-200'
            : 'from-red-50 to-orange-50 border-red-200';
        const textColor = isBullish ? 'text-green-700' : 'text-red-700';
        const badgeColor = isBullish ? 'bg-green-500' : 'bg-red-500';

        return (
            <div
                key={`${alert.sector}-${idx}`}
                className={`bg-gradient-to-br ${bgGradient} rounded-xl border-2 overflow-hidden hover:shadow-lg transition-shadow`}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className={`${badgeColor} text-white p-2 rounded-lg`}>
                                {isBullish ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">{alert.sector}</h3>
                                <div className="text-sm text-gray-500">{alert.etf} ETF</div>
                            </div>
                        </div>
                        <div className={`${textColor} flex flex-col items-end`}>
                            <span className="text-xs uppercase font-semibold tracking-wider">
                                {isBullish ? 'Turning Bullish' : 'Turning Bearish'}
                            </span>
                            <div className={`flex items-center gap-1 mt-1 ${textColor}`}>
                                <span className="text-xs">Strength:</span>
                                {renderStrengthBars(alert.strength)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signals */}
                <div className="p-4">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Detected Signals
                    </div>
                    <div className="space-y-2">
                        {alert.signals.map((signal, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div className={`mt-1 w-2 h-2 rounded-full ${badgeColor} flex-shrink-0`}></div>
                                <div>
                                    <div className={`font-medium text-sm ${textColor}`}>{signal.type}</div>
                                    <div className="text-xs text-gray-600">{signal.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Metrics */}
                <div className="px-4 pb-4">
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-white/60 p-2 rounded-lg text-center">
                            <div className="text-xs text-gray-500">Today</div>
                            <div className={`font-bold text-sm ${alert.metrics.todayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {alert.metrics.todayChange >= 0 ? '+' : ''}{alert.metrics.todayChange.toFixed(2)}%
                            </div>
                        </div>
                        <div className="bg-white/60 p-2 rounded-lg text-center">
                            <div className="text-xs text-gray-500">1 Week</div>
                            <div className={`font-bold text-sm ${alert.metrics.oneWeekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {alert.metrics.oneWeekChange >= 0 ? '+' : ''}{alert.metrics.oneWeekChange.toFixed(2)}%
                            </div>
                        </div>
                        <div className="bg-white/60 p-2 rounded-lg text-center">
                            <div className="text-xs text-gray-500">RSI</div>
                            <div className={`font-bold text-sm ${alert.metrics.rsi < 30 ? 'text-green-600' : alert.metrics.rsi > 70 ? 'text-red-600' : 'text-gray-700'}`}>
                                {alert.metrics.rsi}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h1 className="text-2xl font-bold">Trend Turning Points</h1>
                </div>
                <p className="text-purple-100">
                    Sectors showing signs of trend reversal based on Moving Average Crossovers, RSI Extremes, and Momentum Shifts
                </p>
            </div>

            {alerts.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-12 text-center">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">No Trend Reversals Detected</h3>
                    <p className="text-gray-500">All sectors are currently in steady trends. Check back later for alerts.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Bullish Reversals */}
                    {bullishAlerts.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <h2 className="text-lg font-bold text-gray-800">Bullish Reversals ({bullishAlerts.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {bullishAlerts.map((alert, idx) => renderAlertCard(alert, idx))}
                            </div>
                        </div>
                    )}

                    {/* Bearish Reversals */}
                    {bearishAlerts.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <h2 className="text-lg font-bold text-gray-800">Bearish Reversals ({bearishAlerts.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {bearishAlerts.map((alert, idx) => renderAlertCard(alert, idx))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-700 mb-3">How to Read These Alerts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                        <span className="font-semibold text-green-600">Golden Cross:</span>
                        <span>Short-term MA crosses above long-term MA — bullish signal</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold text-red-600">Death Cross:</span>
                        <span>Short-term MA crosses below long-term MA — bearish signal</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold text-blue-600">RSI Extreme:</span>
                        <span>RSI below 30 = oversold, above 70 = overbought</span>
                    </div>
                    <div className="flex items-start gap-2">
                        <span className="font-semibold text-purple-600">Momentum Shift:</span>
                        <span>Short-term performance diverging from long-term trend</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrendAlertsDashboard;
