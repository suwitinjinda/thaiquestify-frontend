// src/config/api-v2.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_V2_CONFIG = {
  baseURL: 'https://thaiquestify.com/api/v2',

  endpoints: {
    streak: {
      stats: '/streak/stats',
      leaderboard: '/streak/leaderboard',
      initialize: '/streak/initialize'
    },
    dailyQuests: {
      today: '/daily-quests/today',
      complete: (questId) => `/daily-quests/${questId}/complete`,
      create: '/daily-quests/create'
    }
  },

  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// สร้าง axios instance
const apiV2 = axios.create({
  baseURL: API_V2_CONFIG.baseURL,
  timeout: 15000,
  headers: API_V2_CONFIG.headers
});

// Request interceptor
apiV2.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      console.log('🔐 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        token: token ? 'Available' : 'Missing'
      });

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiV2.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Helper functions สำหรับ API calls ที่รองรับ response หลายรูปแบบ
export const streakAPI = {
  getStats: () => apiV2.get(API_V2_CONFIG.endpoints.streak.stats),
  getLeaderboard: (limit = 10) =>
    apiV2.get(`${API_V2_CONFIG.endpoints.streak.leaderboard}?limit=${limit}`),
  initialize: () => apiV2.post(API_V2_CONFIG.endpoints.streak.initialize)
};

export const dailyQuestsAPI = {
  getTodayQuests: () => apiV2.get(API_V2_CONFIG.endpoints.dailyQuests.today),
  completeQuest: (questId) =>
    apiV2.post(API_V2_CONFIG.endpoints.dailyQuests.complete(questId)),
  createQuest: (questData) =>
    apiV2.post(API_V2_CONFIG.endpoints.dailyQuests.create, questData)
};

export default apiV2;