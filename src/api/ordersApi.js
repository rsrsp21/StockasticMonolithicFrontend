import axiosInstance from './axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';

/**
 * Orders API service for managing stock orders and holdings.
 */
export const ordersApi = {
    /**
     * Places a new order (buy or sell).
     * @param {Object} orderData - Order details
     * @param {number} orderData.stockId - Stock ID to trade
     * @param {string} orderData.orderType - 'BUY' or 'SELL'
     * @param {string} orderData.orderMode - 'MARKET' or 'LIMIT'
     * @param {number} orderData.quantity - Number of shares
     * @param {number} [orderData.price] - Limit price (required for LIMIT orders)
     */
    placeOrder: async (orderData) => {
        const response = await axiosInstance.post(API_ENDPOINTS.ORDERS.BASE, {
            stockId: orderData.stockId,
            orderType: orderData.orderType.toUpperCase(),
            orderMode: orderData.orderMode.toUpperCase(),
            quantity: parseInt(orderData.quantity),
            price: orderData.price ? parseFloat(orderData.price) : null
        });
        return response.data;
    },

    /**
     * Cancels a pending order.
     * @param {number} orderId - Order ID to cancel
     */
    cancelOrder: async (orderId) => {
        const response = await axiosInstance.delete(API_ENDPOINTS.ORDERS.BY_ID(orderId));
        return response.data;
    },

    /**
     * Gets order history for the current user.
     */
    getOrderHistory: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.ORDERS.BASE);
        return response.data;
    },

    /**
     * Gets a specific order by ID.
     * @param {number} orderId - Order ID
     */
    getOrder: async (orderId) => {
        const response = await axiosInstance.get(API_ENDPOINTS.ORDERS.BY_ID(orderId));
        return response.data;
    },

    /**
     * Gets user's holdings/portfolio.
     */
    getHoldings: async () => {
        const response = await axiosInstance.get(API_ENDPOINTS.ORDERS.HOLDINGS);
        return response.data;
    },

    /**
     * Gets a single holding by stock ID.
     * @param {number} stockId - Stock ID to look up
     * @returns {Object|null} Holding data or null if not found
     */
    getHoldingByStock: async (stockId) => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.ORDERS.HOLDING_BY_STOCK(stockId));
            return response.data;
        } catch (error) {
            if (error.response?.status === 204) {
                return null; // User doesn't hold this stock
            }
            throw error;
        }
    },
};
