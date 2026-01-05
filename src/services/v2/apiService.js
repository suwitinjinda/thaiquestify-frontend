// src/services/v2/apiService.js
import axios from 'axios';
import API_V2_CONFIG from '../../config/api-v2';
import { getAuthToken } from '../../services/authService';

// Create axios instance for v2 API
const apiV2 = axios.create({
    baseURL: API_V2_CONFIG.baseURL,
    headers: API_V2_CONFIG.headers,
    timeout: 30000
});

// Request interceptor to add auth token
apiV2.interceptors.request.use(
    async (config) => {
        try {
            const token = await getAuthToken();
            console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log(`🔑 Token added (length: ${token.length})`);
            } else {
                console.warn('⚠️ No auth token found');
            }
        } catch (error) {
            console.warn('Error getting auth token:', error.message);
        }

        return config;
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - แก้ไขให้ handle undefined/null response
apiV2.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config?.url}`);

        // ตรวจสอบว่า response.data มีค่าหรือไม่
        if (response.data === undefined || response.data === null) {
            console.error('❌ ERROR: response.data is undefined/null');

            // สร้าง fallback response structure
            const fallbackResponse = {
                success: false,
                error: 'API returned empty response',
                data: [],
                message: 'No data received from server',
                timestamp: new Date().toISOString()
            };

            console.log('📦 Using fallback response:', fallbackResponse);
            return fallbackResponse;
        }

        // ตรวจสอบว่า response.data มี property success หรือไม่
        if (response.data.success === undefined) {
            console.log('⚠️ response.data does not have success property');
            // Wrap in standard response format
            return {
                success: true,
                data: response.data,
                message: 'Request successful',
                timestamp: new Date().toISOString()
            };
        }

        console.log('📦 Response data structure:', {
            hasSuccess: response.data.success !== undefined,
            hasData: response.data.data !== undefined,
            dataType: typeof response.data.data,
            isArray: Array.isArray(response.data.data)
        });

        return response.data;
    },
    (error) => {
        console.error('❌ API Error Details:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            message: error.message,
            code: error.code,
            isNetworkError: !error.response,
            isTimeout: error.code === 'ECONNABORTED'
        });

        if (error.response) {
            console.error('📋 Error response data:', error.response.data);
        }

        if (error.code === 'ECONNABORTED') {
            error.message = 'Request timeout. Please check your internet connection.';
        } else if (!error.response) {
            error.message = 'Network error. Please check if server is running.';
        }

        // สร้าง structured error response
        const errorResponse = {
            success: false,
            error: error.message,
            status: error.response?.status || 0,
            data: null,
            message: 'API request failed'
        };

        return Promise.reject(errorResponse);
    }
);

// Utility function for safe API calls
export const safeApiCall = async (apiFunction, fallbackData = null) => {
    try {
        console.log('🛡️ Safe API call started');
        const result = await apiFunction();
        console.log('🛡️ Safe API call completed:', {
            success: result?.success,
            dataLength: result?.data?.length || 0
        });
        return result;
    } catch (error) {
        console.error('🛡️ Safe API call failed:', error);

        // Return fallback data
        return {
            success: false,
            error: error.message || 'API call failed',
            data: fallbackData,
            message: 'Using fallback data',
            isFallback: true
        };
    }
};

// Daily Quests API methods with fallback
export const dailyQuestsAPI = {
    getTodayQuests: async () => {
        try {
            console.log('🎯 Calling dailyQuestsAPI.getTodayQuests()');
            const result = await apiV2.get(API_V2_CONFIG.endpoints.dailyQuests.today);

            // Validate response structure
            if (!result || typeof result !== 'object') {
                throw new Error('Invalid API response format');
            }

            console.log('✅ dailyQuestsAPI.getTodayQuests() result:', {
                success: result.success,
                dataLength: result.data?.length || 0
            });

            return result;
        } catch (error) {
            console.error('❌ dailyQuestsAPI.getTodayQuests() error:', error);

            // Fallback mock data
            const mockQuests = {
                success: true,
                data: [
                    {
                        _id: 'fallback_1',
                        name: 'เช็คอินรายวัน',
                        description: 'เข้าใช้แอปทุกวันรับคะแนนพิเศษ',
                        points: 20,
                        icon: 'check_circle',
                        requirements: 'เข้าสู่ระบบในแอป',
                        isCompleted: false,
                        isAvailable: true,
                        progress: 'pending'
                    },
                    {
                        _id: 'fallback_2',
                        name: 'ทำเควสสำเร็จ',
                        description: 'ทำเควสให้สำเร็จ 1 เควส',
                        points: 30,
                        icon: 'task_alt',
                        requirements: 'ทำเควสใดๆ ให้สำเร็จ',
                        isCompleted: false,
                        isAvailable: true,
                        progress: 'pending'
                    }
                ],
                summary: {
                    total: 2,
                    completed: 0,
                    available: 2
                },
                isFallback: true,
                message: 'Using fallback data due to API error'
            };

            return mockQuests;
        }
    },

    // ใช้ safeApiCall wrapper
    getTodayQuestsSafe: () => safeApiCall(
        () => dailyQuestsAPI.getTodayQuests(),
        {
            success: true,
            data: [],
            summary: { total: 0, completed: 0, available: 0 },
            isFallback: true
        }
    ),

    completeQuest: async (questId) => {
        try {
            console.log('🎯 Completing quest:', questId);
            const result = await apiV2.post(API_V2_CONFIG.endpoints.dailyQuests.complete(questId));
            console.log('✅ Quest completed:', result);
            return result;
        } catch (error) {
            console.error('❌ Failed to complete quest:', error);
            throw error;
        }
    }
};

// Streak API methods with fallback
export const streakAPI = {
    getStats: async () => {
        try {
            console.log('🎯 Calling streakAPI.getStats()');
            const result = await apiV2.get(API_V2_CONFIG.endpoints.streak.stats);
            console.log('✅ streakAPI.getStats() result:', result);
            return result;
        } catch (error) {
            console.error('❌ streakAPI.getStats() error:', error);

            // Fallback mock stats
            return {
                success: true,
                data: {
                    currentStreak: 0,
                    dailyCompleted: 0,
                    longestStreak: 0,
                    multiplier: 1.0,
                    nextReset: {
                        hours: 24,
                        minutes: 0,
                        time: '24 ชั่วโมง',
                        timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                    },
                    totalPoints: 0
                },
                isFallback: true
            };
        }
    },

    getStatsSafe: () => safeApiCall(
        () => streakAPI.getStats(),
        {
            success: true,
            data: {
                currentStreak: 0,
                dailyCompleted: 0,
                longestStreak: 0,
                multiplier: 1.0,
                nextReset: { hours: 24, minutes: 0, time: '24 ชั่วโมง' },
                totalPoints: 0
            },
            isFallback: true
        }
    )
};

export default apiV2;