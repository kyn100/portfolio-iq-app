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

    const { news, influencers, sentiment } = data;

    return (
        <div className="space-y-8">
            {/* Economic News Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                    Latest Economic News
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

            {/* Influencer Insights */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    What Famous Investors Are Saying
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {influencers.map((inf, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 font-bold">
                                {inf.name}
                            </div>
                            <div className="p-4 space-y-3">
                                {inf.news.length === 0 && <div className="text-gray-400 italic text-sm">No recent updates</div>}
                                {inf.news.map((article, nIdx) => (
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
                </div>
            </div>

            {/* Social Sentiment */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Social Media &amp; Retail Sentiment
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sentiment.map((item, idx) => (
                        <a
                            key={idx}
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-4 bg-green-50 rounded-lg border border-green-100 hover:shadow-md hover:border-green-300 transition-all group"
                        >
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-700 line-clamp-2 leading-snug mb-2">
                                {item.title}
                            </h4>
                            <div className="text-xs text-gray-500">
                                <span className="font-medium">{item.publisher}</span>
                            </div>
                        </a>
                    ))}
                    {sentiment.length === 0 && <div className="text-gray-400 italic col-span-3">No sentiment data available</div>}
                </div>
            </div>
        </div>
    );
};

export default InsightsDashboard;
