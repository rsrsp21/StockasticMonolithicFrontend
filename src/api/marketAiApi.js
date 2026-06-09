import api from './axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';

export const askMarketAi = async ({ query, symbol }) => {
    const response = await api.post(API_ENDPOINTS.MARKET_AI.QUERY, {
        query,
        ...(symbol ? { symbol } : {}),
    });

    return response.data;
};
