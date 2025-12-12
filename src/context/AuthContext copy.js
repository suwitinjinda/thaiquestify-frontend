import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Create Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [realUsers, setRealUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      console.log('🔄 Checking authentication state...');

      const userData = await AsyncStorage.getItem('userData');
      const authToken = await AsyncStorage.getItem('authToken');

      console.log('📱 Storage check - UserData:', !!userData, 'Token:', !!authToken);

      if (userData && authToken) {
        // User is logged in - found in storage
        const parsedUser = JSON.parse(userData);
        console.log('✅ User found in storage:', parsedUser.email);

        // Set authorization header for API calls
        if (authToken && authToken !== 'undefined') {
          api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
        }

        setUser(parsedUser);
        console.log('✅ User authenticated successfully');

      } else {
        // No user data found - user is not logged in
        console.log('🔍 No user in storage - user needs to login');
        setUser(null);

        // Clear any partial/invalid data
        await AsyncStorage.multiRemove(['userData', 'authToken']);
        console.log('✅ Storage cleared - ready for fresh login');
      }

    } catch (error) {
      console.error('❌ Error checking auth state:', error);

      // On error, set user to null to force login
      console.log('⚠️ Auth check failed - forcing login');
      setUser(null);

      // Clear storage to prevent corrupted data
      try {
        await AsyncStorage.multiRemove(['userData', 'authToken']);
        console.log('✅ Storage cleared due to error');
      } catch (storageError) {
        console.error('❌ Error clearing storage:', storageError);
      }

    } finally {
      setLoading(false);
      console.log('🏁 Auth initialization complete - User:', user ? 'Logged in' : 'Not logged in');
    }
  };

  // Fetch real users from database
  const fetchRealUsers = async () => {
    try {
      setUsersLoading(true);
      console.log('🔄 Fetching real users from database...');

      // Call your backend API to get users
      const response = await api.get('/users/public/all');
      console.log('📊 Users API response:', response.data);

      if (response.data.success) {
        const users = response.data.data;
        console.log(`✅ Found ${users.length} real users`);

        // Transform user data to match your expected format
        const transformedUsers = users.map(user => ({
          _id: user._id?.$oid || user._id,
          name: user.name,
          email: user.email,
          userType: user.userType,
          phone: user.phone || '',
          isActive: user.isActive,
          isMockUser: user.isMockUser || false,
          createdAt: user.createdAt?.$date || user.createdAt,
          updatedAt: user.updatedAt?.$date || user.updatedAt
        }));

        setRealUsers(transformedUsers);
        return transformedUsers;
      } else {
        throw new Error('Failed to fetch users');
      }

    } catch (error) {
      console.error('❌ Error fetching real users:', error);

      // No fallback - return empty array
      setRealUsers([]);
      return [];

    } finally {
      setUsersLoading(false);
    }
  };

  // Auto-login with real user (one-click login)
  const signInWithRealUser = async (user) => {
    try {
      console.log('🚀 Auto-login with real user:', user.email);

      // Generate a simple token for the user
      const token = `user-token-${user._id}-${Date.now()}`;

      // Ensure user has required fields and proper _id format
      const userWithDefaults = {
        ...user,
        _id: user._id?.$oid || user._id, // Ensure proper _id format
        lastLogin: new Date().toISOString()
      };

      // Store user data and token
      await AsyncStorage.setItem('userData', JSON.stringify(userWithDefaults));
      await AsyncStorage.setItem('authToken', token);

      // Set authorization header for API calls
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Set user state
      setUser(userWithDefaults);

      console.log('✅ Auto-login successful');
      return { success: true, user: userWithDefaults };

    } catch (error) {
      console.error('❌ Auto-login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Quick login by user type
  const quickLoginByType = async (userType) => {
    try {
      console.log(`🚀 Quick login as: ${userType}`);

      // Make sure we have real users
      if (realUsers.length === 0) {
        await fetchRealUsers();
      }

      // Find first active user of this type
      const user = realUsers.find(u => u.userType === userType && u.isActive !== false);

      if (user) {
        return await signInWithRealUser(user);
      } else {
        throw new Error(`No active ${userType} user found`);
      }

    } catch (error) {
      console.error('❌ Quick login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Login function with email/password - REAL API CALL
  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email);
      setLoading(true);

      // Real API call to your backend
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (response.data.success) {
        const { user: userData, token } = response.data;

        // Transform user data to match expected format
        const transformedUser = {
          _id: userData._id?.$oid || userData._id,
          name: userData.name,
          email: userData.email,
          userType: userData.userType,
          phone: userData.phone || '',
          isActive: userData.isActive,
          isMockUser: userData.isMockUser || false,
          createdAt: userData.createdAt?.$date || userData.createdAt,
          updatedAt: userData.updatedAt?.$date || userData.updatedAt,
          lastLogin: new Date().toISOString()
        };

        // Save to storage
        await AsyncStorage.setItem('userData', JSON.stringify(transformedUser));
        await AsyncStorage.setItem('authToken', token);

        // Set authorization header for API calls
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update state
        setUser(transformedUser);

        console.log('✅ Login successful');
        return { success: true, user: transformedUser };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed. Please check your credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log('🚪 Starting sign out process...');
      setIsLoggingOut(true);

      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['userData', 'authToken']);
      console.log('✅ Storage cleared');

      // Clear authorization header
      delete api.defaults.headers.common['Authorization'];

      // Clear user state
      setUser(null);
      console.log('✅ User state cleared');

      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('✅ Sign out completed successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Sign out error:', error);

      // Force clear user state even if storage fails
      setUser(null);
      delete api.defaults.headers.common['Authorization'];

      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      console.log('📝 Updating user profile...');

      // Update storage
      await AsyncStorage.setItem('userData', JSON.stringify(userData));

      // Update state
      setUser(userData);

      console.log('✅ User profile updated');
      return { success: true };

    } catch (error) {
      console.error('❌ Update user error:', error);
      return { success: false, error: error.message };
    }
  };

  const simpleLogin = async (userId) => {
    try {
      console.log('🔐 Simple login for user:', userId);

      const response = await api.post('/auth/simple-login', { userId });

      if (response.data.success) {
        const { user: userData, token } = response.data;

        // Transform user data
        const transformedUser = {
          _id: userData._id?.$oid || userData._id,
          name: userData.name,
          email: userData.email,
          userType: userData.userType,
          phone: userData.phone || '',
          isActive: userData.isActive,
          isMockUser: userData.isMockUser || false,
          createdAt: userData.createdAt?.$date || userData.createdAt,
          updatedAt: userData.updatedAt?.$date || userData.updatedAt,
          lastLogin: new Date().toISOString()
        };

        // Store the user data and token
        await AsyncStorage.setItem('userData', JSON.stringify(transformedUser));
        await AsyncStorage.setItem('authToken', token);

        // Set authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        setUser(transformedUser);
        console.log('✅ Simple login successful');
        return { success: true, user: transformedUser };
      } else {
        throw new Error(response.data.message || 'Simple login failed');
      }
    } catch (error) {
      console.error('❌ Simple login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user is admin
  const isAdmin = () => {
    return user?.userType === 'admin';
  };

  // Refresh user data (e.g., after app comes from background)
  const refreshUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const authToken = await AsyncStorage.getItem('authToken');

      if (userData && authToken) {
        setUser(JSON.parse(userData));
        // Reset authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      }
    } catch (error) {
      console.error('❌ Refresh user error:', error);
    }
  };

  // Context value
  const value = {
    // State
    user,
    loading,
    isLoggingOut,
    realUsers,
    usersLoading,

    // Methods - Real Users
    fetchRealUsers,
    signInWithRealUser,
    quickLoginByType,
    simpleLogin,

    // Methods - Existing
    login,
    signOut,
    updateUser,
    isAuthenticated,
    isAdmin,
    refreshUser,

    // Aliases for compatibility
    logout: signOut,
    signInWithMock: signInWithRealUser,
    mockUsers: realUsers,
    refreshMockUsers: fetchRealUsers,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;