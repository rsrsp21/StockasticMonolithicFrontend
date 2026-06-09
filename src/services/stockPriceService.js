/**
 * Stock Price Service
 * Handles API calls for stock price data from backend
 */
import axiosInstance from '../api/axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';

// Get latest price for a stock by ID
export const getLatestPrice = async (stockId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.LATEST_BY_ID(stockId));
    return response.data;
};

// Get latest price by symbol
export const getLatestPriceBySymbol = async (symbol) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.LATEST_BY_SYMBOL(symbol));
    return response.data;
};

// Get all latest prices for active stocks
export const getAllLatestPrices = async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.LATEST);
    return response.data;
};

// Get price history within time range
export const getPriceHistory = async (stockId, startTime, endTime) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.HISTORY(stockId), {
        params: { startTime, endTime }
    });
    return response.data;
};

// Get indicator series for chart plotting
export const getIndicatorSeries = async (stockId, range = "1D") => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.INDICATORS(stockId), {
        params: { range }
    });
    return response.data;
};

// Get stock details by ID
export const getStockById = async (stockId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.BY_ID_PUBLIC(stockId));
    return response.data;
};

// Get stock details by symbol
export const getStockBySymbol = async (symbol) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.BY_SYMBOL_PUBLIC(symbol));
    return response.data;
};

// Chart data from Yahoo Finance (1W, 1M, 3M, 1Y, 3Y)
export const getChartData1W = async (symbol) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.CHART(symbol, '1w'));
    return response.data;
};

export const getChartData1M = async (symbol) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.CHART(symbol, '1m'));
    return response.data;
};

export const getChartData3M = async (symbol) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.CHART(symbol, '3m'));
    return response.data;
};

export const getChartData1Y = async (symbol) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.CHART(symbol, '1y'));
    return response.data;
};

export const getChartData3Y = async (symbol) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.CHART(symbol, '3y'));
    return response.data;
};

export const getInternationalLatestPrice = async (stockId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.YAHOO_LATEST_BY_ID(stockId));
    return response.data;
};

export const getInternationalIntradayHistory = async (stockId, range = "1d") => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.YAHOO_HISTORY_BY_ID(stockId), {
        params: { range }
    });
    return response.data;
};

export const getInternationalChartData = async (stockId, range = "1M") => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.PRICES.YAHOO_CHART_BY_ID(stockId), {
        params: { range }
    });
    return response.data;
};
