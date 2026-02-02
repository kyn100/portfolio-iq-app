import React, { useState, useEffect } from 'react';
import { fetchInsights } from '../services/api';

const InsightsDashboard = () => {
    const [data, setData] = useState({ news: [], influencers: [], sentiment: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchInsights();
                setData(result);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
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
                <div className="text-blue-50 leading-relaxed font-medium whitespace-pre-line">
                    {summaryData || "Loading market intelligence..."}
                </div>
            );
        }

        // Case 2: Structured JSON Data
        const { sentiment, headline, points, ideas } = summaryData;

        let sentimentColor = "bg-gray-100 text-gray-800";
        if (sentiment === 'BULLISH') sentimentColor = "bg-green-100 text-green-800 border-green-200";
        if (sentiment === 'BEARISH') sentimentColor = "bg-red-100 text-red-800 border-red-200";

        return (
            <div className="space-y-6">
                {/* Header & Main Sentiment */}
                <div className="flex items-start gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${sentimentColor} shadow-sm whitespace-nowrap mt-1`}>
                        {sentiment}
                    </span>
                    <h3 className="text-xl font-bold text-white leading-tight">
                        {headline}
                    </h3>
                </div>

                {/* Key Drivers */}
                <div>
                    <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-2 flex items-center gap-1">
                        Analysis Points
                    </h4>
                    <ul className="space-y-2">
                        {(points || []).map((point, idx) => (
                            <li key={idx} className="flex items-start gap-3 bg-white/10 p-2.5 rounded-lg backdrop-blur-sm hover:bg-white/20 transition-all">
                                <div className="min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-blue-500 text-white shadow-sm mt-0.5">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <span className="text-blue-50 text-sm font-medium leading-snug">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Future Opportunities (New Ideas) */}
                {ideas && ideas.length > 0 && (
                    <div className="pt-4 border-t border-white/10">
                        <h4 className="text-xs font-bold text-yellow-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            Emerging Opportunities
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ideas.map((idea, idx) => (
                                <li key={idx} className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-3 rounded-lg text-sm text-yellow-50 font-medium leading-snug">
                                    {idea}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* AI Market Briefing */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-xl shadow-md text-white border border-blue-500/30 ring-1 ring-white/10">
                <div className="flex items-center gap-2 mb-4 opacity-75 text-xs font-bold tracking-widest uppercase">
                    <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI Market Intelligence
                </div>

                {renderContent()}
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
