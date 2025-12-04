// src/services/userService.js - UPDATED WITH PROFILE METHODS
import api from './api';

export const userAPI = {
  // ตรวจสอบอีเมลที่มีอยู่ - REMOVE /api PREFIX
  checkExistingEmail: async (email) => {
    try {
      console.log('🔄 Checking existing email:', email);
      
      // CORRECTED: ใช้ /users โดยไม่ต้องมี /api (เพราะมีใน baseURL แล้ว)
      const response = await api.get(`/users/check-email/${email}`);
      console.log('✅ Email check response:', response.data);
      
      return {
        success: true,
        exists: response.data.exists,
        user: response.data.user
      };
      
    } catch (error) {
      console.error('❌ Email check error:', error);
      
      let errorMessage = 'Failed to check email';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // อัพเดทบทบาทผู้ใช้ - REMOVE /api PREFIX
  updateUserRole: async (userId, userData) => {
    try {
      console.log('🔄 Updating user role:', userId, userData);
      
      // CORRECTED: ใช้ /users โดยไม่ต้องมี /api
      const response = await api.put(`/users/${userId}/role`, userData);
      console.log('✅ User role updated:', response.data);
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Update user role error:', error);
      
      let errorMessage = 'Failed to update user role';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // สร้างผู้ใช้ใหม่ - REMOVE /api PREFIX
  createUser: async (userData) => {
    try {
      console.log('🔄 Creating new user:', userData.email);
      
      // CORRECTED: ใช้ /users โดยไม่ต้องมี /api
      const response = await api.post('/users/register', userData);
      console.log('✅ User created:', response.data);
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Create user error:', error);
      
      let errorMessage = 'Failed to create user';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // ✅ NEW: Get user profile with detailed information
  getUserProfile: async (userId) => {
    try {
      console.log('🔄 Fetching user profile for:', userId);
      
      const response = await api.get(`/users/${userId}/profile`);
      console.log('✅ User profile response:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Get user profile error:', error);
      
      let errorMessage = 'Failed to fetch user profile';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // ✅ NEW: Get shops for shop owner
  getUserShops: async (userId) => {
    try {
      console.log('🔄 Fetching user shops for:', userId);
      
      const response = await api.get(`/users/${userId}/shops`);
      console.log('✅ User shops response:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Get user shops error:', error);
      
      let errorMessage = 'Failed to fetch user shops';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // ✅ NEW: Get partner statistics
  getPartnerStats: async (partnerId) => {
    try {
      console.log('🔄 Fetching partner stats for:', partnerId);
      
      const response = await api.get(`/partners/${partnerId}/stats`);
      console.log('✅ Partner stats response:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Get partner stats error:', error);
      
      let errorMessage = 'Failed to fetch partner statistics';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // ✅ NEW: Update user profile
  updateProfile: async (userId, profileData) => {
    try {
      console.log('🔄 Updating user profile for:', userId);
      
      const response = await api.put(`/users/${userId}/profile`, profileData);
      console.log('✅ Profile updated:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error) {
      console.error('❌ Update profile error:', error);
      
      let errorMessage = 'Failed to update profile';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },

  // ✅ NEW: Change user password
  changePassword: async (userId, passwordData) => {
    try {
      console.log('🔄 Changing password for user:', userId);
      
      const response = await api.put(`/users/${userId}/password`, passwordData);
      console.log('✅ Password changed successfully');
      
      return {
        success: true,
        data: response.data
      };
      
    } catch (error) {
      console.error('❌ Change password error:', error);
      
      let errorMessage = 'Failed to change password';
      
      if (error.response) {
        console.error('📡 Server response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        console.error('🌐 No response received - network error');
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        console.error('💥 Request setup error:', error.message);
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  }
};