import axiosInstance from '../api/axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';

/**
 * Stock Service - Handles all stock-related API calls
 */

const getParam = (val) => (val !== undefined && val !== null && val !== '') ? val : undefined;

// Get paginated stocks for admin (includes inactive)
// Uses unified search endpoint: /admin/stocks/search
export const getStocksPaged = async (page = 0, size = 10, sortBy = 'symbol', sortDir = 'asc', query = '', filters = {}) => {
    const { sector, exchange, minPrice, maxPrice, minVolume, maxVolume } = filters;
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.ADMIN_SEARCH, {
        params: {
            query: getParam(query),
            sector: getParam(sector),
            exchange: getParam(exchange),
            minPrice: getParam(minPrice),
            maxPrice: getParam(maxPrice),
            minVolume: getParam(minVolume),
            maxVolume: getParam(maxVolume),
            page, size, sortBy, sortDir
        }
    });
    return response.data;
};

// Get paginated active stocks for users (public)
// Uses unified search endpoint: /stocks/search
export const getPublicStocksPaged = async (page = 0, size = 10, sortBy = 'symbol', sortDir = 'asc', query = '', filters = {}, marketType = '') => {
    const { sector, exchange, minPrice, maxPrice, minVolume, maxVolume } = filters;
    const response = await axiosInstance.get(API_ENDPOINTS.STOCKS.SEARCH, {
        params: {
            query: getParam(query),
            sector: getParam(sector),
            exchange: getParam(exchange),
            marketType: getParam(marketType),
            minPrice: getParam(minPrice),
            maxPrice: getParam(maxPrice),
            minVolume: getParam(minVolume),
            maxVolume: getParam(maxVolume),
            page, size, sortBy, sortDir
        }
    });
    return response.data;
};

// Get stock by ID
export const getStockById = async (stockId) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.STOCKS.ADMIN}/${stockId}`);
    return response.data;
};

// Get stock by symbol
export const getStockBySymbol = async (symbol) => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.STOCKS.BY_SYMBOL}/${symbol}`);
    return response.data;
};

// Create stock with form-data
export const createStock = async (stockData, imageFile) => {
    const formData = new FormData();
    formData.append('symbol', stockData.symbol.toUpperCase());
    formData.append('name', stockData.name);
    formData.append('exchange', stockData.exchange);
    formData.append('sector', stockData.sector || '');
    formData.append('description', stockData.description || '');
    formData.append('isActive', stockData.isActive);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const response = await axiosInstance.post(API_ENDPOINTS.STOCKS.ADMIN, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// Update stock with form-data
export const updateStock = async (stockId, stockData, imageFile) => {
    const formData = new FormData();
    formData.append('symbol', stockData.symbol.toUpperCase());
    formData.append('name', stockData.name);
    formData.append('exchange', stockData.exchange);
    formData.append('sector', stockData.sector || '');
    formData.append('description', stockData.description || '');
    formData.append('isActive', stockData.isActive);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const response = await axiosInstance.put(`${API_ENDPOINTS.STOCKS.ADMIN}/${stockId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// Delete stock
export const deleteStock = async (stockId) => {
    await axiosInstance.delete(`${API_ENDPOINTS.STOCKS.ADMIN}/${stockId}`);
};

// Bulk upload stocks from CSV/Excel file with optional images ZIP
export const bulkUploadStocks = async (file, imagesZip = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (imagesZip) {
        formData.append('imagesZip', imagesZip);
    }

    const response = await axiosInstance.post(API_ENDPOINTS.STOCKS.BULK_UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
