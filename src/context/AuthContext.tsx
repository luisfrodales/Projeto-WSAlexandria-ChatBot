import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '../types';
import { apiService } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  useEffect(() => {
    // Check for stored auth state on app load
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          token: storedToken,
        });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await apiService.login({ email, password });
      
      // Transform MongoDB user data to our User interface
      const user: User = {
        id: response.user._id,
        _id: response.user._id,
        username: response.user.username,
        name: `${response.user.firstName} ${response.user.lastName}`.trim(),
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: response.user.email,
        role: 'admin', // Default role for now
        isActive: response.user.isActive,
        lastLogin: response.user.lastLogin,
        createdAt: response.user.createdAt,
        updatedAt: response.user.updatedAt,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(response.user.firstName + ' ' + response.user.lastName)}&background=0D9488&color=fff`
      };
      
      // Store user data and token
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', response.token);
      
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        token: response.token,
      });
      
      console.log('✅ Login successful:', user.email);
      return true;
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });
  };

  const getAuthToken = (): string | null => {
    return localStorage.getItem('token');
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      getAuthToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};