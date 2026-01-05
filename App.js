// App.js - WITH DEEP LINKING SUPPORT FOR EXISTING LOGINSCREEN
import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking'; // ADD THIS IMPORT

// Import screens
import LandingPage from './src/screens/LandingPage';
import LoginScreen from './src/screens/LoginScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import QuestScreen from './src/screens/QuestScreen';
import WalletScreen from './src/screens/WalletScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import WebCallbackScreen from './src/screens/WebCallbackScreen'; // IMPORT FOR DEEP LINKING

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function MainTabs() {
  const { user } = useAuth();

  const getDashboardScreen = () => {
    if (!user) return DashboardScreen;

    return DashboardScreen;
  };

  const DashboardComponent = getDashboardScreen();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = 'home';
          } else if (route.name === 'ExploreTab') {
            iconName = 'search';
          } else if (route.name === 'DashboardTab') {
            iconName = 'dashboard';
          } else if (route.name === 'QuestTab') {
            iconName = 'assignment';
          } else if (route.name === 'WalletTab') {
            iconName = 'account-balance-wallet';
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a6baf',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={LandingPage}
        options={{
          tabBarLabel: 'หน้าหลัก',
        }}
      />

      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        options={{
          tabBarLabel: 'ค้นหา',
        }}
      />
      <Tab.Screen
        name="DashboardTab"
        component={DashboardComponent}
        options={{
          tabBarLabel: 'แดชบอร์ด',
        }}
      />

      <Tab.Screen
        name="QuestTab"
        component={QuestScreen}
        options={{
          tabBarLabel: 'เควส',
        }}
      />
      <Tab.Screen
        name="WalletTab"
        component={WalletScreen}
        options={{
          tabBarLabel: 'กระเป๋า',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading, setUser, setLoading } = useAuth();

  // Check if user is logged in on app start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const userData = await AsyncStorage.getItem('userData');

        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  console.log('AppNavigator - User:', user ? 'Logged in' : 'Not logged in');
  console.log('AppNavigator - Loading:', loading);

  if (loading) {
    const { View, Text, ActivityIndicator } = require('react-native');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={{ marginTop: 10 }}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4a6baf',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {/* Always show MainTabs first (contains LandingPage as HomeTab) */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Login screen - accessible from LandingPage via navigation */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'เข้าสู่ระบบ',
          headerShown: true
        }}
      />

      {/* WebCallback screen for handling deep links from Facebook */}
      <Stack.Screen
        name="WebCallback"
        component={WebCallbackScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef();

  // 🔥 DEEP LINKING HANDLER - CRITICAL FOR FACEBOOK OAUTH
  useEffect(() => {
    console.log('🔗 Setting up deep link listeners...');

    const handleDeepLink = async (event) => {
      const { url } = event;
      console.log('🔗 Deep link received:', url);

      if (url) {
        // Check if this is a Facebook OAuth callback
        // Your LoginScreen uses expo-auth-session which creates URIs like:
        // exp://127.0.0.1:19000/--/expo-auth-session
        // https://auth.expo.io/@anonymous/thaiquestify
        if (url.includes('expo-auth-session') ||
          url.includes('auth.expo.io') ||
          url.includes('code=') ||
          url.includes('facebook')) {

          console.log('✅ Facebook OAuth callback detected!');

          // Save the URL for WebCallbackScreen to process
          await AsyncStorage.setItem('facebook_callback_url', url);

          // Wait a moment for navigation to be ready, then navigate
          setTimeout(() => {
            if (navigationRef.current) {
              console.log('🔄 Navigating to WebCallback screen with URL:', url);
              navigationRef.current.navigate('WebCallback', { url });
            } else {
              console.log('⚠️ Navigation ref not ready yet');
            }
          }, 1000);
        }
      }
    };

    // Listen for incoming deep links (app already open)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was launched from a deep link (app was closed)
    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('📱 App launched with URL:', url);
        handleDeepLink({ url });
      }
    }).catch(err => {
      console.error('Error getting initial URL:', err);
    });

    // Cleanup
    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  // 🔥 LINKING CONFIGURATION for NavigationContainer
  const linking = {
    prefixes: [
      'thaiquestify://',
      'https://thaiquestify.com',
      'https://auth.expo.io/@anonymous/thaiquestify', // ADD THIS
      'exp://',
    ],
    config: {
      screens: {
        WebCallback: {
          path: 'expo-auth-session',
          parse: {
            url: (url) => url,
          },
        },
        Login: 'login',
        MainTabs: {
          screens: {
            HomeTab: 'home',
            ExploreTab: 'explore',
            DashboardTab: 'dashboard',
            QuestTab: 'quests',
            WalletTab: 'wallet',
          },
        },
      },
    },
  };

  return (
    <AuthProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={linking} // ADD LINKING CONFIG
        onReady={() => console.log('✅ Navigation is ready')}
        onStateChange={(state) => console.log('🔄 Navigation state changed')}
      >
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}