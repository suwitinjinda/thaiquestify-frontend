// src/services/userService.js
import api from './api';

export const userAPI = {
  // Get user profile by ID
  getUserProfile: async (userId) => {
    try {
      console.log('🔄 Fetching user profile for ID:', userId);
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  },

  // Get user's shops (for shop users)
  getUserShops: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/shops`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user shops:', error);
      throw error;
    }
  },

  // Get partner stats (for partner users)
  getPartnerStats: async (partnerId) => {
    try {
      const response = await api.get(`/partners/${partnerId}/stats`);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching partner stats:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}/profile`, userData);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }
};

export default userAPI;