import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, type LoginCredentials, type RegisterData, type User } from '../services/authService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Check authentication status on mount
    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const isAuth = await authService.checkAuth();
                if (isAuth && isMounted) {
                    const userData = await authService.getProfile();
                    if (isMounted) {
                        setUser(userData);
                    }
                } else if (isMounted) {
                    setUser(null);
                }
            } catch (error) {
                if (isMounted) {
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        checkAuth();

        return () => {
            isMounted = false;
        };
    }, []);

    const login = async (credentials: LoginCredentials) => {
        try {
            await authService.login(credentials);
            // Fetch user profile after successful login
            const userData = await authService.getProfile();
            setUser(userData);
            navigate('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const register = async (data: RegisterData) => {
        try {
            await authService.register(data);
            // Fetch user profile after successful registration
            const userData = await authService.getProfile();
            setUser(userData);
            navigate('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            navigate('/signin');
        }
    };

    const updateUser = (updatedUser: User) => {
        setUser(updatedUser);
    };

    const refreshUser = async () => {
        try {
            const userData = await authService.getProfile();
            setUser(userData);
        } catch (error) {
            console.error('Failed to refresh user:', error);
            // If refresh fails, user might be logged out
            setUser(null);
        }
    };

    const value: AuthContextType = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

