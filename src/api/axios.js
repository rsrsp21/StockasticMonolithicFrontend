import axios from 'axios';
import { store } from '../store/store';

// Create an axios instance with base URL and JSON headers
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Required for HttpOnly cookie authentication
});


// Request Interceptor -> attach token to headers
axiosInstance.interceptors.request.use(
    (config) => {
        const token = store.getState().auth.token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor -> handle 401 errors
// Queue to hold requests while refreshing token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Response interceptor -> handle 401 errors
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call backend to refresh token
                const response = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/auth/refreshtoken`,
                    {},
                    { withCredentials: true }
                );

                const { accessToken } = response.data;
                
                // Dynamically import actions
                const { setCredentials } = await import('../store/slices/authSlice');
                store.dispatch(setCredentials({ token: accessToken }));

                // Process queued requests with new token
                processQueue(null, accessToken);

                // Update authorization header for the original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                
                return axiosInstance(originalRequest);

            } catch (refreshError) {
                // Reject all queued requests
                processQueue(refreshError, null);

                // Refresh failed - logout user
                const { logout } = await import('../store/slices/authSlice');
                store.dispatch(logout());
                
                try {
                     await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {}, { withCredentials: true });
                } catch (e) { /* ignore */ }

                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
