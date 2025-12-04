// App.js - UPDATED FOR REACT NAVIGATION v7
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
// import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialIcons } from '@expo/vector-icons';

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
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#4a6baf',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={LandingPage}
        options={{
          tabBarLabel: 'หน้าหลัก',
          tabBarIcon: ({ color, size }) => (
  <MaterialIcons name="home" size={size} color={color} />
),
        }}
      />
      
      <Tab.Screen 
        name="ExploreTab" 
        component={ExploreScreen}
        options={{
          tabBarLabel: 'ค้นหา',
          tabBarIcon: ({ color, size }) => (
  <MaterialIcons name="search" size={size} color={color} />
),
        }}
      />      
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardComponent}
        options={{
          tabBarLabel: 'แดชบอร์ด',
          tabBarIcon: ({ color, size }) => (
  <MaterialIcons name="dashboard" size={size} color={color} />
),
        }}
      />
      
      <Tab.Screen 
        name="QuestTab" 
        component={QuestScreen}
        options={{
          tabBarLabel: 'เควส',
          tabBarIcon: ({ color, size }) => (
  <MaterialIcons name="assignment" size={size} color={color} />
),
        }}
      />      
      <Tab.Screen 
        name="WalletTab" 
        component={WalletScreen}
        options={{
          tabBarLabel: 'กระเป๋า',         
          tabBarIcon: ({ color, size }) => (
  <MaterialIcons name="account-balance-wallet" size={size} color={color} />
),
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
      {/* Always show tabs for main navigation */}
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
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
        </Stack.Group>
      )}
      
      {/* Common Screens accessible to everyone */}
      <Stack.Group>
        <Stack.Screen 
          name="RegionQuests" 
          component={RegionQuestsScreen}
          options={({ route }) => ({ 
            title: `ภาค${route.params.region}`,
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
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}