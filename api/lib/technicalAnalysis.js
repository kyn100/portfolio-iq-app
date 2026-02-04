import { RSI, MACD, SMA, BollingerBands } from 'technicalindicators';

export const calculateIndicators = (historicalData) => {
  const closes = historicalData.map(d => d.close);

  if (closes.length < 50) {
    throw new Error('Insufficient data for technical analysis (need at least 50 days)');
  }

  // Calculate RSI (14-period)
  const rsiValues = RSI.calculate({
    values: closes,
    period: 14,
  });
  const rsi = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;

  // Calculate MACD (12, 26, 9)
  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });
  const macd = macdValues.length > 0 ? macdValues[macdValues.length - 1] : null;

  // Calculate Moving Averages
  const sma20Values = SMA.calculate({ values: closes, period: 20 });
  const sma50Values = SMA.calculate({ values: closes, period: 50 });
  const sma200Values = closes.length >= 200
    ? SMA.calculate({ values: closes, period: 200 })
    : [];

  const sma20 = sma20Values.length > 0 ? sma20Values[sma20Values.length - 1] : null;
  const sma50 = sma50Values.length > 0 ? sma50Values[sma50Values.length - 1] : null;
  const sma200 = sma200Values.length > 0 ? sma200Values[sma200Values.length - 1] : null;

  // Calculate Bollinger Bands (20-period, 2 std dev)
  const bbValues = BollingerBands.calculate({
    values: closes,
    period: 20,
    stdDev: 2,
  });
  const bollingerBands = bbValues.length > 0 ? bbValues[bbValues.length - 1] : null;

  // Calculate Money Flow (Money In vs Money Out) - Last 14 periods
  let moneyIn = 0;
  let moneyOut = 0;
  const period = Math.min(14, historicalData.length - 1);

  // Start from the most recent data point and go back 'period' days
  for (let i = historicalData.length - 1; i >= historicalData.length - period; i--) {
    if (i === 0) continue;

    const current = historicalData[i];

    // Using Typical Price * Volume as the flow amount
    const typicalPrice = (current.high + current.low + current.close) / 3;
    const moneyDir = (typicalPrice * current.volume);

    // Compare with previous day's typical price (approximate) or just simplify to close price direction
    // A more accurate MFI uses previous typical price. We need historical data for i-1.
    const prev = historicalData[i - 1];
    const prevTypicalPrice = (prev.high + prev.low + prev.close) / 3;

    if (typicalPrice > prevTypicalPrice) {
      moneyIn += moneyDir;
    } else if (typicalPrice < prevTypicalPrice) {
      moneyOut += moneyDir;
    }
    // If equal, ignore
  }

  const totalFlow = moneyIn + moneyOut;
  const moneyFlowRatio = moneyOut === 0 ? (moneyIn > 0 ? 100 : 0) : moneyIn / moneyOut;
  const moneyInPercent = totalFlow > 0 ? (moneyIn / totalFlow) * 100 : 0;
  const moneyOutPercent = totalFlow > 0 ? (moneyOut / totalFlow) * 100 : 0;

  const currentPrice = closes[closes.length - 1];

  return {
    currentPrice,
    rsi: rsi ? Math.round(rsi * 100) / 100 : null,
    macd: macd ? {
      MACD: Math.round(macd.MACD * 1000) / 1000,
      signal: Math.round(macd.signal * 1000) / 1000,
      histogram: Math.round(macd.histogram * 1000) / 1000,
    } : null,
    movingAverages: {
      sma20: sma20 ? Math.round(sma20 * 100) / 100 : null,
      sma50: sma50 ? Math.round(sma50 * 100) / 100 : null,
      sma200: sma200 ? Math.round(sma200 * 100) / 100 : null,
    },
    bollingerBands: bollingerBands ? {
      upper: Math.round(bollingerBands.upper * 100) / 100,
      middle: Math.round(bollingerBands.middle * 100) / 100,
      lower: Math.round(bollingerBands.lower * 100) / 100,
    } : null,
    moneyFlow: {
      moneyIn,
      moneyOut,
      ratio: Math.round(moneyFlowRatio * 100) / 100,
      inPercent: Math.round(moneyInPercent * 10) / 10,
      outPercent: Math.round(moneyOutPercent * 10) / 10,
    },
  };
};

