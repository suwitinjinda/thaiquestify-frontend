// src/services/authService.js
import api from './api';

export const authAPI = {
  // Mock login
  mockLogin: async (email) => {
    try {
      console.log('🔄 Mock login for:', email);
      const response = await api.post('/auth/login', { email });
      console.log('✅ Mock login success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Mock login error:', error);
      throw error;
    }
  },

  // Quick login by user type
  quickLogin: async (userType) => {
    try {
      console.log('🚀 Quick login for:', userType);
      const response = await api.post('/auth/quick-login', { userType });
      console.log('✅ Quick login success:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Quick login error:', error);
      throw error;
    }
  },

  // Get all mock users
  getMockUsers: async () => {
    try {
      console.log('🔄 Fetching mock users...');
      const response = await api.get('/auth/mock-users');
      console.log('✅ Mock users fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching mock users:', error);
      throw error;
    }
  },

  // Verify token
  verifyToken: async () => {
    try {
      const response = await api.get('/auth/verify');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Google sign in
  googleSignIn: async (token) => {
    try {
      const response = await api.post('/auth/google', { token });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};