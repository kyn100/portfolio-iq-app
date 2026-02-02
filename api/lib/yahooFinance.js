import YahooFinance from 'yahoo-finance2';
import axios from 'axios';

const yahooFinance = new YahooFinance();

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Finnhub API key - Get your free key at https://finnhub.io/register
// Free tier: 60 API calls/minute
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

// Helper to convert range string to start date (period1)
const calculateStartDate = (range) => {
  const now = new Date();
  const startDate = new Date(now);

  switch (range) {
    case '1d':
      startDate.setDate(now.getDate() - 1);
      break;
    case '5d':
      startDate.setDate(now.getDate() - 5);
      break;
    case '1mo':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3mo':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6mo':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case '2y':
      startDate.setFullYear(now.getFullYear() - 2);
      break;
    case '5y':
      startDate.setFullYear(now.getFullYear() - 5);
      break;
    case '10y':
      startDate.setFullYear(now.getFullYear() - 10);
      break;
    case 'ytd':
      startDate.setMonth(0, 1);
      break;
    case 'max':
      startDate.setTime(0);
      break;
    default:
      // Default to 6 months if unknown
      startDate.setMonth(now.getMonth() - 6);
  }
  return startDate;
};

// Fetch fundamental data from Finnhub (P/E, dividend, market cap, etc.)
const getFinnhubFundamentals = async (symbol) => {
  if (!FINNHUB_API_KEY) {
    return null; // No API key configured
  }

  try {
    // Fetch basic financials from Finnhub
    const url = `${FINNHUB_BASE}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${FINNHUB_API_KEY}`;
    const response = await axios.get(url);

    const metrics = response.data.metric;
    if (!metrics) return null;

    return {
      peRatio: metrics.peBasicExclExtraTTM || metrics.peTTM || null,
      forwardPE: metrics.peNormalizedAnnual || null,
      pegRatio: metrics.pegTTM || null,
      dividendYield: metrics.dividendYieldIndicatedAnnual || metrics.dividendYield5Y || null,
      dividendRate: metrics.dividendsPerShareTTM || null,
      marketCap: metrics.marketCapitalization ? metrics.marketCapitalization * 1000000 : null, // Convert to actual value
      beta: metrics.beta || null,
      epsTrailingTwelveMonths: metrics.epsTTM || null,
      priceToBook: metrics.pbQuarterly || metrics.pbAnnual || null,
      priceToSales: metrics.psQuarterly || metrics.psAnnual || null,
      revenueGrowth: metrics.revenueGrowth3Y || null,
      profitMargin: metrics.netProfitMarginTTM || null,
      roe: metrics.roeTTM || null,
    };
  } catch (error) {
    // Silently fail - fundamentals are optional enhancement
    if (error.response?.status === 401) {
      console.error('Finnhub API key invalid or missing');
    }
    return null;
  }
};

// Sector ETF benchmarks for comparison
const SECTOR_BENCHMARKS = {
  // Broad Sectors
  'Technology': 'XLK',
  'Healthcare': 'XLV',
  'Financials': 'XLF',
  'Consumer Cyclical': 'XLY',
  'Consumer Defensive': 'XLP',
  'Industrials': 'XLI',
  'Energy': 'XLE',
  'Utilities': 'XLU',
  'Real Estate': 'XLRE',
  'Materials': 'XLB',
  'Communication Services': 'XLC',
  'Commodities': 'DBC',
  'Bonds': 'AGG',
  'Cryptocurrency': 'IBIT',

  // Tech Sub-sectors
  'Semiconductors': 'SMH',
  'AI & Cloud': 'BOTZ',
  'Robotics & Automation': 'ROBO',
  'Software': 'IGV',
  'Cybersecurity': 'HACK',

  // Healthcare Sub-sectors
  'Biotech': 'IBB',

  // Industrial Sub-sectors
  'Defence': 'ITA',
};