export const generateRecommendation = (indicators, fundamentals = null) => {
  const { currentPrice, rsi, macd, movingAverages, bollingerBands, moneyFlow } = indicators;
  let score = 0;
  const signals = [];
  const bullishReasons = [];
  const bearishReasons = [];
  const fundamentalReasons = [];

  // --- Technical Analysis ---

  // RSI Signal (-1 to +1)
  if (rsi !== null) {
    if (rsi < 30) {
      score += 1;
      signals.push({ indicator: 'RSI', signal: 'Oversold', sentiment: 'bullish' });
      bullishReasons.push(`RSI at ${rsi.toFixed(1)} indicates oversold conditions - potential bounce opportunity`);
    } else if (rsi > 70) {
      score -= 1;
      signals.push({ indicator: 'RSI', signal: 'Overbought', sentiment: 'bearish' });
      bearishReasons.push(`RSI at ${rsi.toFixed(1)} indicates overbought conditions - risk of pullback`);
    } else if (rsi < 45) {
      score += 0.3;
      signals.push({ indicator: 'RSI', signal: 'Slightly Oversold', sentiment: 'neutral-bullish' });
      bullishReasons.push(`RSI at ${rsi.toFixed(1)} suggests slight oversold momentum`);
    } else if (rsi > 55) {
      score -= 0.3;
      signals.push({ indicator: 'RSI', signal: 'Slightly Overbought', sentiment: 'neutral-bearish' });
      bearishReasons.push(`RSI at ${rsi.toFixed(1)} shows elevated buying pressure`);
    } else {
      signals.push({ indicator: 'RSI', signal: 'Neutral', sentiment: 'neutral' });
    }
  }

  // MACD Signal (-1 to +1)
  if (macd !== null) {
    if (macd.histogram > 0 && macd.MACD > macd.signal) {
      score += 0.8;
      signals.push({ indicator: 'MACD', signal: 'Bullish Crossover', sentiment: 'bullish' });
      bullishReasons.push('MACD bullish crossover signals upward momentum building');
    } else if (macd.histogram < 0 && macd.MACD < macd.signal) {
      score -= 0.8;
      signals.push({ indicator: 'MACD', signal: 'Bearish Crossover', sentiment: 'bearish' });
      bearishReasons.push('MACD bearish crossover signals downward momentum');
    } else if (macd.histogram > 0) {
      score += 0.4;
      signals.push({ indicator: 'MACD', signal: 'Bullish Momentum', sentiment: 'neutral-bullish' });
      bullishReasons.push('MACD histogram positive - maintaining bullish momentum');
    } else {
      score -= 0.4;
      signals.push({ indicator: 'MACD', signal: 'Bearish Momentum', sentiment: 'neutral-bearish' });
      bearishReasons.push('MACD histogram negative - bearish momentum present');
    }
  }

  // Moving Average Signal (-1 to +1)
  if (movingAverages.sma20 && movingAverages.sma50) {
    if (currentPrice > movingAverages.sma20 && movingAverages.sma20 > movingAverages.sma50) {
      score += 0.8;
      signals.push({ indicator: 'Moving Averages', signal: 'Strong Uptrend', sentiment: 'bullish' });
      bullishReasons.push('Price above 20 & 50-day MAs - strong uptrend confirmed');
    } else if (currentPrice < movingAverages.sma20 && movingAverages.sma20 < movingAverages.sma50) {
      score -= 0.8;
      signals.push({ indicator: 'Moving Averages', signal: 'Strong Downtrend', sentiment: 'bearish' });
      bearishReasons.push('Price below 20 & 50-day MAs - downtrend in place');
    } else if (currentPrice > movingAverages.sma50) {
      score += 0.3;
      signals.push({ indicator: 'Moving Averages', signal: 'Above 50-day MA', sentiment: 'neutral-bullish' });
      bullishReasons.push('Trading above 50-day MA - medium-term trend supportive');
    } else {
      score -= 0.3;
      signals.push({ indicator: 'Moving Averages', signal: 'Below 50-day MA', sentiment: 'neutral-bearish' });
      bearishReasons.push('Trading below 50-day MA - lacks trend support');
    }
  }

  // Bollinger Bands Signal (-1 to +1)
  if (bollingerBands) {
    const bbPosition = (currentPrice - bollingerBands.lower) / (bollingerBands.upper - bollingerBands.lower);
    if (bbPosition < 0.2) {
      score += 0.7;
      signals.push({ indicator: 'Bollinger Bands', signal: 'Near Lower Band', sentiment: 'bullish' });
      bullishReasons.push('Near lower Bollinger Band - potentially oversold, mean reversion likely');
    } else if (bbPosition > 0.8) {
      score -= 0.7;
      signals.push({ indicator: 'Bollinger Bands', signal: 'Near Upper Band', sentiment: 'bearish' });
      bearishReasons.push('Near upper Bollinger Band - extended, pullback risk elevated');
    } else if (bbPosition < 0.4) {
      score += 0.3;
      signals.push({ indicator: 'Bollinger Bands', signal: 'Below Middle', sentiment: 'neutral-bullish' });
      bullishReasons.push('Below middle Bollinger Band - room for upside');
    } else if (bbPosition > 0.6) {
      score -= 0.3;
      signals.push({ indicator: 'Bollinger Bands', signal: 'Above Middle', sentiment: 'neutral-bearish' });
      bearishReasons.push('Above middle Bollinger Band - approaching resistance');
    } else {
      signals.push({ indicator: 'Bollinger Bands', signal: 'Middle Range', sentiment: 'neutral' });
    }
  }

  // Money Flow Signal
  if (moneyFlow) {
    const { ratio } = moneyFlow;
    if (ratio >= 2.0) {
      score += 0.8;
      signals.push({ indicator: 'Money Flow', signal: 'Strong Buying Pressure', sentiment: 'bullish' });
      bullishReasons.push(`Strong money inflow (Ratio: ${ratio}) indicating accumulation`);
    } else if (ratio >= 1.2) {
      score += 0.4;
      signals.push({ indicator: 'Money Flow', signal: 'Buying Pressure', sentiment: 'neutral-bullish' });
      bullishReasons.push(`Positive money inflow (Ratio: ${ratio})`);
    } else if (ratio <= 0.5) {
      score -= 0.8;
      signals.push({ indicator: 'Money Flow', signal: 'Strong Selling Pressure', sentiment: 'bearish' });
      bearishReasons.push(`Strong money outflow (Ratio: ${ratio}) indicating distribution`);
    } else if (ratio <= 0.8) {
      score -= 0.4;
      signals.push({ indicator: 'Money Flow', signal: 'Selling Pressure', sentiment: 'neutral-bearish' });
      bearishReasons.push(`Net money outflow (Ratio: ${ratio})`);
    } else {
      signals.push({ indicator: 'Money Flow', signal: 'Neutral', sentiment: 'neutral' });
    }
  }

  // --- Fundamental Analysis (Contextual) ---
  if (fundamentals) {
    // ETF Specific Analysis
    if (fundamentals.quoteType === 'ETF') {
      if (fundamentals.expenseRatio !== null && fundamentals.expenseRatio !== undefined) {
        // Yahoo Finance returns expense ratio as a percentage (e.g., 0.25 for 0.25%)
        // Thresholds adjusted: 0.20 (Ultra Low), 0.50 (Low), 1.00 (High)
        if (fundamentals.expenseRatio < 0.20) {
          fundamentalReasons.push(`Ultra-Low Expense Ratio: ${fundamentals.expenseRatio.toFixed(2)}% minimizes long-term costs.`);
        } else if (fundamentals.expenseRatio <= 0.50) {
          fundamentalReasons.push(`Low Expense Ratio: ${fundamentals.expenseRatio.toFixed(2)}% is cost-effective.`);
        } else if (fundamentals.expenseRatio > 1.00) {
          fundamentalReasons.push(`High Expense Ratio: ${fundamentals.expenseRatio.toFixed(2)}% impacts net returns.`);
        }
      }

      if (fundamentals.netAssets) {
        const assetsInBillions = fundamentals.netAssets / 1000000000;
        if (assetsInBillions > 10) {
          fundamentalReasons.push(`High Liquidity: $${assetsInBillions.toFixed(1)}B in assets ensures tight spreads.`);
        }
      }
    }
    // Equity Specific Analysis
    else {
      if (fundamentals.peRatio) {
        if (fundamentals.peRatio < 15 && fundamentals.peRatio > 0) {
          fundamentalReasons.push(`Attractive Valuation: Low P/E Ratio of ${fundamentals.peRatio.toFixed(2)} suggests value.`);
        } else if (fundamentals.peRatio > 50) {
          fundamentalReasons.push(`Premium Valuation: High P/E Ratio of ${fundamentals.peRatio.toFixed(2)} priced for high growth.`);
        } else {
          fundamentalReasons.push(`Fair Valuation: P/E Ratio of ${fundamentals.peRatio.toFixed(2)} is within average range.`);
        }
      }
    }

    // General Fundamentals (Both)
    if (fundamentals.dividendYield && fundamentals.dividendYield > 2) {
      fundamentalReasons.push(`Income Generation: Healthy Dividend Yield of ${fundamentals.dividendYield.toFixed(2)}%.`);
    }

    if (fundamentals.beta) {
      if (fundamentals.beta < 0.8) {
        fundamentalReasons.push(`Low Volatility: Beta of ${fundamentals.beta.toFixed(2)} indicates stability relative to market.`);
      } else if (fundamentals.beta > 1.5) {
        fundamentalReasons.push(`High Volatility: Beta of ${fundamentals.beta.toFixed(2)} implies larger price swings.`);
      }
    }

    // Market Cap context (applies to both if mapped correctly)
    if (fundamentals.marketCap && fundamentals.marketCap > 100000000000) { // >100B
      fundamentalReasons.push(`Large Cap Strength: Significant market presence ($${(fundamentals.marketCap / 1e9).toFixed(0)}B).`);
    }
  }

  // Normalize score to -1 to +1 range
  const normalizedScore = Math.max(-1, Math.min(1, score / 3.3));

  // Determine recommendation
  let recommendation;
  let confidence;

  if (normalizedScore > 0.5) {
    recommendation = 'BUY';
    confidence = 'high';
  } else if (normalizedScore > 0.25) {
    recommendation = 'BUY';
    confidence = 'medium';
  } else if (normalizedScore > 0.1) {
    recommendation = 'HOLD';
    confidence = 'low';
  } else if (normalizedScore > -0.1) {
    recommendation = 'HOLD';
    confidence = 'medium';
  } else if (normalizedScore > -0.25) {
    recommendation = 'HOLD';
    confidence = 'low';
  } else if (normalizedScore > -0.5) {
    recommendation = 'SELL';
    confidence = 'medium';
  } else {
    recommendation = 'SELL';
    confidence = 'high';
  }

  // Generate summary reasons based on recommendation
  let reasons = [];

  // Mix fundamental reasons with technical ones
  if (recommendation === 'BUY') {
    // Top 2 Fundamental + Top 3 Bullish Technical
    reasons = [...fundamentalReasons.slice(0, 2), ...bullishReasons.slice(0, 3)];
    if (bearishReasons.length > 0) {
      reasons.push(`Caution: ${bearishReasons[0]}`);
    }
  } else if (recommendation === 'SELL') {
    // Top 2 Fundamental + Top 3 Bearish Technical (if fundamental supports sell, otherwise just info)
    reasons = [...fundamentalReasons.slice(0, 2), ...bearishReasons.slice(0, 3)];
    if (bullishReasons.length > 0) {
      reasons.push(`Note: ${bullishReasons[0]}`);
    }
  } else {
    // HOLD
    if (fundamentalReasons.length > 0) {
      reasons = fundamentalReasons.slice(0, 3);
      reasons.push("Technical signals are mixed, suggesting a wait-and-see approach.");
    } else {
      if (bullishReasons.length > 0 && bearishReasons.length > 0) {
        reasons.push(`Bullish: ${bullishReasons[0]}`);
        reasons.push(`Bearish: ${bearishReasons[0]}`);
        reasons.push('Mixed signals suggest waiting for clearer direction');
      } else {
        reasons.push('Insufficient clear signals to determine direction.');
      }
    }
  }

  return {
    recommendation,
    confidence,
    score: Math.round(normalizedScore * 100) / 100,
    signals,
    reasons: reasons.slice(0, 5), // Max 5 reasons
    bullishCount: bullishReasons.length,
    bearishCount: bearishReasons.length,
    bullishReasons: bullishReasons,
    bearishReasons: bearishReasons
  };
};

export const analyzeStock = (historicalData, fundamentals = null) => {
  const indicators = calculateIndicators(historicalData);
  const recommendation = generateRecommendation(indicators, fundamentals);

  return {
    indicators,
    recommendation,
  };
};
