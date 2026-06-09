import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axios";
import { API_ENDPOINTS } from "../utils/constants/endpoints";

import { useSelector } from "react-redux";

export function useKYCStatus() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["kycStatus"],
    queryFn: async () => {
      const res = await axiosInstance.get(API_ENDPOINTS.USER.KYC_STATUS);
      return res.data;
    },
    staleTime: 1000 * 60, // Cache for 1 minute (reduced from 5 minutes)
    retry: 1,
    enabled: isAuthenticated, // Only fetch if authenticated
  });

  const kycStatus = data?.kycStatus?.toUpperCase() || null;
  const attemptCount = data?.attemptCount || 0;
  const rejectionReason = data?.rejectionReason || null;

  const setKycStatus = async () => {
    // Force refetch of KYC status data
    await refetch();
  };

  return { kycStatus, setKycStatus, attemptCount, rejectionReason, isLoading, error };
}
