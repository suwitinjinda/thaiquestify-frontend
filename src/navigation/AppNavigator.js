// src/navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import PartnerDashboard from '../screens/PartnerDashboard';
import AdminQuestTemplates from '../screens/AdminQuestTemplates';
import ShopCreateQuest from '../screens/ShopCreateQuest';
import Profile from '../screens/Profile';
import ShopRegister from '../screens/ShopRegister';

const Stack = createStackNavigator();

function AppNavigator() {
  console.log('🔄 AppNavigator rendering - Available screens:');
  console.log('   - PartnerDashboard:', !!PartnerDashboard);
  console.log('   - ShopRegister:', !!ShopRegister);
  console.log('   - Profile:', !!Profile);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="PartnerDashboard">
        
        {/* PARTNER SCREENS - Make sure these are at the top */}
        <Stack.Screen 
          name="PartnerDashboard" 
          component={PartnerDashboard}
          options={{ 
            title: 'Partner Dashboard',
            headerShown: true,
            headerStyle: { backgroundColor: '#4a6baf' },
            headerTintColor: '#fff',
          }}
        />
        
        <Stack.Screen 
          name="ShopRegister" 
          component={ShopRegister}
          options={{ 
            title: 'Register New Shop',
            headerStyle: { backgroundColor: '#4a6baf' },
            headerTintColor: '#fff',
          }}
        />

        <Stack.Screen 
          name="Profile" 
          component={Profile}
          options={{ 
            title: 'Profile',
            headerStyle: { backgroundColor: '#4a6baf' },
            headerTintColor: '#fff',
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