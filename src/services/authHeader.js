// src/services/authHeader.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAuthHeader = async () => {
    try {
        // 1. ลองดึง token จาก AsyncStorage โดยตรง
        let token = await AsyncStorage.getItem('authToken');

        if (!token) {
            console.warn('⚠️ No token found in AsyncStorage');

            // 2. ลองดึงจาก AuthContext ถ้ามี (สำหรับ component ที่ใช้ useAuth)
            try {
                const { getToken } = require('../context/AuthContext').useAuth || {};
                if (getToken) {
                    const contextToken = getToken();
                    token = contextToken;
                    console.log('🔑 Got token from AuthContext');
                }
            } catch (error) {
                console.log('AuthContext not available:', error.message);
            }
        }

        if (token) {
            console.log('✅ Token available for API call:', token.substring(0, 20) + '...');
            return {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };
        } else {
            console.error('❌ No token available for API');
            return {
                'Content-Type': 'application/json'
            };
        }
    } catch (error) {
        console.error('Error getting auth header:', error);
        return {
            'Content-Type': 'application/json'
        };
    }
};