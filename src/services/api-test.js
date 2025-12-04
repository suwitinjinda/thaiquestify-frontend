// src/services/api-test.js
import axios from 'axios';
import { CONFIG } from '../utils/config';

const API_BASE_URL = CONFIG.API_BASE_URL;

export const testAPI = async () => {
  try {
    console.log('🧪 Testing API Connection...');
    
    // Test 1: Health Check
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    
    // Test 2: Get Quests
    const questsResponse = await axios.get(`${API_BASE_URL}/quests`);
    console.log('✅ Quests Loaded:', questsResponse.data.length, 'quests');
    
    return {
      success: true,
      health: healthResponse.data,
      questsCount: questsResponse.data.length
    };
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};