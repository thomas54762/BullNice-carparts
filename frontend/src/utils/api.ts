import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Store access token in memory (fallback if cookies don't work)
let accessToken: string | null = null;

// Helper to get token from storage
const getStoredToken = (): string | null => {
    if (accessToken) {
        return accessToken;
    }
    // Try to get from sessionStorage as fallback
    try {
        return sessionStorage.getItem('access_token');
    } catch {
        return null;
    }
};

// Helper to store token
export const setAccessToken = (token: string | null): void => {
    accessToken = token;
    if (token) {
        try {
            sessionStorage.setItem('access_token', token);
        } catch {
            // Ignore storage errors
        }
    } else {
        try {
            sessionStorage.removeItem('access_token');
        } catch {
            // Ignore storage errors
        }
    }
};

// Create axios instance
export const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Important for cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Add Authorization header as fallback (cookies should work, but this ensures compatibility)
        const token = getStoredToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor for token refresh and error handling
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip token refresh for certain endpoints
        const skipRefreshPaths = ['/accounts/login/', '/accounts/register/', '/accounts/token/refresh/'];
        const shouldSkipRefresh = originalRequest?.url && skipRefreshPaths.some(path => originalRequest.url?.includes(path));

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
            if (isRefreshing) {
                // If already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => {
                        // Retry the original request (cookies should be updated by now)
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Try to refresh the token
                const refreshResponse = await axios.post<{ access: string }>(
                    `${API_BASE_URL}/accounts/token/refresh/`,
                    {},
                    { withCredentials: true }
                );

                // Token refreshed successfully, cookies are updated by backend
                const { access } = refreshResponse.data;
                if (access) {
                    setAccessToken(access);
                }
                processQueue(null, null);
                isRefreshing = false;

                // Retry the original request (cookies should be updated now)
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError as AxiosError, null);
                isRefreshing = false;

                // Only redirect if we're not already on the login page
                if (window.location.pathname !== '/signin' && window.location.pathname !== '/signup') {
                    window.location.href = '/signin';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Helper function to extract error messages from API responses
export const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{
            detail?: string;
            message?: string;
            email?: string[];
            password?: string[];
            non_field_errors?: string[];
            [key: string]: unknown;
        }>;

        if (axiosError.response?.data) {
            const data = axiosError.response.data;

            // Handle field-specific errors
            if (data.email && Array.isArray(data.email)) {
                return data.email[0];
            }
            if (data.password && Array.isArray(data.password)) {
                return data.password[0];
            }
            if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
                return data.non_field_errors[0];
            }

            // Handle general error messages
            if (data.detail) {
                return data.detail;
            }
            if (data.message) {
                return data.message;
            }

            // Handle validation errors
            const errorMessages: string[] = [];
            Object.keys(data).forEach((key) => {
                const value = data[key];
                if (Array.isArray(value) && value.length > 0) {
                    errorMessages.push(`${key}: ${value[0]}`);
                } else if (typeof value === 'string') {
                    errorMessages.push(value);
                }
            });

            if (errorMessages.length > 0) {
                return errorMessages.join(', ');
            }
        }

        if (axiosError.message) {
            return axiosError.message;
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'An unexpected error occurred';
};

// Helper function to extract field-specific errors
export const getFieldErrors = (error: unknown): Record<string, string[]> => {
    const fieldErrors: Record<string, string[]> = {};

    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<Record<string, unknown>>;
        if (axiosError.response?.data) {
            const data = axiosError.response.data;
            Object.keys(data).forEach((key) => {
                const value = data[key];
                if (Array.isArray(value)) {
                    fieldErrors[key] = value.map((v) => String(v));
                } else if (typeof value === 'string') {
                    fieldErrors[key] = [value];
                }
            });
        }
    }

    return fieldErrors;
};

