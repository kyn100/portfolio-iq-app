import React, { useState, useEffect } from 'react';
import { fetchInsights } from '../services/api';

const InsightsDashboard = () => {
    const [data, setData] = useState({ news: [], influencers: [], sentiment: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadData = async () => {
        try {
            // Don't set loading=true on background refreshes to avoid flashing
            if (!lastUpdated) setLoading(true);

            const result = await fetchInsights();
            setData(result);
            setLastUpdated(new Date());
            setError(null);
        } catch (err) {
            console.error("Failed to refresh insights:", err);
            // Only set error state if it's the initial load
            if (!lastUpdated) setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // Refresh every 30 minutes (30 * 60 * 1000 ms)
        const intervalId = setInterval(loadData, 30 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, []);

    if (loading) return (
        <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return <div className="text-red-500 p-6">{error}</div>;

    const news = data.marketNews || [];
    const economicEvents = data.economicEvents || [];
    const sentiment = data.socialSentiment || [];
    const summaryData = data.marketSummary; // Can be string (error) or object (data)

    // Helper to render AI Card content
    const renderContent = () => {
        // Case 1: Error or Loading (String)
        if (typeof summaryData === 'string' || !summaryData) {
            return (
                <div className="text-gray-400 leading-relaxed font-mono text-sm whitespace-pre-line p-4">
                    {summaryData || "Initializing AI Neural Network..."}
                </div>
            );
        }

        // Case 2: Structured JSON Data
        const { sentiment: marketSentiment, headline, points, ideas } = summaryData;

        let sentimentColor = "bg-gray-800 text-gray-300 border-gray-700";
        if (marketSentiment === 'BULLISH') sentimentColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (marketSentiment === 'BEARISH') sentimentColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";

        return (
            <div className="flex flex-col gap-8">
                {/* Header Section */}
                <div className="border-b border-white/10 pb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${sentimentColor} tracking-wider uppercase shadow-inner`}>
                            {marketSentiment}
                        </span>
                        <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            LIVE ANALYSIS
                        </span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        {headline}
                    </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    {/* Left Col: Analysis Points */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Key Market Drivers
                        </h4>
                        <ul className="space-y-4">
                            {(points || []).map((point, idx) => (
                                <li key={idx} className="group flex items-start gap-4">
                                    <div className="min-w-[24px] h-[24px] flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-colors mt-0.5">
                                        <span className="text-xs font-bold font-mono">{idx + 1}</span>
                                    </div>
                                    <span className="text-gray-300 text-sm leading-relaxed group-hover:text-white transition-colors">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right Col: Future Ideas (Card Style) */}
                    <div className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl p-6 border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <svg className="w-24 h-24 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
                        </div>

                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Innovation Signals
                        </h4>

                        <ul className="space-y-4 relative z-10">
                            {(ideas || []).map((idea, idx) => (
                                <li key={idx} className="flex gap-3">
                                    <svg className="w-5 h-5 text-amber-500/50 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-amber-100/80 text-sm font-medium leading-snug hover:text-amber-100 transition-colors">
                                        {idea}
                                    </span>
                                </li>
                            ))}
                            {(!ideas || ideas.length === 0) && <li className="text-gray-500 text-sm italic">No breakthrough signals detected today.</li>}
                        </ul>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* AI Market Briefing - Dark Card */}
            <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden relative">
                {/* Decorative Gradient Blob */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="p-8 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 opacity-60 text-xs font-bold tracking-widest uppercase text-blue-200">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            PorfolioIQ AI Core
                        </div>
                        {lastUpdated && (
                            <div className="text-[10px] text-slate-500 font-mono border border-slate-800 px-2 py-1 rounded bg-slate-950">
                                UPDATED: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        )}
                    </div>

                    {renderContent()}
                </div>
            </div>

            {/* Economic News Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Latest Market News
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {news.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all group"
                        >
                            {item.thumbnail?.resolutions?.[0]?.url && (
                                <div className="w-full h-24 mb-3 rounded overflow-hidden bg-gray-200">
                                    <img src={item.thumbnail.resolutions[0].url} alt="" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 leading-snug mb-2">
                                {item.title}
                            </h4>
                            <div className="text-xs text-gray-500">
                                <span className="font-medium">{item.publisher}</span>
                            </div>
                        </a>
                    ))}
                    {news.length === 0 && <div className="text-gray-400 italic col-span-4">No news available</div>}
                </div>
            </div>

            {/* Economic Calendar / Events */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Key Economic Events & Trends
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {economicEvents.map((cat, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 font-bold flex justify-between items-center">
                                <span>{cat.name}</span>
                            </div>
                            <div className="p-4 space-y-3">
                                {cat.news.length === 0 && <div className="text-gray-400 italic text-sm">No recent updates</div>}
                                {cat.news.map((article, nIdx) => (
                                    <a
                                        key={nIdx}
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-sm text-gray-700 hover:text-blue-600 line-clamp-2"
                                    >
                                        • {article.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                    {economicEvents.length === 0 && <div className="text-gray-400 italic col-span-3">No events available</div>}
                </div>
            </div>

            {/* Social Sentiment (Retained) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    Social Media Sentiment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {sentiment.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 bg-orange-50 rounded-lg border border-orange-100 hover:shadow-md hover:border-orange-200 transition-all"
                        >
                            <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-snug">
                                {item.title}
                            </h4>
                            <div className="text-xs text-gray-500">
                                {new Date((item.providerPublishTime || 0) * 1000).toLocaleDateString()}
                            </div>
                        </a>
                    ))}
                    {sentiment.length === 0 && <div className="text-gray-400 italic col-span-4">No social sentiment data</div>}
                </div>
            </div>
        </div>
    );
};

export default InsightsDashboard;