// Well-known stock to sector mapping
const STOCK_SECTORS = {
  // Technology
  'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
  'META': 'Technology', 'NVDA': 'Technology', 'AMD': 'Technology', 'INTC': 'Technology',
  'CRM': 'Technology', 'ADBE': 'Technology', 'ORCL': 'Technology', 'CSCO': 'Technology',
  'IBM': 'Technology', 'NOW': 'Technology', 'QCOM': 'Technology', 'TXN': 'Technology',
  'AVGO': 'Technology', 'MU': 'Technology', 'AMAT': 'Technology', 'LRCX': 'Technology',
  // Healthcare
  'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'ABBV': 'Healthcare',
  'MRK': 'Healthcare', 'LLY': 'Healthcare', 'TMO': 'Healthcare', 'ABT': 'Healthcare',
  'DHR': 'Healthcare', 'BMY': 'Healthcare', 'AMGN': 'Healthcare', 'GILD': 'Healthcare',
  // Financial Services
  'JPM': 'Financial Services', 'BAC': 'Financial Services', 'WFC': 'Financial Services',
  'GS': 'Financial Services', 'MS': 'Financial Services', 'C': 'Financial Services',
  'BLK': 'Financial Services', 'SCHW': 'Financial Services', 'AXP': 'Financial Services',
  'V': 'Financial Services', 'MA': 'Financial Services', 'PYPL': 'Financial Services',
  // Consumer Cyclical
  'AMZN': 'Consumer Cyclical', 'TSLA': 'Consumer Cyclical', 'HD': 'Consumer Cyclical',
  'MCD': 'Consumer Cyclical', 'NKE': 'Consumer Cyclical', 'SBUX': 'Consumer Cyclical',
  'LOW': 'Consumer Cyclical', 'TGT': 'Consumer Cyclical', 'F': 'Consumer Cyclical',
  'GM': 'Consumer Cyclical', 'BKNG': 'Consumer Cyclical',
  // Consumer Defensive
  'WMT': 'Consumer Defensive', 'PG': 'Consumer Defensive', 'KO': 'Consumer Defensive',
  'PEP': 'Consumer Defensive', 'COST': 'Consumer Defensive', 'PM': 'Consumer Defensive',
  'MO': 'Consumer Defensive', 'CL': 'Consumer Defensive', 'KMB': 'Consumer Defensive',
  // Energy
  'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'SLB': 'Energy',
  'EOG': 'Energy', 'MPC': 'Energy', 'PSX': 'Energy', 'VLO': 'Energy',
  // Industrials
  'CAT': 'Industrials', 'BA': 'Industrials', 'HON': 'Industrials', 'UPS': 'Industrials',
  'RTX': 'Industrials', 'LMT': 'Industrials', 'GE': 'Industrials', 'MMM': 'Industrials',
  'DE': 'Industrials', 'UNP': 'Industrials',
  // Communication Services
  'DIS': 'Communication Services', 'NFLX': 'Communication Services', 'CMCSA': 'Communication Services',
  'VZ': 'Communication Services', 'T': 'Communication Services', 'TMUS': 'Communication Services',
  // Utilities
  'NEE': 'Utilities', 'DUK': 'Utilities', 'SO': 'Utilities', 'D': 'Utilities',
  // Real Estate
  'AMT': 'Real Estate', 'PLD': 'Real Estate', 'CCI': 'Real Estate', 'EQIX': 'Real Estate',
  'SPG': 'Real Estate', 'O': 'Real Estate',
  // Materials
  'LIN': 'Materials', 'APD': 'Materials', 'SHW': 'Materials', 'FCX': 'Materials',
  'NEM': 'Materials', 'DOW': 'Materials',
};

// ETF to sector mapping
const ETF_SECTORS = {
  'XLK': 'Technology', 'QQQ': 'Technology', 'VGT': 'Technology', 'ARKK': 'Technology',
  'XLV': 'Healthcare', 'VHT': 'Healthcare', 'IBB': 'Healthcare',
  'XLF': 'Financial Services', 'VFH': 'Financial Services',
  'XLY': 'Consumer Cyclical', 'VCR': 'Consumer Cyclical',
  'XLP': 'Consumer Defensive', 'VDC': 'Consumer Defensive',
  'XLE': 'Energy', 'VDE': 'Energy',
  'XLI': 'Industrials', 'VIS': 'Industrials',
  'XLC': 'Communication Services', 'VOX': 'Communication Services',
  'XLU': 'Utilities', 'VPU': 'Utilities',
  'XLRE': 'Real Estate', 'VNQ': 'Real Estate',
  'XLB': 'Materials', 'VAW': 'Materials',
  'SPY': 'Broad Market', 'VOO': 'Broad Market', 'IVV': 'Broad Market',
  'VTI': 'Broad Market', 'DIA': 'Broad Market', 'IWM': 'Broad Market',
};

