// src/services/questTemplateService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Real API service using fetch - NO MOCK DATA
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async getToken() {
    try {
      // Check for any available token
      const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
      console.log('🔑 Token check:', token ? 'Found' : 'No token');
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async request(endpoint, options = {}) {
    try {
      const token = await this.getToken();
      const url = `${this.baseURL}${endpoint}`;
      
      console.log(`🌐 API Call: ${url}`);
      console.log(`🔐 Token available: ${token ? 'Yes' : 'No'}`);
      
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No token available for API request');
      }

      const config = {
        ...options,
        headers,
      };

      console.log('📤 Request Config:', {
        url,
        method: config.method,
        headers: config.headers
      });

      const response = await fetch(url, config);
      
      console.log('📥 Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          url: url
        });
        
        let errorMessage;
        switch (response.status) {
          case 401:
            errorMessage = 'Authentication required. No valid token found.';
            break;
          case 403:
            errorMessage = 'Access denied. Admin privileges required.';
            break;
          case 404:
            errorMessage = `API endpoint not found: ${url}`;
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          default:
            errorMessage = `HTTP ${response.status}: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ API Success - Data received');
      return data;
    } catch (error) {
      console.error('🚨 API Request Failed:', {
        message: error.message,
        url: endpoint,
        baseURL: this.baseURL
      });
      throw error;
    }
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint) {
    return this.request(endpoint, { method: 'PATCH' });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Create instance
const api = new ApiService();

export const questTemplateAPI = {
  getAllTemplates: () => api.get('/quest-templates'),
  getTemplateById: (id) => api.get(`/quest-templates/${id}`),
  createTemplate: (data) => api.post('/quest-templates', data),
  updateTemplate: (id, data) => api.put(`/quest-templates/${id}`, data),
  toggleTemplateStatus: (id) => api.patch(`/quest-templates/${id}/toggle`),
  deleteTemplate: (id) => api.delete(`/quest-templates/${id}`),
};