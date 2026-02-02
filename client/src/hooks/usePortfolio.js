import { useState, useEffect, useCallback } from 'react';
import { fetchPortfolio, addToPortfolio as addApi, removeFromPortfolio as removeApi } from '../services/api';

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState({ items: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPortfolio();
      setPortfolio(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addStock = async (symbol, quantity, purchasePrice) => {
    try {
      await addApi(symbol, quantity, purchasePrice);
      await refresh();
    } catch (err) {
      throw err;
    }
  };

  const removeStock = async (id) => {
    try {
      await removeApi(id);
      await refresh();
    } catch (err) {
      throw err;
    }
  };

  return {
    portfolio,
    loading,
    error,
    refresh,
    addStock,
    removeStock,
  };
};
