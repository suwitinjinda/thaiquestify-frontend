import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: 'http://thaiquestify.com:5000/api/', // ✅ This should work now
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');

      if (token) {
        console.log('🔐 Adding token to request:', config.url);
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('⚠️ No token found for request:', config.url);
        // For demo purposes, we'll use a demo token
        const demoToken = 'demo-token-admin';
        config.headers.Authorization = `Bearer ${demoToken}`;
        console.log('🔄 Using demo token for development');
      }

      console.log('🚀 Making API request to:', config.url);
      return config;

    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response success:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Response error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - redirect to login');
      // You can trigger logout here if needed
    }

    return Promise.reject(error);
  }
);

export default api;