export const getStockQuote = async (symbol) => {
  try {
    // Fetch chart (1y), quote (for details), and Finnhub fundamentals in parallel
    const period1 = calculateStartDate('1y');
    const [chartData, quoteData, fundamentals] = await Promise.all([
      yahooFinance.chart(symbol, { interval: '1d', period1 }),
      yahooFinance.quote(symbol),
      getFinnhubFundamentals(symbol),
    ]);

    // Fetch description, insider transactions, and analyst ratings (can fail gracefully)
    let description = null;
    let insiderTransactions = [];
    let analystRatings = null;
    let institutionOwnership = null;

    try {
      const summaryData = await yahooFinance.quoteSummary(symbol, {
        modules: ['assetProfile', 'fundProfile', 'insiderTransactions', 'recommendationTrend', 'institutionOwnership']
      });

      description = summaryData?.assetProfile?.longBusinessSummary ||
        summaryData?.fundProfile?.longBusinessSummary ||
        null;

      // Insider transactions (recent buys/sells by executives)
      if (summaryData?.insiderTransactions?.transactions) {
        insiderTransactions = summaryData.insiderTransactions.transactions
          .slice(0, 5)
          .map(t => ({
            name: t.filerName,
            relation: t.filerRelation,
            transactionType: t.transactionText,
            shares: t.shares,
            value: t.value,
            date: t.startDate
          }));
      }

      // Analyst recommendations (buy/hold/sell counts)
      if (summaryData?.recommendationTrend?.trend?.[0]) {
        const trend = summaryData.recommendationTrend.trend[0];
        analystRatings = {
          strongBuy: trend.strongBuy || 0,
          buy: trend.buy || 0,
          hold: trend.hold || 0,
          sell: trend.sell || 0,
          strongSell: trend.strongSell || 0,
          period: trend.period
        };
      }

      // Institution ownership percentage
      if (summaryData?.institutionOwnership?.ownershipList) {
        const topHolders = summaryData.institutionOwnership.ownershipList.slice(0, 3);
        institutionOwnership = topHolders.map(h => ({
          name: h.organization,
          shares: h.position,
          value: h.value,
          pctHeld: h.pctHeld
        }));
      }

    } catch (e) {
      // These are optional, continue without them
    }

    if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
      throw new Error('No data found');
    }

    const meta = chartData.meta;
    const quotes = chartData.quotes;

    // Sort quotes by date just in case
    quotes.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate YTD return
    let ytdReturn = null;
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const yearStartData = quotes.find(q => new Date(q.date) >= startOfYear);

    if (yearStartData) {
      const yearStartPrice = yearStartData.close;
      const currentPrice = meta.regularMarketPrice;
      if (yearStartPrice && currentPrice) {
        ytdReturn = ((currentPrice - yearStartPrice) / yearStartPrice) * 100;
      }
    }

    // Get sector from mapping
    const symbolUpper = symbol.toUpperCase();
    const sector = STOCK_SECTORS[symbolUpper] || ETF_SECTORS[symbolUpper] || null;
    const isETF = meta.instrumentType === 'ETF' || quoteData?.quoteType === 'ETF' || ETF_SECTORS[symbolUpper];

    return {
      symbol: meta.symbol,
      name: quoteData?.longName || meta.shortName || meta.longName || symbol,
      price: meta.regularMarketPrice,
      change: quoteData?.regularMarketChange || (meta.regularMarketPrice - meta.regularMarketPreviousClose),
      changePercent: quoteData?.regularMarketChangePercent || ((meta.regularMarketPrice - meta.regularMarketPreviousClose) / meta.regularMarketPreviousClose) * 100,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      open: quotes[quotes.length - 1]?.open,
      previousClose: meta.chartPreviousClose,
      volume: meta.regularMarketVolume,

      // Description
      description: description,

      // Fundamentals (Prioritize Finnhub, fallback to Yahoo Quote)
      marketCap: fundamentals?.marketCap || quoteData?.marketCap || quoteData?.netAssets || null,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      peRatio: fundamentals?.peRatio || quoteData?.trailingPE || null,
      forwardPE: fundamentals?.forwardPE || quoteData?.forwardPE || null,
      pegRatio: fundamentals?.pegRatio || quoteData?.pegRatio || null,
      ytdReturn: ytdReturn,
      dividendYield: fundamentals?.dividendYield || quoteData?.dividendYield || null,
      dividendRate: fundamentals?.dividendRate || quoteData?.dividendRate || null,
      beta: fundamentals?.beta || quoteData?.beta || null,
      epsTrailingTwelveMonths: fundamentals?.epsTrailingTwelveMonths || quoteData?.epsTrailingTwelveMonths || null,
      priceToBook: fundamentals?.priceToBook || quoteData?.priceToBook || null,

      // ETF Specifics
      expenseRatio: quoteData?.netExpenseRatio || null,
      netAssets: quoteData?.netAssets || null,

      sector: sector,
      industry: isETF ? 'ETF' : (sector ? `${sector} Industry` : null),
      quoteType: isETF ? 'ETF' : 'EQUITY',

      // Who's buying/selling
      insiderTransactions: insiderTransactions,
      analystRatings: analystRatings,
      institutionOwnership: institutionOwnership,
    };

  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error.message);
    if (error.errors) { console.error("Validation errors:", JSON.stringify(error.errors)); }
    console.error("Full error:", error);
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }

};

export const getSectorComparison = async (symbol, sector) => {
  if (!sector || sector === 'Broad Market') return null;

  const benchmarkSymbol = SECTOR_BENCHMARKS[sector];
  if (!benchmarkSymbol) return null;

  try {
    // Get performance data for both stock and sector ETF
    const [stockData, sectorData] = await Promise.all([
      getPerformanceData(symbol),
      getPerformanceData(benchmarkSymbol),
    ]);

    if (!stockData || !sectorData) return null;

    const outperformance = stockData.ytd !== null && sectorData.ytd !== null
      ? stockData.ytd - sectorData.ytd
      : null;

    return {
      sectorName: sector,
      sectorETF: benchmarkSymbol,
      stockYTD: stockData.ytd,
      sectorYTD: sectorData.ytd,
      outperformance: outperformance,
      stock1Month: stockData.oneMonth,
      sector1Month: sectorData.oneMonth,
      stock3Month: stockData.threeMonth,
      sector3Month: sectorData.threeMonth,
      rating: calculateSectorRating(stockData, sectorData),
    };
  } catch (error) {
    console.error(`Error getting sector comparison for ${symbol}:`, error.message);
    return null;
  }
};

