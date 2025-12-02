import { api, getErrorMessage, getFieldErrors } from '../utils/api';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
    is_active: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user?: User;
}

export interface RegisterResponse {
    user: User;
    details: string;
}

class AuthService {
    /**
     * Register a new user
     */
    async register(data: RegisterData): Promise<RegisterResponse> {
        try {
            const response = await api.post<RegisterResponse & { access?: string; refresh?: string }>('/accounts/register/', data);
            // Store access token for Authorization header fallback
            if (response.data.access) {
                const { setAccessToken } = await import('../utils/api');
                setAccessToken(response.data.access);
            }
            return response.data;
        } catch (error) {
            const fieldErrors = getFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                throw fieldErrors;
            }
            throw new Error(getErrorMessage(error));
        }
    }

    /**
     * Login with email and password
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await api.post<AuthResponse>('/accounts/login/', credentials);
            // Store access token for Authorization header fallback
            if (response.data.access) {
                const { setAccessToken } = await import('../utils/api');
                setAccessToken(response.data.access);
            }
            return response.data;
        } catch (error) {
            const fieldErrors = getFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                throw fieldErrors;
            }
            throw new Error(getErrorMessage(error));
        }
    }

    /**
     * Get current user profile
     */
    async getProfile(): Promise<User> {
        try {
            const response = await api.get<User>('/accounts/profile/');
            return response.data;
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(data: Partial<User>): Promise<User> {
        try {
            // Note: This endpoint might need to be created in the backend
            // For now, we'll use the profile endpoint if it supports PATCH
            const response = await api.patch<User>('/accounts/profile/', data);
            return response.data;
        } catch (error) {
            const fieldErrors = getFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                throw fieldErrors;
            }
            throw new Error(getErrorMessage(error));
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(): Promise<{ access: string }> {
        try {
            const response = await api.post<{ access: string }>('/accounts/token/refresh/', {});
            // Store the new access token
            if (response.data.access) {
                const { setAccessToken } = await import('../utils/api');
                setAccessToken(response.data.access);
            }
            return response.data;
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    /**
     * Logout (clear tokens)
     * Note: Backend should handle token blacklisting if implemented
     */
    async logout(): Promise<void> {
        try {
            // Clear stored token
            const { setAccessToken } = await import('../utils/api');
            setAccessToken(null);
            // If backend has a logout endpoint, call it here
            // For now, we'll just clear local state
            // The backend sets cookies, so they'll be cleared on logout
        } catch (error) {
            // Even if logout fails, we should still clear local state
            console.error('Logout error:', error);
        }
    }

    /**
     * Change user password
     */
    async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
        try {
            const response = await api.post<{ message: string }>('/accounts/change-password/', data);
            return response.data;
        } catch (error) {
            const fieldErrors = getFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                throw fieldErrors;
            }
            throw new Error(getErrorMessage(error));
        }
    }

    /**
     * Request password reset
     */
    async requestPasswordReset(email: string): Promise<{ message: string }> {
        try {
            const response = await api.post<{ message: string }>('/accounts/password-reset/', { email });
            return response.data;
        } catch (error) {
            const fieldErrors = getFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                throw fieldErrors;
            }
            throw new Error(getErrorMessage(error));
        }
    }

    /**
     * Confirm password reset
     */
    async confirmPasswordReset(data: { token: string; new_password: string }): Promise<{ message: string }> {
        try {
            const response = await api.post<{ message: string }>('/accounts/password-reset/confirm/', data);
            return response.data;
        } catch (error) {
            const fieldErrors = getFieldErrors(error);
            if (Object.keys(fieldErrors).length > 0) {
                throw fieldErrors;
            }
            throw new Error(getErrorMessage(error));
        }
    }

    /**
     * Check if user is authenticated by trying to get profile
     */
    async checkAuth(): Promise<boolean> {
        try {
            await this.getProfile();
            return true;
        } catch {
            return false;
        }
    }
}

export const authService = new AuthService();

