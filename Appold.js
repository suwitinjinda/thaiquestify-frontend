// App.js - COMPLETE UPDATED VERSION
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';

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

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  console.log('🔐 Current user:', user ? `${user.name} (${user.userType})` : 'Not logged in');

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator>
      {/* ALWAYS START WITH LANDING PAGE - Default route */}
      <Stack.Screen 
        name="LandingPage" 
        component={LandingPage}
        options={{ headerShown: false }}
      />
      
      {!user ? (
        // ไม่ได้ล็อกอิน - สามารถเข้าถึง LandingPage ได้ตลอด
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
        // ยังไม่ได้เลือกประเภทผู้ใช้
        <Stack.Screen 
          name="UserTypeSelection" 
          component={UserTypeSelectionScreen}
          options={{ headerShown: false }}
        />
      ) : (
        // ล็อกอินสำเร็จ - สามารถเข้าถึง LandingPage ได้ตลอด + มีเมนูเฉพาะ
        <Stack.Group>
          {/* Admin Stack */}
          {user.userType === 'admin' && (
            <Stack.Group>
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminDashboard}
                options={{ title: 'แดชบอร์ดผู้ดูแลระบบ' }}
              />
              <Stack.Screen 
                name="AdminQuestTemplates" 
                component={AdminQuestTemplates}
                options={{ title: 'จัดการเทมเพลตเควส' }}
              />
              <Stack.Screen 
                name="ManageShops" 
                component={ManageShops}
                options={{ title: 'จัดการร้านค้าทั้งหมด' }}
              />
            </Stack.Group>
          )}
          
          {/* Partner Stack */}
          {user.userType === 'partner' && (
            <Stack.Group>
              <Stack.Screen 
                name="PartnerDashboard" 
                component={PartnerDashboard}
                options={{ title: 'แดชบอร์ดพาร์ทเนอร์' }}
              />
              <Stack.Screen 
                name="ShopRegister" 
                component={ShopRegisterScreen}
                options={{ title: 'ลงทะเบียนร้านค้าใหม่' }}
              />
              <Stack.Screen 
                name="ManageShops" 
                component={ManageShops}
                options={{ title: 'จัดการร้านค้าในเครือ' }}
              />
            </Stack.Group>
          )}
          
          {/* Shop Stack */}
          {user.userType === 'shop' && (
            <Stack.Group>
              <Stack.Screen 
                name="ShopDashboard" 
                component={ShopDashboard}
                options={{ title: 'แดชบอร์ดร้านค้า' }}
              />
              <Stack.Screen 
                name="ShopCreateQuest" 
                component={ShopCreateQuest}
                options={{ title: 'สร้างเควสใหม่' }}
              />
              <Stack.Screen
                name="QuestDetails"
                component={QuestDetails}
                options={{ title: 'รายละเอียดเควส' }}
              />
            </Stack.Group>
          )}
          
          {/* Customer Stack */}
          {user.userType === 'customer' && (
            <Stack.Group>
              <Stack.Screen 
                name="CustomerDashboard" 
                component={CustomerDashboard}
                options={{ title: 'แดชบอร์ดลูกค้า' }}
              />
            </Stack.Group>
          )}
          
          {/* Common Screens */}
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ title: 'โปรไฟล์' }}
          />
        </Stack.Group>
      )}
      
      {/* Common Screens ที่ทุกคนเข้าถึงได้ */}
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