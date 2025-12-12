// utils/universalStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const universalStorage = {
    getItem: async (key) => {
        try {
            // บนเว็บ ให้ลองใช้ localStorage ก่อน
            if (typeof window !== 'undefined' && window.localStorage) {
                const value = localStorage.getItem(key);
                // console.log(`📱 [WEB] getItem ${key}:`, value?.substring(0, 50) + '...');
                return value;
            }
            // บนมือถือใช้ AsyncStorage
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error('❌ universalStorage.getItem error:', error);
            return null;
        }
    },

    setItem: async (key, value) => {
        try {
            // console.log(`📱 [UNIVERSAL] setItem ${key}:`, value?.substring(0, 50) + '...');

            // บนเว็บ
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.setItem(key, value);
            }
            // บนมือถือ
            await AsyncStorage.setItem(key, value);

            return true;
        } catch (error) {
            console.error('❌ universalStorage.setItem error:', error);
            return false;
        }
    },

    removeItem: async (key) => {
        try {
            // console.log(`📱 [UNIVERSAL] removeItem ${key}`);

            // บนเว็บ
            if (typeof window !== 'undefined' && window.localStorage) {
                localStorage.removeItem(key);
            }
            // บนมือถือ
            await AsyncStorage.removeItem(key);

            return true;
        } catch (error) {
            console.error('❌ universalStorage.removeItem error:', error);
            return false;
        }
    },

    multiRemove: async (keys) => {
        try {
            // console.log(`📱 [UNIVERSAL] multiRemove:`, keys);

            // บนเว็บ
            if (typeof window !== 'undefined' && window.localStorage) {
                keys.forEach(key => localStorage.removeItem(key));
            }
            // บนมือถือ
            await AsyncStorage.multiRemove(keys);

            return true;
        } catch (error) {
            console.error('❌ universalStorage.multiRemove error:', error);
            return false;
        }
    }
};

export default universalStorage;