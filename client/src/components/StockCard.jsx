import React, { useState } from 'react';
import { fetchSimilarAssets } from '../services/api';
import RecommendationBadge from './RecommendationBadge';
import TechnicalChart from './TechnicalChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const StockCard = ({ stock, onRemove, onTrade, isWatchlist = false, isFocusList = false }) => {
  const [expanded, setExpanded] = useState(false);
  const [similarAssets, setSimilarAssets] = useState(null);
  const [similarReport, setSimilarReport] = useState(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);

  const handleFindSimilar = async (e) => {
    e.stopPropagation();
    // Only return early if we have meaningful data. If empty, allow retry.
    if (similarAssets && similarAssets.length > 0) {
      setShowSimilar(true);
      return;
    }

    setLoadingSimilar(true);
    try {
      const data = await fetchSimilarAssets(stock.symbol);
      // Supports both older array format and new object format
      if (Array.isArray(data.similar)) {
        setSimilarAssets(data.similar || []);
        setSimilarReport(data.report || null);
      } else {
        // Fallback if structured differently, though backend ensures 'similar' is array
        setSimilarAssets(Array.isArray(data) ? data : []);
      }
      setShowSimilar(true);
    } catch (error) {
      console.error("Failed to load similar assets", error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  if (stock.error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">{stock.symbol}</h3>
          <button
            onClick={() => onRemove(stock.id)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        </div>
        <p className="text-red-500 text-sm mt-2">{stock.error}</p>
      </div>
    );
  }

  const { analysis, sectorComparison } = stock;
  const priceChangeColor = stock.change >= 0 ? 'text-green-600' : 'text-red-600';
  const gainLossColor = stock.gainLoss >= 0 ? 'text-green-600' : 'text-red-600';
  const ytdColor = stock.ytdReturn >= 0 ? 'text-green-600' : 'text-red-600';

  const getSectorRatingColor = (rating) => {
    if (!rating || rating === 'N/A') return 'bg-gray-100 text-gray-600';
    if (rating.includes('Strong Outperformer')) return 'bg-green-100 text-green-700';
    if (rating.includes('Outperformer')) return 'bg-green-50 text-green-600';
    if (rating.includes('In-Line')) return 'bg-yellow-50 text-yellow-700';
    if (rating.includes('Strong Underperformer')) return 'bg-red-100 text-red-700';
    return 'bg-red-50 text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">{stock.symbol}</h3>
              {isWatchlist && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Watching</span>
              )}
              {isFocusList && (
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Focus List</span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate max-w-[200px]">{stock.name}</p>
            {stock.sector && (
              <p className="text-xs text-gray-400">{stock.sector} • {stock.industry}</p>
            )}
          </div>
          <button
            onClick={() => onRemove(stock.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title={isWatchlist ? "Remove from watchlist" : isFocusList ? "Remove from focus list" : "Remove from portfolio"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold">${stock.currentPrice?.toFixed(2)}</span>
          <span className={`text - sm font - medium ${priceChangeColor} `}>
            {stock.change >= 0 ? '+' : ''}{stock.change?.toFixed(2)} ({stock.changePercent?.toFixed(2)}%)
          </span>
        </div>

        {/* Key Metrics Row */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          {stock.peRatio && (
            <span className="px-2 py-1 bg-gray-100 rounded-full">
              P/E: {stock.peRatio.toFixed(1)}
            </span>
          )}
          {stock.ytdReturn !== null && stock.ytdReturn !== undefined && (
            <span className={`px - 2 py - 1 rounded - full ${stock.ytdReturn >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'} `}>
              YTD: {stock.ytdReturn >= 0 ? '+' : ''}{stock.ytdReturn.toFixed(1)}%
            </span>
          )}
          {stock.dividendYield && (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
              Div: {stock.dividendYield.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Sector Comparison */}
        {sectorComparison && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">vs {sectorComparison.sectorName} ({sectorComparison.sectorETF})</span>
              <span className={`text - xs px - 2 py - 0.5 rounded - full ${getSectorRatingColor(sectorComparison.rating)} `}>
                {sectorComparison.rating}
              </span>
            </div>
            {sectorComparison.outperformance !== null && (
              <div className="mt-1 text-xs">
                <span className="text-gray-500">YTD Outperformance: </span>
                <span className={sectorComparison.outperformance >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {sectorComparison.outperformance >= 0 ? '+' : ''}{sectorComparison.outperformance.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {stock.description && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs font-semibold text-blue-800 mb-1">About {stock.symbol}</div>
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">
                  {stock.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recommendation */}
        {analysis?.recommendation && (
          <div className="mb-3">
            <RecommendationBadge
              recommendation={analysis.recommendation.recommendation}
              confidence={analysis.recommendation.confidence}
              score={analysis.recommendation.score}
            />
            {/* Recommendation Reasons */}
            {analysis.recommendation.reasons && analysis.recommendation.reasons.length > 0 && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="text-xs font-medium text-gray-600 mb-1">Why {analysis.recommendation.recommendation}?</div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {analysis.recommendation.reasons.slice(0, 3).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className={`mt - 1 w - 1.5 h - 1.5 rounded - full flex - shrink - 0 ${reason.startsWith('Caution') || reason.startsWith('Bearish') || reason.startsWith('Also negative')
                        ? 'bg-red-400'
                        : reason.startsWith('Note') || reason.startsWith('Bullish') || reason.startsWith('Also positive')
                          ? 'bg-green-400'
                          : analysis.recommendation.recommendation === 'BUY'
                            ? 'bg-green-400'
                            : analysis.recommendation.recommendation === 'SELL'
                              ? 'bg-red-400'
                              : 'bg-yellow-400'
                        } `} />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Mini Chart */}
        {stock.historicalData && (
          <div className="mb-3">
            <TechnicalChart data={stock.historicalData} mini={true} />
          </div>
        )}

        {/* Who's Buying/Selling */}
        {(stock.analystRatings || (stock.insiderTransactions && stock.insiderTransactions.length > 0)) && (
          <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
            <div className="text-xs font-semibold text-purple-800 mb-2 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Who's Buying/Selling
            </div>

            {/* Analyst Ratings Bar */}
            {stock.analystRatings && (
              <div className="mb-2">
                <div className="text-xs text-gray-600 mb-1">Wall Street Analysts</div>
                <div className="flex h-4 rounded-full overflow-hidden text-xs">
                  {stock.analystRatings.strongBuy > 0 && (
                    <div
                      className="bg-green-600 flex items-center justify-center text-white"
                      style={{ width: `${(stock.analystRatings.strongBuy / (stock.analystRatings.strongBuy + stock.analystRatings.buy + stock.analystRatings.hold + stock.analystRatings.sell + stock.analystRatings.strongSell)) * 100}% ` }}
                      title={`Strong Buy: ${stock.analystRatings.strongBuy} `}
                    >
                      {stock.analystRatings.strongBuy}
                    </div>
                  )}
                  {stock.analystRatings.buy > 0 && (
                    <div
                      className="bg-green-400 flex items-center justify-center text-white"
                      style={{ width: `${(stock.analystRatings.buy / (stock.analystRatings.strongBuy + stock.analystRatings.buy + stock.analystRatings.hold + stock.analystRatings.sell + stock.analystRatings.strongSell)) * 100}% ` }}
                      title={`Buy: ${stock.analystRatings.buy} `}
                    >
                      {stock.analystRatings.buy}
                    </div>
                  )}
                  {stock.analystRatings.hold > 0 && (
                    <div
                      className="bg-yellow-400 flex items-center justify-center text-gray-800"
                      style={{ width: `${(stock.analystRatings.hold / (stock.analystRatings.strongBuy + stock.analystRatings.buy + stock.analystRatings.hold + stock.analystRatings.sell + stock.analystRatings.strongSell)) * 100}% ` }}
                      title={`Hold: ${stock.analystRatings.hold} `}
                    >
                      {stock.analystRatings.hold}
                    </div>
                  )}
                  {stock.analystRatings.sell > 0 && (
                    <div
                      className="bg-red-400 flex items-center justify-center text-white"
                      style={{ width: `${(stock.analystRatings.sell / (stock.analystRatings.strongBuy + stock.analystRatings.buy + stock.analystRatings.hold + stock.analystRatings.sell + stock.analystRatings.strongSell)) * 100}% ` }}
                      title={`Sell: ${stock.analystRatings.sell} `}
                    >
                      {stock.analystRatings.sell}
                    </div>
                  )}
                  {stock.analystRatings.strongSell > 0 && (
                    <div
                      className="bg-red-600 flex items-center justify-center text-white"
                      style={{ width: `${(stock.analystRatings.strongSell / (stock.analystRatings.strongBuy + stock.analystRatings.buy + stock.analystRatings.hold + stock.analystRatings.sell + stock.analystRatings.strongSell)) * 100}% ` }}
                      title={`Strong Sell: ${stock.analystRatings.strongSell} `}
                    >
                      {stock.analystRatings.strongSell}
                    </div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Strong Buy</span>
                  <span>Strong Sell</span>
                </div>
              </div>
            )}

            {/* Top Institutional Holders */}
            {stock.institutionOwnership && stock.institutionOwnership.length > 0 && (
              <div>
                <div className="text-xs text-gray-600 mb-1">Top Institutional Holders</div>
                <div className="space-y-1">
                  {stock.institutionOwnership.slice(0, 3).map((holder, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate max-w-[160px]" title={holder.name}>
                        🏦 {holder.name}
                      </span>
                      <span className="text-indigo-600 font-medium">
                        {holder.pctHeld ? `${(holder.pctHeld * 100).toFixed(1)}% ` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Stats (only for portfolio items) */}
        {!isWatchlist && stock.quantity > 0 && (
          <div className="grid grid-cols-2 gap-2 text-sm bg-blue-50 rounded-lg p-2 mb-3">
            <div>
              <span className="text-gray-500">Shares:</span>
              <span className="ml-1 font-medium">{stock.quantity}</span>
            </div>
            <div>
              <span className="text-gray-500">Avg Cost:</span>
              <span className="ml-1 font-medium">${stock.purchase_price?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Value:</span>
              <span className="ml-1 font-medium">${stock.currentValue?.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500">Gain/Loss:</span>
              <span className={`ml - 1 font - medium ${gainLossColor} `}>
                {stock.gainLoss >= 0 ? '+' : ''}${stock.gainLoss?.toFixed(2)} ({stock.gainLossPercent?.toFixed(1)}%)
              </span>
            </div>
          </div>
        )}

        {/* Watchlist notes */}
        {isWatchlist && stock.notes && (
          <div className="mb-3 p-2 bg-yellow-50 rounded-lg text-sm text-gray-600">
            <span className="text-xs text-gray-400">Notes: </span>{stock.notes}
          </div>
        )}

        {/* Focus List details */}
        {isFocusList && (
          <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-white p-2 rounded border border-purple-100">
                <div className="text-xs text-gray-500">Target Entry</div>
                <div className="font-semibold text-purple-900">
                  {stock.target_price ? `$${stock.target_price.toFixed(2)} ` : '-'}
                </div>
              </div>
              <div className="bg-white p-2 rounded border border-purple-100">
                <div className="text-xs text-gray-500">Stop Loss</div>
                <div className="font-semibold text-red-700">
                  {stock.stop_loss ? `$${stock.stop_loss.toFixed(2)} ` : '-'}
                </div>
              </div>
            </div>
            {stock.notes && (
              <div className="text-sm text-gray-700 mb-3">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wide">Thesis: </span>
                {stock.notes}
              </div>
            )}

            {onTrade && (
              <button
                onClick={() => onTrade(stock)}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark as Traded
              </button>
            )}
          </div>
        )}

        {/* Expand Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
        >
          {expanded ? 'Hide' : 'Show'} Details
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <TechnicalChart stock={stock} period="6mo" />

          <div className="mt-4 flex flex-col gap-2">
            {!showSimilar && (
              <button
                onClick={handleFindSimilar}
                disabled={loadingSimilar}
                className="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex justify-center items-center gap-2"
              >
                {loadingSimilar ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Analyzing Market Patterns...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Find Similar Setups (AI)
                  </>
                )}
              </button>
            )}

            {showSimilar && similarAssets && (
              <div className="bg-white rounded-lg border border-indigo-100 p-4 animate-fade-in">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                    <span className="bg-indigo-100 p-1 rounded">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </span>
                    Technically Similar Assets
                  </h4>
                  <button onClick={() => setShowSimilar(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* List of Similar Assets */}
                {similarAssets && similarAssets.length > 0 && (
                  <div className="space-y-3 mb-6">
                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Identify Similar Setups</h5>
                    {similarAssets.map((asset) => (
                      <div key={asset.symbol} className="flex justify-between items-start border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800">{asset.symbol}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${asset.similarity === 'High' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {asset.similarity} Match
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{asset.name}</p>
                          <p className="text-xs text-indigo-600 mt-1 italic">"{asset.reason}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Report Section */}
                {similarReport && (() => {
                  // We need to parse the markdown into 3 parts:
                  // 1. Intro (Header & Logic) -> STATIC
                  // 2. Comparative Summary (Table) -> SCROLLABLE
                  // 3. Detailed Analysis (Rest) -> STATIC

                  // 1. Find start of Comparative Summary
                  const summaryHeaderPattern = /## Comparative Summary/i;
                  const summaryMatch = similarReport.match(summaryHeaderPattern);

                  let introPart = "";
                  let rest = "";

                  if (summaryMatch) {
                    introPart = similarReport.substring(0, summaryMatch.index);
                    rest = similarReport.substring(summaryMatch.index);
                  } else {
                    // Fallback: If header missing, assume it starts with summary/table or is just one blob
                    introPart = "";
                    rest = similarReport;
                  }

                  // 2. Split 'rest' into SummaryTable and DetailedAnalysis
                  // Look for the next major header (e.g. ## Detailed Analysis)
                  const nextSectionRegex = /(?=## (?:Detailed Analysis|Individual|Financial|Key Takeaways|Risk Assessment|Conclusion))/i;
                  const parts = rest.split(nextSectionRegex);

                  const summaryPart = parts[0]; // This contains "## Comparative Summary" + Table
                  const detailedPart = parts.length > 1 ? parts.slice(1).join('') : '';

                  return (
                    <div className="mt-4 pt-4 border-t border-indigo-100">
                      <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">AI Comparative Analysis</h5>

                      {/* 1. Intro Section (Static) */}
                      {introPart.trim() && (
                        <div className="prose prose-sm prose-indigo max-w-none text-gray-700 mb-4">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{introPart}</ReactMarkdown>
                        </div>
                      )}

                      {/* Summary Section (Scrollable Table Area) */}
                      <div className="prose prose-sm prose-indigo max-w-none text-gray-700 bg-gray-50 rounded-lg p-4 overflow-x-auto max-h-80 overflow-y-auto custom-scrollbar mb-4">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ node, ...props }) => <table className="min-w-full divide-y divide-gray-200 text-xs" {...props} />,
                            thead: ({ node, ...props }) => <thead className="bg-gray-100" {...props} />,
                            th: ({ node, ...props }) => <th className="px-3 py-2 text-left font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 whitespace-nowrap sticky top-0 bg-gray-100 z-10" {...props} />,
                            td: ({ node, ...props }) => <td className="px-3 py-2 whitespace-nowrap border-b border-gray-100" {...props} />,
                          }}
                        >
                          {summaryPart}
                        </ReactMarkdown>
                      </div>

                      {/* Detailed Analysis (Static) */}
                      {detailedPart && (
                        <div className="prose prose-sm prose-indigo max-w-none text-gray-700">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{detailedPart}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Empty State (Only if both are missing) */}
                {(!similarAssets || similarAssets.length === 0) && !similarReport && (
                  <p className="text-sm text-gray-500 italic">No similar setups found at this time.</p>
                )}
              </div>
            )}
          </div>

          {/* Fundamental Metrics */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2 font-medium">Fundamentals</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-white rounded-lg p-2 border">
                <div className="text-gray-500 text-xs">P/E Ratio</div>
                <div className="font-bold">{stock.peRatio?.toFixed(1) || 'N/A'}</div>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <div className="text-gray-500 text-xs">Forward P/E</div>
                <div className="font-bold">{stock.forwardPE?.toFixed(1) || 'N/A'}</div>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <div className="text-gray-500 text-xs">YTD Return</div>
                <div className={`font - bold ${ytdColor} `}>
                  {stock.ytdReturn !== null ? `${stock.ytdReturn >= 0 ? '+' : ''}${stock.ytdReturn.toFixed(1)}% ` : 'N/A'}
                </div>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <div className="text-gray-500 text-xs">Dividend Yield</div>
                <div className="font-bold">{stock.dividendYield ? `${stock.dividendYield.toFixed(2)}% ` : 'N/A'}</div>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <div className="text-gray-500 text-xs">52W High</div>
                <div className="font-bold">${stock.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}</div>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <div className="text-gray-500 text-xs">52W Low</div>
                <div className="font-bold">${stock.fiftyTwoWeekLow?.toFixed(2) || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Sector Comparison Details */}
          {sectorComparison && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 font-medium">Sector Performance Comparison</div>
              <div className="bg-white rounded-lg p-3 border">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-400">Stock YTD</div>
                    <div className={`font - medium ${sectorComparison.stockYTD >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                      {sectorComparison.stockYTD?.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Sector YTD ({sectorComparison.sectorETF})</div>
                    <div className={`font - medium ${sectorComparison.sectorYTD >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                      {sectorComparison.sectorYTD?.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Stock 1M</div>
                    <div className={`font - medium ${sectorComparison.stock1Month >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                      {sectorComparison.stock1Month?.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Sector 1M</div>
                    <div className={`font - medium ${sectorComparison.sector1Month >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                      {sectorComparison.sector1Month?.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Technical Indicators */}
          {analysis && (
            <>
              <div className="text-xs text-gray-500 mb-2 font-medium">Technical Indicators</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* RSI */}
                <div className="bg-white rounded-lg p-2 border">
                  <div className="text-gray-500 text-xs">RSI (14)</div>
                  <div className="font-bold text-lg">
                    {analysis.indicators?.rsi?.toFixed(1) || 'N/A'}
                  </div>
                  <div className={`text - xs ${analysis.indicators?.rsi < 30 ? 'text-green-600' :
                    analysis.indicators?.rsi > 70 ? 'text-red-600' : 'text-gray-500'
                    } `}>
                    {analysis.indicators?.rsi < 30 ? 'Oversold' :
                      analysis.indicators?.rsi > 70 ? 'Overbought' : 'Neutral'}
                  </div>
                </div>

                {/* MACD */}
                <div className="bg-white rounded-lg p-2 border">
                  <div className="text-gray-500 text-xs">MACD</div>
                  <div className="font-bold text-lg">
                    {analysis.indicators?.macd?.histogram?.toFixed(3) || 'N/A'}
                  </div>
                  <div className={`text - xs ${analysis.indicators?.macd?.histogram > 0 ? 'text-green-600' : 'text-red-600'
                    } `}>
                    {analysis.indicators?.macd?.histogram > 0 ? 'Bullish' : 'Bearish'}
                  </div>
                </div>

                {/* Moving Averages */}
                <div className="bg-white rounded-lg p-2 border">
                  <div className="text-gray-500 text-xs">SMA 20 / 50</div>
                  <div className="font-medium">
                    ${analysis.indicators?.movingAverages?.sma20?.toFixed(2) || 'N/A'}
                  </div>
                  <div className="text-gray-600">
                    ${analysis.indicators?.movingAverages?.sma50?.toFixed(2) || 'N/A'}
                  </div>
                </div>

                {/* Bollinger Bands */}
                <div className="bg-white rounded-lg p-2 border">
                  <div className="text-gray-500 text-xs">Bollinger Bands</div>
                  <div className="text-xs">
                    <span className="text-red-500">U: ${analysis.indicators?.bollingerBands?.upper?.toFixed(2)}</span>
                    {' / '}
                    <span className="text-green-500">L: ${analysis.indicators?.bollingerBands?.lower?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Money Flow */}
              {analysis.indicators?.moneyFlow && (
                <div className="mt-3 bg-white rounded-lg p-3 border">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-gray-500 text-xs font-medium">Money Flow (Buying vs Selling Pressure)</div>
                    <div className="text-xs font-bold">Ratio: {analysis.indicators.moneyFlow.ratio}x</div>
                  </div>

                  <div className="flex items-center gap-2 text-xs mb-1">
                    <div className="w-16 text-right text-green-600 font-medium">{analysis.indicators.moneyFlow.inPercent}% In</div>
                    <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${analysis.indicators.moneyFlow.inPercent}% ` }}
                      />
                      <div
                        className="h-full bg-red-500"
                        style={{ width: `${analysis.indicators.moneyFlow.outPercent}% ` }}
                      />
                    </div>
                    <div className="w-16 text-red-600 font-medium">{analysis.indicators.moneyFlow.outPercent}% Out</div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Accumulation</span>
                    <span>Distribution</span>
                  </div>
                </div>
              )}
              {analysis.recommendation?.signals && (
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-1">Signals</div>
                  <div className="flex flex-wrap gap-1">
                    {analysis.recommendation.signals.map((signal, i) => (
                      <span
                        key={i}
                        className={`text - xs px - 2 py - 1 rounded - full ${signal.sentiment === 'bullish' ? 'bg-green-100 text-green-700' :
                          signal.sentiment === 'bearish' ? 'bg-red-100 text-red-700' :
                            signal.sentiment?.includes('bullish') ? 'bg-green-50 text-green-600' :
                              signal.sentiment?.includes('bearish') ? 'bg-red-50 text-red-600' :
                                'bg-gray-100 text-gray-600'
                          } `}
                      >
                        {signal.indicator}: {signal.signal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Controversial Opinions / Risks */}
              {analysis.recommendation?.reasons && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm font-bold text-orange-900 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Controversial Opinions & Risks
                  </div>

                  <div className="space-y-3">
                    {/* Contrarian Technicals */}
                    {/* Contrarian Technicals */}
                    {(
                      (analysis.recommendation.recommendation.includes('BUY') && analysis.recommendation.bearishReasons && analysis.recommendation.bearishReasons.length > 0) ||
                      (analysis.recommendation.recommendation.includes('SELL') && analysis.recommendation.bullishReasons && analysis.recommendation.bullishReasons.length > 0) ||
                      (analysis.recommendation.recommendation === 'HOLD')
                    ) ? (
                      <div>
                        <p className="text-xs font-semibold text-orange-900/70 uppercase tracking-wider mb-1">
                          {analysis.recommendation.recommendation === 'HOLD' ? 'Mixed Signals' : 'Counter-points'}
                        </p>
                        <ul className="text-sm space-y-1">
                          {analysis.recommendation.recommendation.includes('BUY') ? (
                            (analysis.recommendation.bearishReasons || []).slice(0, 3).map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-700">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                                {r}
                              </li>
                            ))
                          ) : analysis.recommendation.recommendation.includes('SELL') ? (
                            (analysis.recommendation.bullishReasons || []).slice(0, 3).map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-700">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                                {r}
                              </li>
                            ))
                          ) : (
                            // HOLD
                            [
                              ...(analysis.recommendation.bullishReasons || []).map(r => `Bullish: ${r} `),
                              ...(analysis.recommendation.bearishReasons || []).map(r => `Bearish: ${r} `)
                            ].slice(0, 4).map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-gray-700">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0"></span>
                                {r}
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 italic">No significant technical contradictions detected.</p>
                    )}

                    {/* Analyst Dissent */}
                    {stock.analystRatings && (
                      <div className="pt-2 border-t border-orange-100">
                        <p className="text-xs text-orange-800 mb-1 font-medium">Wall St Dissent:</p>
                        {analysis.recommendation.recommendation.includes('BUY') && (stock.analystRatings.sell || 0) + (stock.analystRatings.strongSell || 0) > 0 ? (
                          <p className="text-xs text-gray-600">
                            {(stock.analystRatings.sell || 0) + (stock.analystRatings.strongSell || 0)} analysts recommend SELLING, divergent from the technical trend.
                          </p>
                        ) : analysis.recommendation.recommendation.includes('SELL') && (stock.analystRatings.buy || 0) + (stock.analystRatings.strongBuy || 0) > 0 ? (
                          <p className="text-xs text-gray-600">
                            {(stock.analystRatings.buy || 0) + (stock.analystRatings.strongBuy || 0)} analysts recommend BUYING, suggesting value despite negative momentum.
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Analysts generally align with the technical trend.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Latest News */}
              {stock.news && stock.news.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Latest News</div>
                  <div className="space-y-2">
                    {stock.news.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm hover:border-blue-300 transition-all group"
                      >
                        <div className="flex gap-3">
                          {/* Thumbnail if available */}
                          {item.thumbnail?.resolutions?.[0]?.url && (
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                              <img src={item.thumbnail.resolutions[0].url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 line-clamp-2 leading-snug mb-1">
                              {item.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-medium text-gray-600">{item.publisher}</span>
                              <span>•</span>
                              <span>{new Date(item.providerPublishTime).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Buying Options */}
              {stock.alternatives && stock.alternatives.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs font-bold text-green-800 mb-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Alternative Buying Options
                  </div>
                  <div className="space-y-2">
                    {stock.alternatives.map((alt, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-green-100 flex justify-between items-center text-sm">
                        <div>
                          <div className="font-bold text-gray-900">{alt.symbol}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">{alt.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${alt.price?.toFixed(2)}</div>
                          <div className={`text - xs ${alt.changePercent >= 0 ? 'text-green-600' : 'text-red-600'} `}>
                            {alt.changePercent >= 0 ? '+' : ''}{alt.changePercent?.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StockCard;
