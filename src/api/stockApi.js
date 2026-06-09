import api from './axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';

/**
 * Fetch top gaining stocks.
 * @param {number} limit - Number of top gainers to fetch (default: 5).
 * @returns {Promise<Array>} - List of top gaining stocks with price data.
 */
export const getTopGainers = async (limit = 5) => {
    const response = await api.get(API_ENDPOINTS.STOCKS.MARKET_GAINERS, { params: { limit } });
    return response.data;
};

/**
 * Fetch top losing stocks.
 * @param {number} limit - Number of top losers to fetch (default: 5).
 * @returns {Promise<Array>} - List of top losing stocks with price data.
 */
export const getTopLosers = async (limit = 5) => {
    const response = await api.get(API_ENDPOINTS.STOCKS.MARKET_LOSERS, { params: { limit } });
    return response.data;
};

/**
 * Fetch most traded stocks (by order count).
 * @param {number} limit - Number of most traded stocks to fetch (default: 3).
 * @returns {Promise<Array>} - List of most traded stocks.
 */
export const getMostTraded = async (limit = 3) => {
    const response = await api.get(API_ENDPOINTS.STOCKS.MARKET_MOST_TRADED, { params: { limit } });
    return response.data;
};

/**
 * Fetch latest price snapshots for active stocks.
 * @returns {Promise<Array>} - List of active stocks with latest price + indicator verdicts.
 */
export const getLatestPrices = async () => {
    const response = await api.get(API_ENDPOINTS.STOCKS.PRICES.LATEST);
    return response.data;
};
