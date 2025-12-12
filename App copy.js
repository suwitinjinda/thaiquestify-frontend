// App.js - WITH LANDING PAGE AS FIRST SCREEN
import * as Linking from 'expo-linking';
import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import Screens
import LoginScreen from './src/screens/LoginScreen';
import UserTypeSelectionScreen from './src/screens/UserTypeSelectionScreen';
import PartnerRegisterScreen from './src/screens/PartnerRegisterScreen';
import PartnerDashboard from './src/screens/PartnerDashboard';
import ShopRegisterScreen from './src/screens/ShopRegisterScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import AdminDashboard from './src/screens/AdminDashboard';
import ManageShops from './src/screens/ManageShops';
import LoadingScreen from './src/screens/LoadingScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ShopDashboard from './src/screens/ShopDashboard';
import AdminQuestTemplates from './src/screens/AdminQuestTemplates';
import ShopCreateQuest from './src/screens/ShopCreateQuest';
import QuestDetails from './src/screens/QuestDetails';
import LandingPage from './src/screens/LandingPage';
import RegionQuestsScreen from './src/screens/RegionQuestsScreen';
import ShopQuestsScreen from './src/screens/ShopQuestsScreen';
import UserQuestsScreen from './src/screens/UserQuestsScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import QuestScreen from './src/screens/QuestScreen';
import WalletScreen from './src/screens/WalletScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import CustomerRegisterScreen from './src/screens/CustomerRegisterScreen';
import WebCallbackScreen from './src/screens/WebCallbackScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function MainTabs() {
  const { user } = useAuth();

  const getDashboardScreen = () => {
    if (!user) return DashboardScreen;

    switch (user.userType) {
      case 'admin': return AdminDashboard;
      case 'partner': return PartnerDashboard;
      case 'shop': return ShopDashboard;
      case 'customer': return CustomerDashboard;
      default: return DashboardScreen;
    }
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
  const { user, loading } = useAuth();

  console.log('🔐 Current user:', user ? `${user.name} (${user.userType})` : 'Not logged in');

  if (loading) {
    return <LoadingScreen />;
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
      {/* OPTION 1: Show LandingPage as first screen for everyone */}
      {/* Uncomment this if you want LandingPage as the very first screen */}
      {/* 
      <Stack.Screen
        name="Landing"
        component={LandingPage}
        options={{ headerShown: false }}
      /> */}


      {/* OPTION 2: Show MainTabs (which includes LandingPage as HomeTab) */}
      {/* This is what you currently have - LandingPage is inside tabs */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />

      {/* Common Screens accessible to everyone */}
      <Stack.Screen
        name="RegionQuests"
        component={RegionQuestsScreen}
        options={({ route }) => ({
          title: `ภาค${route.params?.region || ''}`,
          headerShown: true
        })}
      />
      <Stack.Screen
        name="ShopQuests"
        component={ShopQuestsScreen}
        options={{ title: 'เควสร้านค้า' }}
      />
      <Stack.Screen
        name="UserQuests"
        component={UserQuestsScreen}
        options={{ title: 'เควสของฉัน' }}
      />
      <Stack.Screen
        name="QuestDetails"
        component={QuestDetails}
        options={{ title: 'รายละเอียดเควส' }}
      />
      <Stack.Screen
        name="WebCallback"
        component={WebCallbackScreen}
        options={{ headerShown: false }}
      />

      {!user ? (
        // Not logged in
        <Stack.Group>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              title: 'เข้าสู่ระบบ',
              headerShown: true
            }}
          />
          <Stack.Screen
            name="CustomerRegister"
            component={CustomerRegisterScreen}
            options={{ title: 'สมัครสมาชิก' }}
          />
          <Stack.Screen
            name="PartnerRegister"
            component={PartnerRegisterScreen}
            options={{ title: 'ลงทะเบียนพาร์ทเนอร์' }}
          />
        </Stack.Group>
      ) : user.userType === null ? (
        // Haven't selected user type
        <Stack.Screen
          name="UserTypeSelection"
          component={UserTypeSelectionScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // Logged in - Additional screens
        <Stack.Group>
          {/* Common Screens */}
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'โปรไฟล์' }}
          />
          <Stack.Screen
            name="ShopCreateQuest"
            component={ShopCreateQuest}
            options={{ title: 'สร้างเควสใหม่' }}
          />
          <Stack.Screen
            name="AdminQuestTemplates"
            component={AdminQuestTemplates}
            options={{ title: 'จัดการเทมเพลตเควส' }}
          />
          <Stack.Screen
            name="ManageShops"
            component={ManageShops}
            options={{ title: 'จัดการร้านค้า' }}
          />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const navigationRef = useRef();

  // Handle deep links
  useEffect(() => {
    console.log('🔗 Setting up deep link listeners...');

    const handleDeepLink = async (event) => {
      const { url } = event;
      console.log('🔗 Deep link received:', url);

      if (url) {
        // Save to AsyncStorage for WebCallbackScreen
        await AsyncStorage.setItem('facebook_callback', url);

        // Navigate to WebCallbackScreen
        setTimeout(() => {
          if (navigationRef.current) {
            navigationRef.current.navigate('WebCallback', { url });
          }
        }, 1000);
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

  return (
    <AuthProvider>
      <NavigationContainer
        ref={navigationRef}
      >
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}