const getPerformanceData = async (symbol) => {
  try {
    const period1 = calculateStartDate('1y');
    const [chartData, quoteData] = await Promise.all([
      yahooFinance.chart(symbol, { interval: '1d', period1 }),
      yahooFinance.quote(symbol)
    ]);

    if (!chartData || !chartData.quotes) return null;

    const quotes = chartData.quotes.filter(q => q.close !== null);

    if (quotes.length < 20) return null;

    const currentPrice = quotes[quotes.length - 1].close;

    // Today's change (from quote data for accuracy)
    const todayChange = quoteData?.regularMarketChangePercent || 0;

    // 1 Week (approx 5 trading days)
    const oneWeekIdx = Math.max(0, quotes.length - 5);
    const oneWeek = ((currentPrice - quotes[oneWeekIdx].close) / quotes[oneWeekIdx].close) * 100;

    // YTD
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearStartData = quotes.find(q => new Date(q.date) >= startOfYear);
    const ytd = yearStartData ? ((currentPrice - yearStartData.close) / yearStartData.close) * 100 : null;

    // 1 Month (approx 22 trading days)
    const oneMonthIdx = Math.max(0, quotes.length - 22);
    const oneMonth = ((currentPrice - quotes[oneMonthIdx].close) / quotes[oneMonthIdx].close) * 100;

    // 3 Months (approx 66 trading days)
    const threeMonthIdx = Math.max(0, quotes.length - 66);
    const threeMonth = ((currentPrice - quotes[threeMonthIdx].close) / quotes[threeMonthIdx].close) * 100;

    return { todayChange, oneWeek, ytd, oneMonth, threeMonth };
  } catch (error) {
    console.error(`Error fetching performance data for ${symbol}:`, error.message);
    return null;
  }
};

