import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiLogout, setAuthToken, clearAuthToken } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Session is memory-only to keep frontend state aligned with backend API calls.
    setIsLoading(false);
  }, []);

  // Called after a successful login or signup API response.
  const login = (userData, token) => {
    setAuthToken(token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore server errors and clear session regardless.
    }
    clearAuthToken();
    setUser(null);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
