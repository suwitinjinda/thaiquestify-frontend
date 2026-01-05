// App.js - เพิ่ม ProfileScreen และแก้ไข Navigation
import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Import screens
import LandingPage from './src/screens/LandingPage';
import LoginScreen from './src/screens/LoginScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import QuestScreen from './src/screens/QuestScreen';
import WalletScreen from './src/screens/WalletScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen'; // ⬅️ เพิ่มนี้!
import WebCallbackScreen from './src/screens/WebCallbackScreen';

import DailyQuestsScreen from './src/screens/v2/DailyQuestsScreen';
import StreakStatsScreen from './src/screens/v2/StreakStatsScreen';

// ⬇️ เพิ่ม Social Quests Screens ใหม่
import CreateSocialQuestScreen from './src/screens/v2/CreateSocialQuestScreen';
import SocialQuestsScreen from './src/screens/v2/SocialQuestsScreen';
import SocialQuestDetailScreen from './src/screens/v2/SocialQuestDetailScreen';
import MySocialQuestsScreen from './src/screens/v2/MySocialQuestsScreen';


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
          } else if (route.name === 'ProfileTab') { // ⬅️ เพิ่ม ProfileTab
            iconName = 'person';
          } else if (route.name === 'DailyQuestsTab') { // ⬅️ เพิ่มใหม่
            iconName = 'emoji-events';
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

      {/* ⬅️ เพิ่ม Profile Tab */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'โปรไฟล์',
        }}
      />

      {/* ⬅️ เพิ่ม Daily Quests Tab */}
      <Tab.Screen
        name="DailyQuestsTab"
        component={DailyQuestsScreen}
        options={{
          tabBarLabel: 'Daily Quests',
        }}
      ></Tab.Screen>

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
      {/* Always show MainTabs first */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Login screen */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: 'เข้าสู่ระบบ',
          headerShown: true
        }}
      />

      {/* Daily Quests screen */}
      <Stack.Screen
        name="DailyQuests"
        component={DailyQuestsScreen}
        options={{
          title: 'เควสรายวัน',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#FF6B35',
          },
        }}
      />

      {/* Streak Stats screen */}
      <Stack.Screen
        name="StreakStats"
        component={StreakStatsScreen}
        options={{
          title: 'สถิติ Streak',
          headerShown: true,
        }}
      />

      {/* ⬇️ เพิ่ม Social Quests Screins ใหม่ */}

      {/* Create Social Quest */}
      <Stack.Screen
        name="CreateSocialQuest"
        component={CreateSocialQuestScreen}
        options={{
          title: 'สร้างเควสชุมชน',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#8A2BE2', // สีม่วงสำหรับ Social Quests
          },
        }}
      />

      {/* Social Quests List */}
      <Stack.Screen
        name="SocialQuests"
        component={SocialQuestsScreen}
        options={{
          title: 'เควสจากชุมชน',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#8A2BE2',
          },
        }}
      />

      {/* Social Quest Detail */}
      <Stack.Screen
        name="SocialQuestDetail"
        component={SocialQuestDetailScreen}
        options={{
          title: 'รายละเอียดเควส',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#8A2BE2',
          },
        }}
      />

      {/* My Social Quests */}
      <Stack.Screen
        name="MySocialQuests"
        component={MySocialQuestsScreen}
        options={{
          title: 'เควสที่ฉันสร้าง',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#8A2BE2',
          },
        }}
      />

      {/* Profile screen */}
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'โปรไฟล์ของฉัน',
          headerShown: true
        }}
      />

      {/* WebCallback screen */}
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

  // App.js - แก้ไข handleDeepLink
  useEffect(() => {
    console.log('🔗 Setting up deep link listeners...');

    // ใน App.js - แก้ไข handleDeepLink ให้ไม่ต้อง navigate ไป ProfileTab
    const handleDeepLink = async (event) => {
      const { url } = event;
      console.log('🔗 Deep link received:', url);

      if (url) {
        // 🔥 ตรวจสอบว่าเป็น Facebook profile connection หรือไม่
        if (url.includes('state=profile_')) {
          console.log('🎯 Facebook PROFILE connection detected!');
          console.log('🔄 ProfileScreen will handle this via its own listener');

          // ไม่ต้องทำอะไร - ให้ ProfileScreen จัดการเองผ่าน deep link listener
          return;
        }

        // 🔥 ถ้าเป็น Facebook OAuth ปกติสำหรับ login
        if (url.includes('expo-auth-session') ||
          url.includes('auth.expo.io') ||
          url.includes('code=') ||
          url.includes('facebook')) {

          console.log('✅ Facebook LOGIN callback detected!');

          await AsyncStorage.setItem('facebook_callback_url', url);

          setTimeout(() => {
            if (navigationRef.current) {
              console.log('🔄 Navigating to WebCallback screen');
              navigationRef.current.navigate('WebCallback', { url });
            }
          }, 1000);
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then(url => {
      if (url) {
        console.log('📱 App launched with URL:', url);
        handleDeepLink({ url });
      }
    }).catch(err => {
      console.error('Error getting initial URL:', err);
    });

    return () => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
    };
  }, []);

  // ใน App.js - แก้ไข linking config
  const linking = {
    prefixes: [
      'thaiquestify://',
      'https://auth.expo.io/@anonymous/thaiquestify',
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
        // 🔥 เพิ่ม path สำหรับ profile connection
        Profile: {
          path: 'auth/facebook-profile',
          parse: {
            url: (url) => url,
          },
        },
        Login: 'login',
        MainTabs: {
          screens: {
            HomeTab: 'home',
            ExploreTab: 'explore',
            // DashboardTab: 'dashboard',
            QuestTab: 'quests',
            WalletTab: 'wallet',
            // ProfileTab: {
            //   path: 'profile',
            //   screens: {
            //     // 🔥 เพิ่ม path สำหรับ profile connection ใน tab
            //     facebookProfile: 'auth/facebook-profile',
            //   }
          },
        },
      },
    },
  }


  return (
    <AuthProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={() => console.log('✅ Navigation is ready')}
      >
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}