// Detect trend turning points for a sector ETF
const detectTrendTurning = async (symbol, sectorName) => {
  try {
    const period1 = calculateStartDate('6mo');
    const [chartData, quoteData] = await Promise.all([
      yahooFinance.chart(symbol, { interval: '1d', period1 }),
      yahooFinance.quote(symbol)
    ]);

    if (!chartData?.quotes || chartData.quotes.length < 50) return null;

    const quotes = chartData.quotes.filter(q => q.close !== null);
    const closes = quotes.map(q => q.close);

    // Calculate SMAs
    const calcSMA = (data, period) => {
      if (data.length < period) return null;
      const slice = data.slice(-period);
      return slice.reduce((a, b) => a + b, 0) / period;
    };

    const currentPrice = closes[closes.length - 1];
    const sma10 = calcSMA(closes, 10);
    const sma20 = calcSMA(closes, 20);
    const sma50 = calcSMA(closes, 50);

    // Get previous SMAs (5 days ago) to detect crossovers
    const closes5DaysAgo = closes.slice(0, -5);
    const prevSma10 = calcSMA(closes5DaysAgo, 10);
    const prevSma20 = calcSMA(closes5DaysAgo, 20);
    const prevSma50 = closes5DaysAgo.length >= 50 ? calcSMA(closes5DaysAgo, 50) : null;

    // Calculate RSI
    let gains = 0, losses = 0;
    for (let i = closes.length - 14; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    const avgGain = gains / 14;
    const avgLoss = losses / 14;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    // Performance metrics
    const oneWeekIdx = Math.max(0, closes.length - 5);
    const oneWeekChange = ((currentPrice - closes[oneWeekIdx]) / closes[oneWeekIdx]) * 100;

    const oneMonthIdx = Math.max(0, closes.length - 22);
    const oneMonthChange = ((currentPrice - closes[oneMonthIdx]) / closes[oneMonthIdx]) * 100;

    const todayChange = quoteData?.regularMarketChangePercent || 0;

    // Detect turning signals
    const signals = [];
    let turningDirection = null; // 'bullish' or 'bearish'
    let strength = 0;

    // Context: Trend Direction
    const isUptrend = sma20 > sma50;
    const isDowntrend = sma20 < sma50;

    // 1. Golden Cross / Death Cross Detection (10/20 or 20/50)
    if (prevSma10 && prevSma20 && sma10 && sma20) {
      if (prevSma10 < prevSma20 && sma10 > sma20) {
        if (isUptrend) {
          signals.push({ type: 'Momentum Alignment', description: 'Short-term momentum realigning with long-term uptrend' });
        } else {
          signals.push({ type: 'Golden Cross (10/20)', description: '10-day MA crossed above 20-day MA' });
        }
        turningDirection = 'bullish';
        strength += 2;
      }
      if (prevSma10 > prevSma20 && sma10 < sma20) {
        if (isDowntrend) {
          signals.push({ type: 'Momentum Alignment', description: 'Short-term momentum realigning with downtrend' });
        } else {
          signals.push({ type: 'Death Cross (10/20)', description: '10-day MA crossed below 20-day MA' });
        }
        turningDirection = 'bearish';
        strength += 2;
      }
    }

    if (prevSma20 && prevSma50 && sma20 && sma50) {
      if (prevSma20 < prevSma50 && sma20 > sma50) {
        signals.push({ type: 'Golden Cross (20/50)', description: '20-day MA crossed above 50-day MA - Major bullish signal' });
        turningDirection = 'bullish';
        strength += 3;
      }
      if (prevSma20 > prevSma50 && sma20 < sma50) {
        signals.push({ type: 'Death Cross (20/50)', description: '20-day MA crossed below 50-day MA - Major bearish signal' });
        turningDirection = 'bearish';
        strength += 3;
      }
    }

    // 2. RSI Extreme Reversal (with Price Confirmation)
    if (rsi < 30) {
      if (todayChange > 0) {
        const type = isUptrend ? 'Dip Recovery' : 'RSI Reversal';
        const desc = isUptrend
          ? `Price rebounding from oversold levels in an uptrend (Buy the Dip)`
          : `RSI Oversold confirmed by price rebound`;

        signals.push({ type, description: desc });
        if (!turningDirection) turningDirection = 'bullish';
        strength += 2;
      } else {
        signals.push({ type: 'Deep Oversold', description: `RSI at ${rsi.toFixed(1)} describes oversold conditions (Monitoring)` });
        if (!turningDirection) turningDirection = 'neutral';
        strength += 0.5;
      }
    } else if (rsi > 70) {
      if (todayChange < 0) {
        const type = isDowntrend ? 'Trend Resume (Down)' : 'RSI Trend Exhaustion';
        signals.push({ type, description: `RSI Overbought confirmed by pullback` });
        if (!turningDirection) turningDirection = 'bearish';
        strength += 2;
      } else {
        signals.push({ type: 'Extreme Overbought', description: `RSI at ${rsi.toFixed(1)} indicates potential overheating` });
        if (!turningDirection) turningDirection = 'neutral';
        strength += 0.5;
      }
    }

    // 3. Momentum Divergence
    if (oneWeekChange > 3 && oneMonthChange < 0) {
      signals.push({ type: 'Momentum Shift Up', description: 'Strong weekly gain recovering from negative month' });
      if (!turningDirection) turningDirection = 'bullish';
      strength += 2;
    } else if (oneWeekChange < -3 && oneMonthChange > 0) {
      signals.push({ type: 'Momentum Shift Down', description: 'Sudden weekly drop breaking monthly uptrend' });
      if (!turningDirection) turningDirection = 'bearish';
      strength += 2;
    }

    // 4. Price vs MA Breakout
    // We calculate approx previous MA. For simplicity, assume MA matched trend or calculate properly?
    // We have closes. 
    const prevMA20Val = calcSMA(closes.slice(0, -5), 20); // 5 days ago? 
    // Using 6 days ago price closes[closes.length-6] vs MA then.
    // Ideally we check if it crossed YESTERDAY or TODAY.
    // If current > SMA20 and PrevClose < SMA20?
    // Let's use PREVIOUS DAY CLOSE to be accurate.
    const prevClose = closes[closes.length - 2];
    // SMA20 yesterday approx? 
    // Let's stick to the simpler "Current vs Previous Week" logic used before:
    // closes[closes.length - 6] is 1 week ago.
    if (currentPrice > sma20 && closes[closes.length - 6] < prevMA20Val) {
      if (isUptrend) {
        signals.push({ type: 'Trend Continuation', description: 'Price reclaimed 20-day MA, confirming uptrend' });
      } else {
        signals.push({ type: 'Breakout Above 20-MA', description: 'Price broke above 20-day MA - potential reversal' });
      }
      if (!turningDirection) turningDirection = 'bullish';
      strength += 1;
    } else if (currentPrice < sma20 && closes[closes.length - 6] > prevMA20Val) {
      if (isDowntrend) {
        signals.push({ type: 'Trend Continuation (Down)', description: 'Price fell back below 20-day MA, resuming downtrend' });
      } else {
        signals.push({ type: 'Breakdown Below 20-MA', description: 'Price broke below 20-day MA - potential reversal' });
      }
      if (!turningDirection) turningDirection = 'bearish';
      strength += 1;
    }

    if (signals.length === 0) return null;

    return {
      sector: sectorName,
      etf: symbol,
      direction: turningDirection,
      strength: Math.min(strength, 5), // Cap at 5
      signals,
      metrics: {
        currentPrice,
        todayChange,
        oneWeekChange,
        oneMonthChange,
        rsi: Math.round(rsi * 10) / 10,
        sma20: Math.round(sma20 * 100) / 100,
        sma50: sma50 ? Math.round(sma50 * 100) / 100 : null
      }
    };
  } catch (error) {
    console.error(`Error detecting trend for ${symbol}:`, error.message);
    return null;
  }
};

// Get all sectors with trend turning points
export const getTrendAlerts = async () => {
  try {
    const sectors = Object.entries(SECTOR_BENCHMARKS);

    const alertPromises = sectors.map(async ([sectorName, etfSymbol]) => {
      return await detectTrendTurning(etfSymbol, sectorName);
    });

    const results = await Promise.all(alertPromises);
    const alerts = results.filter(r => r !== null);

    // Sort by strength (highest first)
    return alerts.sort((a, b) => b.strength - a.strength);
  } catch (error) {
    console.error('Error getting trend alerts:', error);
    return [];
  }
};

const calculateSectorRating = (stockData, sectorData) => {
  if (!stockData?.ytd || !sectorData?.ytd) return 'N/A';

  const outperformance = stockData.ytd - sectorData.ytd;
  let score = 0;

  // YTD comparison (weight: 60%)
  if (outperformance > 20) score += 2.4;
  else if (outperformance > 10) score += 1.8;
  else if (outperformance > 5) score += 1.2;
  else if (outperformance > 0) score += 0.6;
  else if (outperformance > -5) score += 0;
  else if (outperformance > -10) score -= 0.6;
  else if (outperformance > -20) score -= 1.2;
  else score -= 1.8;

  // 1-Month momentum comparison (weight: 40%)
  if (stockData.oneMonth !== null && sectorData.oneMonth !== null) {
    const monthOutperf = stockData.oneMonth - sectorData.oneMonth;
    if (monthOutperf > 10) score += 1.6;
    else if (monthOutperf > 5) score += 1.0;
    else if (monthOutperf > 0) score += 0.4;
    else if (monthOutperf > -5) score += 0;
    else if (monthOutperf > -10) score -= 0.4;
    else score -= 0.8;
  }

  // Convert score to rating
  if (score >= 3) return 'Strong Outperformer';
  if (score >= 1.5) return 'Outperformer';
  if (score >= -0.5) return 'In-Line';
  if (score >= -2) return 'Underperformer';
  return 'Strong Underperformer';
};

export const getHistoricalData = async (symbol, period = '6mo') => {
  try {
    const period1 = calculateStartDate(period);
    const chartData = await yahooFinance.chart(symbol, { interval: '1d', period1 });

    if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
      throw new Error('No data found');
    }

    // Convert to format expected by technical analysis tools
    return chartData.quotes
      .filter(q => q.close !== null && q.close !== undefined)
      .map(q => ({
        date: q.date.toISOString(), // yahoo-finance2 returns Date object
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      }));
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    throw new Error(`Failed to fetch historical data for ${symbol}`);
  }
};

