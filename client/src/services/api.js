import { supabase } from '../supabase';

const API_BASE = '/api';

// --- Portfolio Functions ---

export const fetchPortfolio = async () => {
  // 1. Get user session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // 2. Fetch portfolio DB items from Supabase
  const { data: items, error } = await supabase
    .from('portfolio')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!items || items.length === 0) return { items: [], summary: { totalValue: 0, totalCost: 0, totalGainLoss: 0, stockCount: 0, totalGainLossPercent: 0 } };

  // 3. Get unique symbols to fetch prices
  const uniqueSymbols = [...new Set(items.map(item => item.symbol))];

  // 4. Fetch live prices from our Vercel API
  const pricesResponse = await fetch(`${API_BASE}/batch-quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: uniqueSymbols })
  });

  const priceData = await pricesResponse.json();
  const priceMap = {};
  if (Array.isArray(priceData)) {
    priceData.forEach(p => {
      if (p.data) priceMap[p.symbol] = p.data;
    });
  }

  // 5. Merge DB data with Price data
  const mergedItems = items.map(item => {
    const quote = priceMap[item.symbol];
    if (!quote) return { ...item, error: 'Failed to fetch price' };

    const currentValue = quote.price * item.quantity;
    const costBasis = item.purchase_price * item.quantity;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    return {
      ...item,
      ...quote, // Spread all quote properties (price, change, peRatio, etc.)
      currentValue,
      costBasis,
      gainLoss,
      gainLossPercent,
      currentPrice: quote.price // Ensure explicit field
    };
  });

  // 6. Calculate Summary
  const summary = mergedItems.reduce(
    (acc, item) => {
      if (!item.error) {
        acc.totalValue += item.currentValue || 0;
        acc.totalCost += item.costBasis || 0;
        acc.totalGainLoss += item.gainLoss || 0;
        acc.stockCount += 1;
      }
      return acc;
    },
    { totalValue: 0, totalCost: 0, totalGainLoss: 0, stockCount: 0 }
  );

  summary.totalGainLossPercent = summary.totalCost > 0
    ? (summary.totalGainLoss / summary.totalCost) * 100
    : 0;

  return { items: mergedItems, summary };
};

export const addToPortfolio = async (symbol, quantity, purchasePrice) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('portfolio')
    .insert([{
      user_id: session.user.id,
      symbol: symbol.toUpperCase(),
      quantity: parseFloat(quantity),
      purchase_price: parseFloat(purchasePrice)
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const removeFromPortfolio = async (id) => {
  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const updatePortfolioItem = async (id, quantity, purchasePrice) => {
  const { error } = await supabase
    .from('portfolio')
    .update({ quantity: parseFloat(quantity), purchase_price: parseFloat(purchasePrice) })
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};


// --- Watchlist Functions ---

export const fetchWatchlist = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // 1. Fetch watchlist from Supabase
  const { data: items, error } = await supabase
    .from('watchlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!items || items.length === 0) return { items: [] };

  // 2. Fetch prices
  const uniqueSymbols = [...new Set(items.map(item => item.symbol))];
  const pricesResponse = await fetch(`${API_BASE}/batch-quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: uniqueSymbols })
  });

  const priceData = await pricesResponse.json();
  const priceMap = {};
  if (Array.isArray(priceData)) {
    priceData.forEach(p => {
      if (p.data) priceMap[p.symbol] = p.data;
    });
  }

  // 3. Merge
  const mergedItems = items.map(item => {
    const quote = priceMap[item.symbol];
    if (!quote) return { ...item, error: 'Failed to fetch price' };

    return {
      ...item,
      ...quote,
      currentPrice: quote.price, // Ensure compatibility
      change: quote.change,      // Daily change
      changePercent: quote.changePercent
    };
  });

  return { items: mergedItems };
};

