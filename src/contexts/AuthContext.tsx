'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  bio: string;
  profilePicture: string;
  createdAt: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

interface SignupData {
  username: string;
  email: string;
  password: string;
  bio: string;
  profilePicture: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('🔍 Auth Context - Token from localStorage:', token ? 'Present' : 'Not found');
    
    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ Auth Context - Authorization header set');
      
      // Verify token on app load
      verifyToken();
    } else {
      console.log('❌ Auth Context - No token found, setting loading to false');
      setLoading(false);
    }

    // Add request interceptor to ensure token is always sent
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = localStorage.getItem('token');
        if (currentToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${currentToken}`;
          console.log('🔧 Auth Context - Added token to request:', config.url);
        }
        return config;
      },
      (error) => {
        console.error('❌ Auth Context - Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.log('❌ Auth Context - 401 received, logging out');
          handleLogout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup function
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const verifyToken = async () => {
    try {
      console.log('🔍 Auth Context - Verifying token...');
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      
      if (response.data.status === 'success') {
        console.log('✅ Auth Context - Token verified, user:', response.data.user.username);
        setUser(response.data.user);
      } else {
        console.log('❌ Auth Context - Token verification failed');
        handleLogout();
      }
    } catch (error: any) {
      console.error('❌ Auth Context - Token verification error:', error.response?.data?.message || error.message);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔍 Auth Context - Attempting login for:', email);
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data.status === 'success') {
        const { token, user: userData } = response.data;
        
        console.log('✅ Auth Context - Login successful, storing token');
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set user state
        setUser(userData);
        
        toast.success(`Welcome back, ${userData.username}! 🎉`);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Auth Context - Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<boolean> => {
    try {
      console.log('🔍 Auth Context - Attempting signup for:', userData.username);
      setLoading(true);
      
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData);

      if (response.data.status === 'success') {
        const { token, user: newUser } = response.data;
        
        console.log('✅ Auth Context - Signup successful, storing token');
        
        // Store token in localStorage
        localStorage.setItem('token', token);
        
        // Set default authorization header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set user state
        setUser(newUser);
        
        toast.success(`Welcome to SocialApp, ${newUser.username}! 🎉`);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Auth Context - Signup error:', error);
      const message = error.response?.data?.message || 'Signup failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('🔍 Auth Context - Logging out...');
    
    // Clear localStorage
    localStorage.removeItem('token');
    
    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear user state
    setUser(null);
    
    console.log('✅ Auth Context - Logout complete');
  };

  const logout = () => {
    handleLogout();
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};