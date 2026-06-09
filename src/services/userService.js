import axiosInstance from "../api/axios";
import { API_ENDPOINTS } from '../utils/constants/endpoints';

export const updateProfile = async (payload) => {
  const res = await axiosInstance.put(API_ENDPOINTS.USER.ME, payload);
  return res.data;
};
