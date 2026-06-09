
import axiosInstance from '../api/axios';
import { API_ENDPOINTS } from '../utils/constants/endpoints';

// AuthService

// login function
export const login = async (data) => {
    const response = await axiosInstance.post('/auth/login', data);
    return response.data;
};

// register function
export const register = async (data) => {
    const response = await axiosInstance.post(API_ENDPOINTS.USER.CREATE, data);
    return response.data;
};
