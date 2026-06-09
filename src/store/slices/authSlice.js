import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axios";
import { API_ENDPOINTS } from "../../utils/constants/endpoints";

// Async Thunks
export const fetchUserProfile = createAsyncThunk(
    "auth/fetchUserProfile",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.USER.ME);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch profile");
        }
    }
);

export const fetchKYCStatus = createAsyncThunk(
    "auth/fetchKYCStatus",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(API_ENDPOINTS.USER.KYC_STATUS);
            return {
                kycStatus: response.data?.kycStatus?.toUpperCase() || null,
                attemptCount: response.data?.attemptCount || 0,
                rejectionReason: response.data?.rejectionReason || null
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to fetch KYC status");
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState: {
        token: null,
        // refreshToken removed - now handled by HttpOnly cookie
        role: null,
        isAuthenticated: false,
        user: null,
        kycStatus: null,
        kycDetails: {
            attemptCount: 0,
            rejectionReason: null
        },
        loading: false, // General loading state for profile/kyc
        error: null
    },
    reducers: {
        loginSuccess: (state, action) => {
            state.token = action.payload.token;
            // refreshToken is now handled by HttpOnly cookie, not stored in Redux
            state.role = action.payload.role;
            state.isAuthenticated = true;
            state.error = null;
        },
        setCredentials: (state, action) => {
            // Only handle access token - refreshToken is in HttpOnly cookie
            if (action.payload.token) state.token = action.payload.token;
        },
        logout: (state) => {
            state.token = null;
            // refreshToken cleared by backend via cookie expiration
            state.role = null;
            state.isAuthenticated = false;
            state.user = null;
            state.kycStatus = null;
            state.kycDetails = { attemptCount: 0, rejectionReason: null };
            state.error = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        updateUserProfile: (state, action) => {
            // Merge partial updates into user (e.g. profileImagePath after upload)
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch User Profile
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                // Set role from user profile (for after token refresh)
                if (action.payload.role) {
                    state.role = action.payload.role.startsWith('ROLE_') 
                        ? action.payload.role 
                        : `ROLE_${action.payload.role}`;
                    state.isAuthenticated = true;
                }
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                // Optional: If 401, logout might be handled by axios interceptor, 
                // but we can also handle state cleanup here if needed.
            })
            // Fetch KYC Status
            .addCase(fetchKYCStatus.pending, (state) => {
                // We typically don't set global loading true for KYC check unless it blocks UI
            })
            .addCase(fetchKYCStatus.fulfilled, (state, action) => {
                state.kycStatus = action.payload.kycStatus;
                state.kycDetails = {
                    attemptCount: action.payload.attemptCount,
                    rejectionReason: action.payload.rejectionReason
                };
            })
            .addCase(fetchKYCStatus.rejected, (state, action) => {
                // KYC fetch failure shouldn't necessarily break the app
                console.error("KYC Fetch Error:", action.payload);
            });
    },
});

export const { loginSuccess, logout, clearError, setCredentials, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
