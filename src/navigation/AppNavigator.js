import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import PartnerDashboard from '../screens/PartnerDashboard';
import AdminQuestTemplates from '../screens/AdminQuestTemplates';
import ShopCreateQuest from '../screens/ShopCreateQuest';
import Profile from '../screens/Profile';
import ShopRegister from '../screens/ShopRegister';
import LandingPage from '../screens/LandingPage'; // ต้องมีไฟล์นี้
import LoginScreen from '../screens/LoginScreen'; // ต้องมีไฟล์นี้
import ExploreScreen from '../screens/ExploreScreen'; // ต้องมีไฟล์นี้

// เพิ่ม import สำหรับหน้าจอใหม่
import DailyQuestsScreen from '../screens/v2/DailyQuestsScreen';
import StreakStatsScreen from '../screens/v2/StreakStatsScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  console.log('🔄 AppNavigator rendering - Available screens:');
  console.log('   - PartnerDashboard:', !!PartnerDashboard);
  console.log('   - ShopRegister:', !!ShopRegister);
  console.log('   - Profile:', !!Profile);
  console.log('   - DailyQuestsScreen:', !!DailyQuestsScreen);
  console.log('   - StreakStatsScreen:', !!StreakStatsScreen);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LandingPage"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4a6baf',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackTitleVisible: false,
        }}
      >

        {/* AUTH & LANDING SCREENS */}
        <Stack.Screen
          name="LandingPage"
          component={LandingPage}
          options={{
            title: 'ThaiQuestify',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            title: 'เข้าสู่ระบบ',
            headerShown: true,
          }}
        />

        {/* MAIN APP SCREENS */}
        <Stack.Screen
          name="ExploreTab"
          component={ExploreScreen}
          options={{
            title: 'สำรวจเควส',
            headerShown: true,
          }}
        />

        {/* STREAK & DAILY QUEST SCREENS (NEW) */}
        <Stack.Screen
          name="DailyQuests"
          component={DailyQuestsScreen}
          options={{
            title: 'เควสรายวัน',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="StreakStats"
          component={StreakStatsScreen}
          options={{
            title: 'สถิติ Streak',
            headerShown: true,
          }}
        />

        {/* PARTNER SCREENS */}
        <Stack.Screen
          name="PartnerDashboard"
          component={PartnerDashboard}
          options={{
            title: 'Partner Dashboard',
            headerShown: true,
          }}
        />

        <Stack.Screen
          name="ShopRegister"
          component={ShopRegister}
          options={{
            title: 'Register New Shop',
          }}
        />

        {/* PROFILE */}
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{
            title: 'Profile',
          }}
        />

        {/* ADMIN SCREENS */}
        <Stack.Screen
          name="AdminQuestTemplates"
          component={AdminQuestTemplates}
          options={{ title: 'Quest Templates' }}
        />

        <Stack.Screen
          name="ShopCreateQuest"
          component={ShopCreateQuest}
          options={{ title: 'Create Quest' }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;