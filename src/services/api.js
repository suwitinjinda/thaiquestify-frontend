// services/api.js - FINAL VERSION WITH EXTERNAL IP
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// ============================================
// 1. API CONFIGURATION
// ============================================

// Your backend server with external IP
const BACKEND_EXTERNAL_IP = '34.68.216.20';
const BACKEND_PORT = '5000';
const BACKEND_BASE_URL = `http://${BACKEND_EXTERNAL_IP}:${BACKEND_PORT}/api/`;

// Alternative: If you want to use HTTPS (recommended for production)
// const BACKEND_BASE_URL = `https://${BACKEND_EXTERNAL_IP}:${BACKEND_PORT}/api/`;
// OR use your domain if configured:
// const BACKEND_BASE_URL = 'https://thaiquestify.com/api/';

const getBaseURL = () => {
  // Always use external IP for now - it works for all devices
  console.log(`🌐 Using external backend: ${BACKEND_EXTERNAL_IP}`);
  return BACKEND_BASE_URL;
};

// ============================================
// 2. AXIOS INSTANCE
// ============================================

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Log configuration
console.log('🚀 API Service Initialized');
console.log('🌐 Backend URL:', api.defaults.baseURL);
console.log('📱 Platform:', Platform.OS);
console.log('🏗️ Environment:', __DEV__ ? 'Development' : 'Production');

// ============================================
// 3. REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  async (config) => {
    try {
      console.log(`📤 Request: ${config.method?.toUpperCase()} ${config.url}`);

      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No internet connection');
      }

      // Get authentication token
      const token = await AsyncStorage.getItem('authToken');

      if (token) {
        console.log('🔐 Using stored auth token');
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.log('⚠️ No auth token, using demo token');

        // IMPORTANT: Your backend must accept this demo token
        // If not, you'll get 401 errors
        const demoToken = 'demo-token-admin-development';
        config.headers.Authorization = `Bearer ${demoToken}`;
        config.headers['X-Demo-Mode'] = 'true';
      }

      return config;

    } catch (error) {
      console.error('❌ Request setup error:', error);

      if (error.message === 'No internet connection') {
        Alert.alert(
          'No Internet',
          'Please check your internet connection',
          [{ text: 'OK' }]
        );
      }

      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// ============================================
// 4. RESPONSE INTERCEPTOR
// ============================================

api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response ${response.status}: ${response.config.url}`);

    // Log successful data
    if (response.data) {
      console.log('📦 Response data:', {
        success: response.data.success,
        message: response.data.message,
        hasData: !!response.data.data
      });
    }

    return response;
  },
  async (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText
    });

    // Handle specific errors
    if (error.code === 'ECONNABORTED') {
      Alert.alert('Timeout', 'Request took too long. Please try again.');
    }

    if (error.message === 'Network Error') {
      console.error('🌐 Network Error - Possible issues:');
      console.log('1. Backend server may be down');
      console.log('2. Firewall may block port 5000');
      console.log('3. Incorrect IP address');

      Alert.alert(
        'Cannot Connect to Server',
        `Failed to connect to: ${BACKEND_EXTERNAL_IP}:${BACKEND_PORT}\n\nPlease check:\n• Server is running\n• Port 5000 is open\n• Correct IP address`,
        [{ text: 'OK' }]
      );
    }

    // Handle HTTP errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.log('🔐 Unauthorized - token may be invalid');
          // Clear invalid tokens
          await AsyncStorage.removeItem('authToken');
          Alert.alert('Session Expired', 'Please login again');
          break;

        case 403:
          Alert.alert('Access Denied', 'You do not have permission');
          break;

        case 404:
          console.log('🔍 Endpoint not found');
          break;

        case 500:
          Alert.alert('Server Error', 'Please try again later');
          break;
      }
    }

    return Promise.reject({
      success: false,
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// ============================================
// 5. HELPER FUNCTIONS
// ============================================

// Test backend connection
export const testBackendConnection = async () => {
  try {
    console.log(`🔍 Testing connection to ${BACKEND_EXTERNAL_IP}...`);

    // Test with a simple health check
    const response = await api.get('/health', { timeout: 10000 });

    console.log('✅ Backend is reachable!', response.data);
    return {
      success: true,
      message: 'Backend connected successfully',
      data: response.data
    };

  } catch (error) {
    console.error('❌ Cannot connect to backend:', error.message);

    // Try alternative test
    try {
      // Try direct fetch to verify server is up
      const testUrl = `http://${BACKEND_EXTERNAL_IP}:${BACKEND_PORT}/api/health`;
      console.log('🔄 Trying direct fetch to:', testUrl);

      const directResponse = await fetch(testUrl, { timeout: 5000 });
      const data = await directResponse.json();

      console.log('✅ Direct fetch successful:', data);
      return {
        success: true,
        message: 'Server is up but API may have issues',
        data: data
      };

    } catch (directError) {
      console.error('❌ Server appears to be down:', directError.message);

      return {
        success: false,
        message: `Cannot reach server at ${BACKEND_EXTERNAL_IP}:${BACKEND_PORT}`,
        error: error.message
      };
    }
  }
};

// Get current API config
export const getApiConfig = () => {
  return {
    externalIP: BACKEND_EXTERNAL_IP,
    port: BACKEND_PORT,
    baseURL: api.defaults.baseURL,
    timeout: api.defaults.timeout,
    platform: Platform.OS
  };
};

// ============================================
// 6. INITIALIZATION
// ============================================

// Auto-test connection on startup
if (__DEV__) {
  setTimeout(() => {
    console.log('🔧 Running initial connection test...');
    testBackendConnection().then(result => {
      if (result.success) {
        console.log('🎉 Backend connection established!');
      } else {
        console.warn('⚠️ Backend may not be accessible');
      }
    });
  }, 2000);
}

export default api;