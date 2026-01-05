// src/context/AuthContext.js - COMPLETE VERSION
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); // เพิ่ม state สำหรับ token
  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลผู้ใช้จาก AsyncStorage เมื่อแอปเริ่ม
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // ใน AuthContext.js - แก้ไข loadUserFromStorage
  const loadUserFromStorage = async () => {
    try {
      console.log('🔄 AuthContext: Loading user from storage...');

      // ใช้ Promise.race เพื่อไม่ให้โหลดนานเกินไป
      const loadPromise = (async () => {
        const [token, userDataStr] = await Promise.all([
          AsyncStorage.getItem('authToken'),
          AsyncStorage.getItem('userData')
        ]);

        console.log('🔍 Token exists:', !!token);
        console.log('🔍 UserData exists:', !!userDataStr);

        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr);
          console.log('✅ AuthContext: User loaded:', userData.name);
          console.log('🔑 Token length:', token?.length || 0);
          setUser(userData);
          setToken(token); // เก็บ token ใน state
        } else {
          console.log('ℹ️ AuthContext: No user data in storage');
          setUser(null);
          setToken(null);
        }
      })();

      // ตั้ง timeout ที่ 2 วินาที
      await Promise.race([
        loadPromise,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

    } catch (error) {
      console.error('❌ AuthContext: Error loading user:', error);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
      console.log('✅ AuthContext: Loading complete');
    }
  };

  // ฟังก์ชัน signIn สำหรับ LoginScreen ใช้ - แก้ไขให้เก็บ token
  const signIn = async (userData, authToken) => {
    try {
      console.log('🔐 AuthContext: Signing in with token...');
      console.log('📦 User data:', userData?.name);
      console.log('🔑 Token length:', authToken?.length || 0);

      // บันทึกข้อมูล
      await Promise.all([
        AsyncStorage.setItem('authToken', authToken),
        AsyncStorage.setItem('userData', JSON.stringify(userData))
      ]);

      // อัพเดท state
      setUser(userData);
      setToken(authToken); // เก็บ token ใน state

      console.log('✅ AuthContext: User signed in with token');
      return true;
    } catch (error) {
      console.error('❌ AuthContext signIn error:', error);
      return false;
    }
  };

  // ฟังก์ชัน logout - แก้ไขให้ใช้ AsyncStorage ที่ import แล้ว
  const logout = async () => {
    try {
      // ลบข้อมูลทั้งหมด
      await AsyncStorage.multiRemove(['authToken', 'userData', 'loginMethod', 'facebookUserId', 'googleUserId']);

      // อัพเดท state
      setUser(null);
      setToken(null);

      console.log('✅ AuthContext: User signed out');
      return true;
    } catch (error) {
      console.error('❌ AuthContext signOut error:', error);
      return false;
    }
  };

  // ฟังก์ชันอัพเดทข้อมูลผู้ใช้
  const updateUser = async (updatedData) => {
    try {
      const newUserData = { ...user, ...updatedData };
      await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      setUser(newUserData);
      console.log('✅ AuthContext: User updated');
    } catch (error) {
      console.error('❌ AuthContext: Update user error:', error);
    }
  };

  // ตรวจสอบว่าล็อกอินอยู่หรือไม่
  const isAuthenticated = () => {
    return !!user && !!token;
  };

  // ฟังก์ชัน get token สำหรับใช้ใน API calls - เพิ่มใหม่
  const getToken = () => {
    console.log('🔑 Getting token from context:', token ? `Available (${token.length} chars)` : 'Not available');
    return token;
  };

  // ฟังก์ชัน debug - เพิ่มใหม่
  const debugAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('userData')
      ]);

      console.log('🔍 DEBUG AUTH STORAGE:');
      console.log('Token in storage:', storedToken ? `Yes (${storedToken.length} chars)` : 'No');
      console.log('User in storage:', storedUser ? 'Yes' : 'No');
      console.log('Token in context:', token ? `Yes (${token.length} chars)` : 'No');
      console.log('User in context:', user ? `Yes (${user.name})` : 'No');

      return {
        storedToken: storedToken?.substring(0, 50) + '...',
        storedUser: storedUser,
        contextToken: token?.substring(0, 50) + '...',
        contextUser: user
      };
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token, // เพิ่ม token ใน context value
      loading,
      setUser,
      signIn,
      logout,
      signOut: logout, // alias สำหรับ ProfileScreen
      updateUser,
      isAuthenticated,
      refreshUser: loadUserFromStorage,
      getToken, // เพิ่มฟังก์ชัน get token
      debugAuth, // เพิ่มฟังก์ชัน debug
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};