export const getNews = async (symbol) => {
  try {
    const result = await yahooFinance.search(symbol, { newsCount: 5, quotesCount: 0 });
    return result.news || [];
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error.message);
    return [];
  }
};

// Alternatives Mapping
const ALTERNATIVES = {
  // ETFs
  'IBIT': ['FBTC', 'ARKB', 'BITB', 'BITO'],
  'FBTC': ['IBIT', 'ARKB', 'BITB'],
  'ARKB': ['IBIT', 'FBTC', 'BITB'],
  'SPY': ['VOO', 'IVV', 'SPLG'],
  'VOO': ['SPY', 'IVV', 'SPLG'],
  'QQQ': ['QQQM', 'VGT', 'XLK'],
  'XLK': ['VGT', 'QQQ', 'FTEC'],
  'XLF': ['VFH', 'IYF', 'KBE'],
  'ARKK': ['ARKW', 'ARKQ', 'ARKG'],
  'SMH': ['SOXX', 'SOXL', 'PSI'],

  // Tech Stocks
  'MSFT': ['GOOGL', 'AAPL', 'NVDA', 'ORCL'],
  'AAPL': ['MSFT', 'GOOGL', 'AMZN'],
  'GOOGL': ['MSFT', 'META', 'AMZN'],
  'NVDA': ['AMD', 'AVGO', 'TSM', 'INTC'],
  'AMD': ['NVDA', 'INTC', 'MU'],
  'ORCL': ['MSFT', 'AMZN', 'CRM', 'SAP'],

  // Finance
  'JPM': ['BAC', 'WFC', 'C', 'GS'],
  'GS': ['MS', 'JPM', 'BLK'],
  'V': ['MA', 'AXP', 'PYPL'],

  // Consumer
  'TSLA': ['RIVN', 'F', 'GM', 'TM'],
  'AMZN': ['WMT', 'TGT', 'BABA'],
  'WMT': ['TGT', 'COST', 'DG'],
};

