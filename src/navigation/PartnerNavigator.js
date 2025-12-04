// src/navigation/PartnerNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PartnerDashboard from '../screens/PartnerDashboard';
import ShopRegister from '../screens/ShopRegister';
import Profile from '../screens/Profile';

const Stack = createStackNavigator();

const PartnerNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PartnerDashboard" 
        component={PartnerDashboard}
        options={{ headerShown: false }}
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
        options={{ title: 'Profile' }}
      />
    </Stack.Navigator>
  );
};

export default PartnerNavigator;