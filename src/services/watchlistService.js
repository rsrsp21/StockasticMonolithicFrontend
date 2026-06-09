import axiosInstance from '../api/axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';

/**
 * Watchlist Service - Handles all watchlist-related API calls
 * 
 * Backend Endpoints:
 * - GET    /api/watchlists                              // Get user's watchlists
 * - GET    /api/watchlists/{watchlistId}                // Get watchlist details
 * - POST   /api/watchlists                              // Create watchlist
 * - PUT    /api/watchlists/{watchlistId}                // Update watchlist
 * - DELETE /api/watchlists/{watchlistId}                // Delete watchlist
 * - GET    /api/watchlists/{watchlistId}/items          // Get items in watchlist with prices
 * - POST   /api/watchlists/{watchlistId}/items          // Add stock to watchlist
 * - DELETE /api/watchlists/{watchlistId}/items/{stockId} // Remove stock from watchlist
 * - GET    /api/watchlists/contains/{stockId}           // Check if stock in user's watchlists
 */

const getParam = (val) => (val !== undefined && val !== null && val !== '') ? val : undefined;

/**
 * Search for stocks to add to watchlist
 * Uses the same search endpoint as stockService for public stocks
 */
export const searchStocksToAdd = async (
    page = 0,
    size = 10,
    sortBy = 'symbol',
    sortDir = 'asc',
    query = '',
    filters = {}
) => {
    const { sector, exchange, minPrice, maxPrice, minVolume, maxVolume } = filters;
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.SEARCH, {
        params: {
            query: getParam(query),
            sector: getParam(sector),
            exchange: getParam(exchange),
            minPrice: getParam(minPrice),
            maxPrice: getParam(maxPrice),
            minVolume: getParam(minVolume),
            maxVolume: getParam(maxVolume),
            page,
            size,
            sortBy,
            sortDir,
        },
    });
    return response.data;
};

/**
 * Get user's watchlists with pagination
 */
export const getUserWatchlistsPaged = async (
    userId,
    page = 0,
    size = 10,
    sortBy = 'createdAt',
    sortDir = 'desc'
) => {
    const response = await axiosInstance.get(API_ENDPOINTS.WATCHLIST.BASE, {
        params: {
            userId,
            page,
            size,
            sortBy,
            sortDir,
        },
    });
    return response.data;
};

/**
 * Get watchlist by ID with details
 */
export const getWatchlistById = async (watchlistId, userId) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.WATCHLIST.BASE}/${watchlistId}`, {
        params: { userId },
    });
    return response.data;
};

/**
 * Create a new watchlist
 */
export const createWatchlist = async (userId, watchlistData) => {
    const response = await axiosInstance.post(
        API_ENDPOINTS.WATCHLIST.BASE,
        watchlistData,
        {
            params: { userId },
        }
    );
    return response.data;
};

/**
 * Update an existing watchlist
 */
export const updateWatchlist = async (watchlistId, userId, watchlistData) => {
    const response = await axiosInstance.put(
        `${API_ENDPOINTS.WATCHLIST.BASE}/${watchlistId}`,
        watchlistData,
        {
            params: { userId },
        }
    );
    return response.data;
};

/**
 * Delete a watchlist
 */
export const deleteWatchlist = async (watchlistId, userId) => {
    const response = await axiosInstance.delete(
        `${API_ENDPOINTS.WATCHLIST.BASE}/${watchlistId}`,
        {
            params: { userId },
        }
    );
    return response.data;
};

/**
 * Get items in a watchlist with pagination and pricing
 */
export const getWatchlistItemsWithPricesPaged = async (
    watchlistId,
    userId,
    page = 0,
    size = 10,
    sortBy = 'addedAt',
    sortDir = 'desc'
) => {
    const response = await axiosInstance.get(
        API_ENDPOINTS.WATCHLIST.ITEMS(watchlistId),
        {
            params: {
                userId,
                page,
                size,
                sortBy,
                sortDir,
            },
        }
    );
    return response.data;
};

/**
 * Add a stock to a watchlist
 * Request body should be { stockId: number }
 */
export const addStockToWatchlist = async (watchlistId, userId, data) => {
    const response = await axiosInstance.post(
        API_ENDPOINTS.WATCHLIST.ITEMS(watchlistId),
        { stockId: data.stockId || data },
        {
            params: { userId },
        }
    );
    return response.data;
};

/**
 * Remove a stock from a watchlist
 */
export const removeStockFromWatchlist = async (watchlistId, userId, stockId) => {
    const response = await axiosInstance.delete(
        `${API_ENDPOINTS.WATCHLIST.ITEMS(watchlistId)}/${stockId}`,
        {
            params: { userId },
        }
    );
    return response.data;
};

/**
 * Check if a stock is in any of user's watchlists
 */
export const isStockInUserWatchlists = async (stockId, userId) => {
    const response = await axiosInstance.get(
        API_ENDPOINTS.WATCHLIST.CONTAINS(stockId),
        {
            params: { userId },
        }
    );
    return response.data;
};

/**
 * Get IDs of watchlists that contain a specific stock
 */
export const getWatchlistIdsContainingStock = async (stockId, userId) => {
    const response = await axiosInstance.get(
        API_ENDPOINTS.WATCHLIST.IDS_CONTAINING(stockId),
        {
            params: { userId },
        }
    );
    return response.data;
};