// Sector-based defaults if specific symbol not found
const SECTOR_ALTERNATIVES = {
  // Broad Sectors
  'Technology': ['MSFT', 'AAPL', 'NVDA', 'GOOGL', 'AMD'],
  'Healthcare': ['UNH', 'JNJ', 'LLY', 'PFE', 'ABBV'],
  'Financials': ['JPM', 'BAC', 'V', 'GS', 'BLK'],
  'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'NKE', 'MCD'],
  'Consumer Defensive': ['WMT', 'PG', 'KO', 'PEP', 'COST'],
  'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
  'Industrials': ['CAT', 'HON', 'UPS', 'GE', 'BA'],
  'Utilities': ['NEE', 'DUK', 'SO', 'D', 'AEP'],
  'Real Estate': ['AMT', 'PLD', 'SPG', 'CCI', 'EQIX'],
  'Materials': ['LIN', 'APD', 'NEM', 'FCX', 'MP', 'REMX', 'DOW', 'SHW'],
  'Communication Services': ['GOOGL', 'META', 'NFLX', 'DIS', 'VZ'],
  'Commodities': ['GLD', 'SLV', 'USO', 'UNG', 'CORN'],
  'Bonds': ['TLT', 'IEF', 'LQD', 'HYG', 'TIP'],
  'Cryptocurrency': ['IBIT', 'FBTC', 'ETHE', 'ARKB', 'BITO'],

  // Tech Sub-sectors
  'Semiconductors': ['NVDA', 'AMD', 'AVGO', 'TSM', 'INTC', 'MU', 'QCOM', 'AMAT'],
  'AI & Cloud': ['NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'PLTR', 'SNOW', 'AI'],
  'Robotics & Automation': ['ABB', 'ROK', 'ISRG', 'FANUY', 'TER', 'CGNX'],
  'Software': ['MSFT', 'CRM', 'ADBE', 'NOW', 'ORCL', 'SAP', 'INTU', 'TEAM'],
  'Cybersecurity': ['CRWD', 'PANW', 'FTNT', 'ZS', 'OKTA', 'NET', 'S'],

  // Healthcare Sub-sectors
  'Biotech': ['AMGN', 'GILD', 'VRTX', 'REGN', 'BIIB', 'MRNA', 'BNTX', 'ILMN'],

  // Industrial Sub-sectors
  'Defence': ['LMT', 'RTX', 'NOC', 'GD', 'BA', 'LHX', 'HII', 'LDOS'],
};

import { analyzeStock } from './technicalAnalysis.js';

export const getAlternatives = async (symbol, sector) => {
  const symbolUpper = symbol.toUpperCase();

  // 1. Direct symbol lookups (hand-picked competitors)
  let candidates = ALTERNATIVES[symbolUpper] || [];

  // 2. Fallback to Sector defaults
  if (candidates.length === 0 && sector) {
    candidates = SECTOR_ALTERNATIVES[sector] || [];
  }

  // If no candidates, return empty
  if (candidates.length === 0) return [];

  // Filter out the symbol itself
  candidates = candidates.filter(c => c !== symbolUpper);

  // Limit to top 4 to check
  candidates = candidates.slice(0, 4);

  try {
    // Analyze candidates in parallel
    const validAlternatives = await Promise.all(candidates.map(async (candSymbol) => {
      try {
        const period1 = calculateStartDate('1y');
        const [chartData, quoteData] = await Promise.all([
          yahooFinance.chart(candSymbol, { interval: '1d', period1 }),
          yahooFinance.quote(candSymbol)
        ]);

        if (!chartData || !chartData.quotes || chartData.quotes.length < 50) return null;

        // Map history
        const historicalData = chartData.quotes
          .filter(q => q.close !== null)
          .map(q => ({
            date: q.date,
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume
          }));

        // Run Analysis
        const analysis = analyzeStock(historicalData, quoteData);

        // Filter Logic: Exclude SELLs. Only allow BUY or HOLD.
        if (analysis.recommendation.recommendation === 'SELL') {
          return null;
        }

        return {
          symbol: candSymbol,
          name: quoteData.shortName || quoteData.longName || candSymbol,
          price: quoteData.regularMarketPrice,
          changePercent: quoteData.regularMarketChangePercent,
          peRatio: quoteData.trailingPE,
          recommendation: analysis.recommendation.recommendation
        };

      } catch (e) {
        console.warn(`Failed to analyze alternative ${candSymbol}: ${e.message}`);
        return null;
      }
    }));

    // Filter nulls
    return validAlternatives.filter(a => a !== null);

  } catch (error) {
    console.error(`Error fetching alternatives for ${symbol}:`, error.message);
    return [];
  }
};

// ... existing code ...

export const getSectorPerformance = async () => {
  try {
    const sectors = Object.entries(SECTOR_BENCHMARKS);

    // 1. Fetch Benchmark Data (Sequential to be safe, or chunks)
    // We need Trend data (YTD, 1M), which requires chart data via getPerformanceData
    // Let's do it in parallel but limited? Or just Promise.all for 11 items is likely fine.

    const sectorPromises = sectors.map(async ([sectorName, etfSymbol]) => {
      try {
        const perf = await getPerformanceData(etfSymbol);

        // Get leaders for this sector
        const leadersSymbols = SECTOR_ALTERNATIVES[sectorName] || [];
        // Filter out the ETF itself if present in leaders (to avoid duplicate stats?)
        // Actually SECTOR_ALTERNATIVES includes the ETF often. Let's keep distinct stocks.
        const stockLeaders = leadersSymbols.filter(s => s !== etfSymbol && !s.startsWith('XL') && !s.startsWith('V'));
        // Heuristic: Remove ETFs from "Stock Leaders" list to show actual companies if possible? 
        // Or just show top 3 from the list.
        const topLeaders = leadersSymbols.slice(0, 5);

        return {
          name: sectorName,
          etf: etfSymbol,
          performance: perf || { todayChange: 0, oneWeek: 0, ytd: 0, oneMonth: 0, threeMonth: 0 }, // fallback
          leaders: topLeaders
        };
      } catch (e) {
        console.error(`Failed to fetch sector ${sectorName}:`, e);
        return null;
      }
    });

    const results = await Promise.all(sectorPromises);
    const validResults = results.filter(s => s !== null);

    // 2. Fetch Quotes for all Leaders to determine their individual daily action
    // Collect all unique leader symbols
    const allLeaderSymbols = [...new Set(validResults.flatMap(r => r.leaders))];

    // Fetch quotes in batch
    // yahooFinance.quote can take an array
    let leaderQuotes = [];
    try {
      if (allLeaderSymbols.length > 0) {
        leaderQuotes = await yahooFinance.quote(allLeaderSymbols);
      }
    } catch (e) {
      console.error("Failed to fetch leader quotes:", e);
    }

    // Create map for easy lookup
    const quoteMap = {};
    leaderQuotes.forEach(q => {
      quoteMap[q.symbol] = {
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice,
        change: q.regularMarketChangePercent,
        pe: q.trailingPE
      };
    });

    // Merge quotes back into results
    return validResults.map(sector => ({
      ...sector,
      leaders: sector.leaders.map(symbol => quoteMap[symbol] || { symbol, name: symbol, price: 0, change: 0 })
    })).sort((a, b) => (b.performance.ytd || 0) - (a.performance.ytd || 0)); // Sort by YTD descending

  } catch (error) {
    console.error("Error getting all sector performance:", error);
    return [];
  }
};

export const searchSymbol = async (query) => {
  try {
    // Yahoo Finance 2 search uses a different structure
    const result = await yahooFinance.search(query);
    const quotes = result.quotes || [];

    return quotes
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .slice(0, 10)
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType,
        exchange: q.exchange || q.exchDisp || '',
      }));
  } catch (error) {
    console.error(`Error searching for ${query}:`, error.message);
    return [];
  }
};

