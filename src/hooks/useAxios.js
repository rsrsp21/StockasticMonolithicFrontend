
import axiosInstance from "../api/axios";

// Custom hook to use axios instance with predefined methods for HTTP requests (It works both for public and private routes)
export const useAxios = () => {
    // Get request 
    const get = async (url, config = {}) => {
        return await axiosInstance.get(url, config);
    };

    // Post request
    const post = async (url, data, config = {}) => {
        return await axiosInstance.post(url, data, config);
    };

    // Put request
    const put = async (url, data, config = {}) => {
        return await axiosInstance.put(url, data, config);
    }

    // Delete request
    const del = async (url, config = {}) => {
        return await axiosInstance.delete(url, config);
    };

    return { get, post, put, delete: del };
}
