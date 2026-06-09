import axiosInstance from '../api/axios';

/**
 * Admin Service - Handles admin-specific API calls
 */

// Get admin dashboard stats
export const getDashboardStats = async () => {
    const response = await axiosInstance.get('/admin/stats');
    return response.data;
};