export const addToWatchlist = async (symbol) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('watchlist')
    .insert([{
      user_id: session.user.id,
      symbol: symbol.toUpperCase()
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const removeFromWatchlist = async (id) => {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const updateWatchlistItem = async (id, notes) => {
  // Note: 'notes' field supported?
  const { error } = await supabase
    .from('watchlist')
    .update({ notes: notes }) // Assuming notes field exists in schema
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};


// --- Focus List Functions ---

// --- Focus List Functions ---

export const fetchFocusList = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // 1. Fetch raw list from Supabase
  const { data: items, error } = await supabase
    .from('focus_list')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!items || items.length === 0) return { items: [] };

  // 2. Enrich with market data via backend
  try {
    const response = await fetch(`${API_BASE}/focus-list/enrich`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    if (response.ok) {
      const enrichedData = await response.json();
      return enrichedData; // { items: [...] }
    } else {
      console.warn("Enrichment failed, returning raw items");
      return { items };
    }
  } catch (err) {
    console.error("Failed to enrich focus list:", err);
    return { items };
  }
};

export const addToFocusList = async (symbol, notes = '', target_price = null, stop_loss = null) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('focus_list')
    .insert([{
      user_id: session.user.id,
      symbol: symbol.toUpperCase(),
      notes,
      target_price: target_price ? parseFloat(target_price) : null,
      stop_loss: stop_loss ? parseFloat(stop_loss) : null
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateFocusListItem = async (id, notes, target_price, stop_loss) => {
  const { error } = await supabase
    .from('focus_list')
    .update({
      notes,
      target_price: target_price ? parseFloat(target_price) : null,
      stop_loss: stop_loss ? parseFloat(stop_loss) : null
    })
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};

export const removeFromFocusList = async (id) => {
  const { error } = await supabase
    .from('focus_list')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return { success: true };
};


// --- Other API ---

export const fetchStockHistory = async (symbol, period = '6mo') => {
  const response = await fetch(`${API_BASE}/stocks/${symbol}/history?period=${period}`);
  if (!response.ok) throw new Error('Failed to fetch stock history');
  return response.json();
};

export const fetchSimilarAssets = async (symbol) => {
  const response = await fetch(`${API_BASE}/stocks/${symbol}/similar`);
  if (!response.ok) throw new Error('Failed to fetch similar assets');
  return response.json();
};

export const fetchSectors = async () => {
  const response = await fetch(`${API_BASE}/sectors`);
  if (!response.ok) throw new Error('Failed to fetch sectors');
  return response.json();
};

export const fetchSectorAnalysis = async (sectorName, performance, leaders) => {
  const response = await fetch(`${API_BASE}/sectors/analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sector: sectorName, performance, leaders })
  });
  if (!response.ok) throw new Error(`Failed to fetch sector analysis: ${response.status} ${response.statusText}`);
  return response.json();
};

export const fetchTrendAlerts = async () => {
  const response = await fetch(`${API_BASE}/trend-alerts`);
  if (!response.ok) throw new Error('Failed to fetch trend alerts');
  return response.json();
};

export const fetchInsights = async () => {
  const response = await fetch(`${API_BASE}/insights`);
  if (!response.ok) throw new Error('Failed to fetch insights');
  return response.json();
};

export const getStockData = async (symbol) => {
  // This is used for search/details
  const response = await fetch(`${API_BASE}/stocks/${symbol}`);
  if (!response.ok) throw new Error('Failed to fetch stock data');
  return response.json();
};

export const fetchStockDetails = getStockData;

export const searchStocks = async (query) => {
  // Use Vercel API for search
  // Assuming we don't have a dedicated search endpoint, we might need one.
  // Or if getting single stock is what we mean.
  // Actually, Vercel function /api/stocks/[symbol] fetches full data.
  // But usually search needs a dedicated endpoint. 
  // Let's implement a simple pass-through to Yahoo Finance search if we have it, 
  // OR just assume exact match search for now similar to getStockData if no search endpoint exists.

  // Wait, the previous api.js had:
  // fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(query)}`)
  // Does /api/stocks/search exist? 
  // I only created /api/stocks/[symbol].js

  // Let's create a search endpoint or mock it.
  // For now, let's just create the function to fail gracefully or try to hit a new endpoint.
  const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search stocks');
  return response.json();
};

export const fetchRecommendations = async () => {
  const response = await fetch(`${API_BASE}/recommendations`);
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
};

export const fetchBlackSwanEvents = async () => {
  const response = await fetch(`${API_BASE}/blackswan`);
  if (!response.ok) throw new Error('Failed to fetch black swan events');
  return response.json();
};

export const fetchGrayRhinoEvents = async () => {
  const response = await fetch(`${API_BASE}/grayrhino`);
  if (!response.ok) throw new Error('Failed to fetch gray rhino events');
  return response.json();
};

export const fetchMarketOutlook = async (force = false) => {
  const url = `${API_BASE}/market/outlook${force ? '?force=true' : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 100)}`);
  }
  return response.json();
};
