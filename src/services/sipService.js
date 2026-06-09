import axiosInstance from '../api/axios';

const BASE_URL = '/api/sip';

export const createSip = async (sipData) => {
    const response = await axiosInstance.post(BASE_URL, sipData);
    return response.data;
};

export const updateSip = async (sipId, sipData) => {
    const response = await axiosInstance.put(`${BASE_URL}/${sipId}`, sipData);
    return response.data;
};

export const toggleSipStatus = async (sipId, status) => {
    const response = await axiosInstance.patch(`${BASE_URL}/${sipId}/status`, null, {
        params: { status }
    });
    return response.data;
};

export const getUserSips = async () => {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
};

export const getSipsByStock = async (stockId) => {
    const response = await axiosInstance.get(`${BASE_URL}/stock/${stockId}`);
    return response.data;
};

export const getSip = async (sipId) => {
    const response = await axiosInstance.get(`${BASE_URL}/${sipId}`);
    return response.data;
};

export const getSipHistory = async (page = 0, size = 10) => {
    const response = await axiosInstance.get(`${BASE_URL}/history`, {
        params: { page, size, sort: 'executionDate,desc' }
    });
    return response.data;
};