export const getMarketNews = async () => {
  try {
    // Add "today" or "latest" to try and influence recency
    const result = await yahooFinance.search('stock market news today', { newsCount: 10 });
    return result.news || [];
  } catch (error) {
    console.error("Error fetching market news:", error);
    return [];
  }
};

export const getInnovationNews = async () => {
  const queries = [
    'Artificial Intelligence breakthrough news',
    'Green energy innovation news',
    'Biotech medical breakthrough news',
    'Space technology news',
    'Next gen battery technology news'
  ];

  try {
    const promises = queries.map(q => yahooFinance.search(q, { newsCount: 2 }));
    const results = await Promise.all(promises);
    return results.flatMap(r => r.news || []);
  } catch (error) {
    console.error("Error fetching innovation news:", error);
    return [];
  }
};

export const getEconomicEvents = async () => {
  const categories = [
    { name: 'Federal Reserve & Rates', query: 'Federal Reserve interest rates news' },
    { name: 'Inflation (CPI/PPI)', query: 'CPI inflation report news' },
    { name: 'Jobs & Economy', query: 'Jobs report unemployment economy news' },
    { name: 'Earnings Season', query: 'Stock market earnings season news' },
    { name: 'Global Markets', query: 'Global economic markers news' }
  ];

  try {
    const promises = categories.map(async (cat) => {
      const res = await yahooFinance.search(cat.query, { newsCount: 3 });
      return {
        name: cat.name,
        news: res.news || []
      };
    });

    return await Promise.all(promises);
  } catch (error) {
    console.error("Error fetching economic events:", error);
    return [];
  }
};

export const getSocialSentiment = async () => {
  try {
    const queries = ['market sentiment news', 'meme stocks news', 'trending stocks news'];
    const results = await Promise.all(queries.map(q => yahooFinance.search(q, { newsCount: 4 })));

    const allNews = results.flatMap(r => r.news || []);
    // Deduplicate by link
    const uniqueNews = Array.from(new Map(allNews.map(item => [item.link, item])).values());

    // Sort by provider publish time if available (descending)
    uniqueNews.sort((a, b) => (b.providerPublishTime || 0) - (a.providerPublishTime || 0));

    return uniqueNews.slice(0, 8);
  } catch (error) {
    console.error("Error fetching social sentiment:", error);
    return [];
  }
};
