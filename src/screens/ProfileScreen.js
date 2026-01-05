// ProfileScreen.js - VERSION WITH FIXED FACEBOOK PROFILE CONNECTION
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,  // ✅ Picker ถูกเอาออกแล้ว
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Switch,
  Share,
  Modal,
  Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// ✅ เพิ่ม import แยกสำหรับ Picker
import { Picker } from '@react-native-picker/picker';

// ✅ เพิ่ม import แยกสำหรับ Clipboard
// import Clipboard from '@react-native-clipboard/clipboard';

const ProfileScreen = ({ navigation, route }) => {
  const { user, signOut, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [copiedText, setCopiedText] = useState('');

  const [showQuestTypePicker, setShowQuestTypePicker] = useState(false);
  const [selectedQuestType, setSelectedQuestType] = useState('facebook_follow');

  // 🎯 Social Connections State
  const [socialConnections, setSocialConnections] = useState({
    facebook: {
      connected: false,
      profileUrl: null,
      name: null,
      profilePicture: null,
      friendCount: 0,
      lastSynced: null
    },
    tiktok: {
      connected: false,
      username: null,
      profileUrl: null,
      followerCount: 0
    },
    line: {
      connected: false,
      userId: null,
      displayName: null
    },
    instagram: {
      connected: false,
      username: null,
      profileUrl: null
    }
  });

  // 🎨 Themes & Colors
  const COLORS = {
    facebookBlue: '#1877F2',
    tiktokBlue: '#00F2EA',
    tiktokBlack: '#010101',
    instagram: '#E4405F',
    line: '#06C755',
    google: '#DB4437',
    primary: '#6C63FF',
    secondary: '#FF6B8B',
    success: '#32D74B',
    warning: '#FFD60A',
    dark: '#2D3047',
    light: '#F7F9FC',
  };

  // 🔥 เพิ่ม constant สำหรับ Facebook
  const FACEBOOK_APP_ID = '1479841916431052';
  const REDIRECT_URI = 'https://thaiquestify.com/auth/callback';
  const API_URL = 'https://thaiquestify.com/api';

  // 🔍 ตรวจสอบผู้ใช้
  const isFacebookUser = user?.facebookId || user?.signupMethod === 'facebook';
  const isGoogleUser = user?.googleId || user?.signupMethod === 'google';

  // 🔥 useRef สำหรับติดตาม browser state
  const browserOpenRef = useRef(false);

  // ==================== HELPER FUNCTIONS ====================

  // 🔥 ฟังก์ชันปิด WebBrowser
  const closeWebBrowser = async () => {
    try {
      await WebBrowser.dismissBrowser();
      console.log('✅ WebBrowser closed successfully');
      browserOpenRef.current = false;
      return true;
    } catch (error) {
      console.log('⚠️ WebBrowser already closed or error:', error);
      browserOpenRef.current = false;
      return false;
    }
  };

  // 🔥 ฟังก์ชันดึง parameters จาก URL
  const getUrlParams = (url) => {
    try {
      // ทำความสะอาด URL
      const cleanUrl = url.replace(/#_=_/g, '');

      // แยก query string
      const queryString = cleanUrl.includes('?')
        ? cleanUrl.split('?')[1]
        : '';

      const params = new URLSearchParams(queryString);
      const result = {};

      for (const [key, value] of params.entries()) {
        result[key] = value;
      }

      console.log('🔍 Parsed URL params:', result);
      return result;
    } catch (e) {
      console.error("Failed to parse URL:", e);
      return {};
    }
  };

  // ProfileScreen.js - เพิ่ม Create Quest Modal
  const [showCreateQuestModal, setShowCreateQuestModal] = useState(false);
  const [newQuest, setNewQuest] = useState({
    title: '',
    description: '',
    type: 'facebook_follow',
    platform: 'facebook',
    target: 10,
    reward: { points: 100, coins: 0 },
    settings: {
      isPublic: true,
      maxParticipants: 100,
      durationDays: 7,
      requireVerification: true
    }
  });

  // ฟังก์ชันสร้าง quest
  const createUserQuest = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/user-generated-quests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('authToken')}`
        },
        body: JSON.stringify(newQuest)
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'สร้างเควสสำเร็จ! 🎉',
          'เควสของคุณกำลังรอการอนุมัติและจะแสดงในหน้า Landing Page เร็วๆ นี้',
          [{ text: 'ตกลง' }]
        );
        setShowCreateQuestModal(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      Alert.alert('ข้อผิดพลาด', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== FACEBOOK PROFILE CONNECTION FUNCTIONS ====================

  // 🔥 เริ่มการเชื่อมต่อ Facebook จาก Profile
  const startFacebookProfileConnection = async () => {
    try {
      console.log('🔗 [DEBUG] Starting Facebook profile connection...');
      console.log('🔗 [DEBUG] Current connection status:', socialConnections.facebook.connected);
      console.log('🔗 [DEBUG] User has Facebook ID:', user?.facebookId);
      console.log('🔗 [DEBUG] Facebook data:', socialConnections.facebook);

      if (browserOpenRef.current) {
        console.log('⚠️ [DEBUG] Browser already open, closing first...');
        await closeWebBrowser();
      }

      console.log('🔗 Starting Facebook profile connection...');

      if (browserOpenRef.current) {
        console.log('⚠️ Browser already open, closing first...');
        await closeWebBrowser();
      }

      browserOpenRef.current = true;
      setLoading(true);

      // Facebook OAuth สำหรับ mobile app
      const SCOPES = ['public_profile', 'user_friends'].join(',');
      const state = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const authUrl =
        `https://www.facebook.com/v20.0/dialog/oauth` +
        `?client_id=${FACEBOOK_APP_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&state=${state}` +
        `&display=popup`;

      console.log('🌐 Opening Facebook OAuth...');
      console.log('🔗 Auth URL:', authUrl);

      // เปิด WebBrowser สำหรับ Facebook login
      await WebBrowser.openBrowserAsync(authUrl);

      // ตั้ง timer สำหรับกรณีที่ผู้ใช้ไม่ปิด browser
      setTimeout(async () => {
        if (browserOpenRef.current) {
          console.log('⏰ Browser timeout, auto-closing...');
          await closeWebBrowser();
          setLoading(false);
        }
      }, 120000); // 2 นาที

    } catch (error) {
      console.error('❌ [DEBUG] Error opening Facebook:', error);
      // เพิ่ม error logging เพิ่มเติม
      console.error('❌ [DEBUG] Error stack:', error.stack);
      console.error('❌ [DEBUG] Error message:', error.message);

      browserOpenRef.current = false;
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดหน้า Facebook ได้: ' + error.message);
      setLoading(false);
    }
  };

  // 🔥 ฟังก์ชันหลักสำหรับการเชื่อมต่อ Facebook จาก Profile
  const handleProfileFacebookConnection = async (code, state) => {
    try {
      setLoading(true);
      console.log('🔗 Processing Facebook profile connection...');

      // 1. Exchange code สำหรับ access token
      const response = await fetch(`${API_URL}/auth/facebook/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          redirect_uri: REDIRECT_URI,
          purpose: 'profile_connection'
        }),
      });

      const data = await response.json();
      console.log('✅ Exchange response:', data);

      if (!data.access_token) {
        throw new Error('No access token received');
      }

      // 2. ดึงข้อมูล Facebook (พร้อมข้อมูลเพื่อน)
      const facebookData = await fetchExtendedFacebookData(data.access_token);
      console.log('✅ Facebook data with friends:', facebookData);

      // 3. บันทึกข้อมูล
      await saveFacebookConnectionData(facebookData, data.access_token);

      // 4. อัพเดท state และแสดงผล
      updateSocialConnections(facebookData);

      // 5. ปิด browser
      await closeWebBrowser();

      // 6. แสดง alert สำเร็จ
      showSuccessAlert(facebookData);

    } catch (error) {
      console.error('❌ Facebook profile connection error:', error);

      // ปิด browser ถ้ามี error
      await closeWebBrowser();

      Alert.alert(
        'ข้อผิดพลาด',
        'ไม่สามารถเชื่อมต่อ Facebook ได้: ' + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ดึงข้อมูล Facebook แบบ extended
  const fetchExtendedFacebookData = async (accessToken) => {
    try {
      console.log('🔍 Fetching extended Facebook data...');

      // ใช้ fields ที่ทำงานได้
      const FACEBOOK_FIELDS = [
        'id',
        'name',
        'first_name',
        'last_name',
        'email',
        'picture.type(large){url}',
        'friends.limit(100){id,name,picture.type(small){url}}'   // 🔥 ลองแบบนี้
        // 'friends.summary(total_count)'  // 🔥 เพิ่ม summary
      ].join(',');

      const response = await fetch(
        `https://graph.facebook.com/v20.0/me?fields=${FACEBOOK_FIELDS}&access_token=${accessToken}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Facebook API error response:', errorText);
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(data)
      console.log('📦 Facebook API response:', {
        hasData: !!data,
        id: data.id,
        name: data.name,
        friendsCount: data.friends?.data?.length || 0
      });

      // คำนวณ totalFriends
      const totalFriends = data.friends?.data?.length || 0;

      return {
        facebookId: data.id,
        name: data.name,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || `fb_${data.id}@thaiquestify.com`,
        profilePicture: data.picture?.data?.url || null,
        friends: data.friends?.data || [],
        totalFriends: totalFriends,
        rawData: data
      };

    } catch (error) {
      console.error('❌ Error fetching extended Facebook data:', error);
      throw error;
    }
  };

  // 🔥 บันทึกข้อมูล Facebook connection
  const saveFacebookConnectionData = async (facebookData, accessToken) => {
    try {
      console.log('💾 Saving Facebook connection data...');

      // บันทึกข้อมูลพื้นฐาน
      await AsyncStorage.setItem('facebookProfileConnected', 'true');
      await AsyncStorage.setItem('facebookProfileData', JSON.stringify(facebookData));
      await AsyncStorage.setItem('facebookLastConnected', new Date().toISOString());

      // บันทึก access token (ถ้ามี)
      if (accessToken) {
        await AsyncStorage.setItem('facebookProfileToken', accessToken);
      }

      // บันทึกรายชื่อเพื่อน
      if (facebookData.friends && facebookData.friends.length > 0) {
        await saveFriendsList(facebookData.friends);
      }

      console.log('✅ Facebook connection data saved');

    } catch (error) {
      console.error('❌ Error saving Facebook data:', error);
      throw error;
    }
  };

  // 🔥 อัพเดท social connections state
  const updateSocialConnections = (facebookData) => {
    setSocialConnections(prev => ({
      ...prev,
      facebook: {
        connected: true,
        profileUrl: `https://facebook.com/${facebookData.facebookId}`,
        name: facebookData.name,
        profilePicture: facebookData.profilePicture,
        friendCount: facebookData.totalFriends,
        lastSynced: new Date().toISOString(),
        hasFriends: facebookData.totalFriends > 0
      }
    }));

    // บันทึกข้อมูลลง AsyncStorage
    AsyncStorage.setItem('socialConnections', JSON.stringify({
      ...socialConnections,
      facebook: {
        connected: true,
        profileUrl: `https://facebook.com/${facebookData.facebookId}`,
        name: facebookData.name,
        profilePicture: facebookData.profilePicture,
        friendCount: facebookData.totalFriends,
        lastSynced: new Date().toISOString()
      }
    })).then(() => {
      console.log('✅ Social connections saved to AsyncStorage');
    });
  };

  // 🔥 แสดง alert สำเร็จ
  const showSuccessAlert = (facebookData) => {
    const friendCount = facebookData.totalFriends || 0;

    Alert.alert(
      'เชื่อมต่อสำเร็จ! 🎉',
      friendCount > 0
        ? `เชื่อมต่อ Facebook สำเร็จ!\n\nพบเพื่อน ${friendCount} คนบน Facebook\n\nตอนนี้คุณสามารถชวนเพื่อนทำเควสร่วมกันได้แล้ว!`
        : 'เชื่อมต่อ Facebook สำเร็จ!\n\nคุณสามารถชวนเพื่อนมาเล่น ThaiQuestify ได้!',
      [
        {
          text: 'เยี่ยมมาก!',
          onPress: () => {
            if (facebookData.friends && facebookData.friends.length > 0) {
              showFriendSuggestions(facebookData.friends);
            }
          }
        },
        {
          text: 'ปิด',
          style: 'cancel'
        }
      ]
    );
  };

  // 🔥 Deep link handler สำหรับ Facebook callback จาก Profile
  const handleDeepLink = async (url) => {
    console.log('🔗 ProfileScreen received deep link:', url);

    // ตรวจสอบว่าเป็น Facebook callback สำหรับ profile
    if (url && url.includes('state=profile_')) {
      try {
        console.log('🎯 Facebook profile callback received in ProfileScreen');

        // ปิด WebBrowser ถ้ายังเปิดอยู่
        await closeWebBrowser();

        // แยก parameters
        const params = getUrlParams(url);
        const code = params.code;
        const state = params.state;

        if (code && state) {
          console.log('✅ Processing profile connection...');
          setLoading(true);
          await handleProfileFacebookConnection(code, state);
        }
      } catch (error) {
        console.error('Profile connection error:', error);
        setLoading(false);
      }
    }
  };

  // 🔥 ประมวลผล callback ที่เก็บไว้
  const processFacebookProfileCallback = async (url) => {
    try {
      setLoading(true);
      const params = getUrlParams(url);
      const code = params.code;
      const state = params.state;

      if (code && state && state.includes('profile_')) {
        console.log('✅ Processing stored profile connection');
        await handleProfileFacebookConnection(code, state);
      } else {
        console.error('❌ Invalid profile callback');
        setLoading(false);
      }
    } catch (error) {
      console.error('Profile callback error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ Facebook ได้');
      setLoading(false);
    }
  };

  // ==================== MAIN USE EFFECTS ====================

  // 📱 โหลดข้อมูล
  useEffect(() => {
    console.log('🔍 DEBUG: ProfileScreen user object:', user);

    if (!user) {
      console.log('⚠️ No user found, checking AsyncStorage...');
      checkLocalStorage();
      return;
    }

    // โหลดข้อมูล social connections
    loadSocialConnections();
  }, [user, navigation]);

  // 🔗 Deep link handler
  useEffect(() => {
    // ตรวจสอบว่าเป็น Facebook profile callback หรือไม่
    const checkForProfileCallback = async () => {
      try {
        const callbackUrl = await AsyncStorage.getItem('facebook_profile_callback_url');
        if (callbackUrl) {
          console.log('🔗 Found stored profile callback URL:', callbackUrl);
          await AsyncStorage.removeItem('facebook_profile_callback_url');
          await processFacebookProfileCallback(callbackUrl);
        }
      } catch (error) {
        console.error('Error checking profile callback:', error);
      }
    };

    // ตรวจสอบเมื่อโหลดหน้า
    checkForProfileCallback();

    // ฟังการเปลี่ยนแปลงของ URL
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 Linking event in ProfileScreen:', event.url);
      handleDeepLink(event.url);
    });

    // ตรวจสอบ initial URL เมื่อเปิดแอป
    const checkInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        if (url && url.includes('state=profile_')) {
          console.log('🔗 Initial URL is a profile connection:', url);
          await handleDeepLink(url);
        }
      } catch (error) {
        console.error('Error getting initial URL:', error);
      }
    };

    checkInitialURL();

    return () => {
      subscription?.remove();
    };
  }, []);

  // ==================== OTHER FUNCTIONS ====================

  const checkLocalStorage = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (!user && parsedUser) {
          Alert.alert(
            'ข้อมูลไม่สมบูรณ์',
            'พบปัญหาการโหลดข้อมูล กรุณาเข้าสู่ระบบใหม่',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.replace('Login');
                }
              }
            ]
          );
          return;
        }
      }
      navigation.replace('Login');
    } catch (error) {
      console.error('❌ Error checking AsyncStorage:', error);
      navigation.replace('Login');
    }
  };

  // 🔗 โหลด Social Connections
  const loadSocialConnections = async () => {
    try {
      setLoading(true);

      // 1. โหลดข้อมูลจาก AsyncStorage (ถ้ามีเก็บไว้)
      await loadStoredSocialData();

      // 2. ตรวจสอบ Facebook connection (แยกจากการ login)
      await checkFacebookProfileConnection();

      // 3. อัพเดทสถานะ
      updateConnectionStatus();

    } catch (error) {
      console.error('❌ Error loading social connections:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 🔥 ตรวจสอบ Facebook Profile Connection (แยกจากการ login)
  const checkFacebookProfileConnection = async () => {
    try {
      console.log('🔍 Checking Facebook profile connection...');

      const [isConnected, facebookData, lastSynced] = await Promise.all([
        AsyncStorage.getItem('facebookProfileConnected'),
        AsyncStorage.getItem('facebookProfileData'),
        AsyncStorage.getItem('facebookLastConnected')
      ]);

      if (isConnected === 'true' && facebookData) {
        const parsedData = JSON.parse(facebookData);

        setSocialConnections(prev => ({
          ...prev,
          facebook: {
            connected: true,
            profileUrl: `https://facebook.com/${parsedData.facebookId}`,
            name: parsedData.name,
            profilePicture: parsedData.profilePicture,
            friendCount: parsedData.totalFriends || 0,
            lastSynced: lastSynced
          }
        }));

        console.log('✅ Facebook profile connection found:', parsedData.name);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error checking Facebook profile:', error);
      return false;
    }
  };

  // 💾 โหลดข้อมูล Social ที่เก็บไว้
  const loadStoredSocialData = async () => {
    try {
      const storedSocial = await AsyncStorage.getItem('socialConnections');
      if (storedSocial) {
        const parsedData = JSON.parse(storedSocial);
        setSocialConnections(prev => ({ ...prev, ...parsedData }));
        console.log('✅ Loaded stored social data');
      }
    } catch (error) {
      console.error('❌ Error loading stored social:', error);
    }
  };

  // 🔄 อัพเดทสถานะ Connections
  const updateConnectionStatus = () => {
    const updates = { ...socialConnections };

    // Facebook
    if (isFacebookUser) {
      updates.facebook.connected = true;
      if (!updates.facebook.profileUrl && user?.facebookId) {
        updates.facebook.profileUrl = `https://facebook.com/${user.facebookId}`;
      }
    }

    setSocialConnections(updates);
  };

  // 🔥 แก้ไข connectFacebookForFriends ให้สามารถเชื่อมต่อจาก Profile ได้โดยตรง
  // แก้ไขฟังก์ชัน connectFacebookForFriends
  const connectFacebookForFriends = async () => {
    try {
      // ตรวจสอบว่ามีการเชื่อมต่ออยู่แล้วหรือไม่
      if (socialConnections.facebook.connected) {
        Alert.alert(
          'เชื่อมต่ออยู่แล้ว',
          `คุณได้เชื่อมต่อ Facebook แล้ว\n\nชื่อ: ${socialConnections.facebook.name}\nเพื่อน: ${socialConnections.facebook.friendCount} คน\n\nต้องการอัพเดทข้อมูลเพื่อนล่าสุดหรือไม่?`,
          [
            { text: 'ยกเลิก', style: 'cancel' },
            {
              text: 'อัพเดทข้อมูล',
              onPress: async () => {
                try {
                  setLoading(true);
                  await startFacebookProfileConnection();
                } catch (error) {
                  console.error('Facebook connection error:', error);
                  Alert.alert('ข้อผิดพลาด', 'ไม่สามารถอัพเดทข้อมูลได้');
                  setLoading(false);
                }
              }
            },
            {
              text: 'ดูโปรไฟล์',
              onPress: () => openSocialProfile('Facebook', socialConnections.facebook.profileUrl)
            }
          ]
        );
        return;
      }

      // ถ้ายังไม่ได้เชื่อมต่อ
      Alert.alert(
        'เชื่อมต่อ Facebook',
        'ต้องการเชื่อมต่อ Facebook เพื่อค้นหาเพื่อนที่เล่น ThaiQuestify อยู่ไหม?\n\nเราจะขอสิทธิ์:',
        [
          {
            text: 'ยกเลิก',
            style: 'cancel'
          },
          {
            text: 'เชื่อมต่อเลย',
            onPress: async () => {
              try {
                setLoading(true);
                await startFacebookProfileConnection();
              } catch (error) {
                console.error('Facebook connection error:', error);
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ Facebook ได้');
                setLoading(false);
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('Facebook connect error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเริ่มการเชื่อมต่อได้');
    }
  };

  // 💾 บันทึกรายชื่อเพื่อน
  const saveFriendsList = async (friends) => {
    try {
      const simplifiedFriends = friends.map(friend => ({
        id: friend.id,
        name: friend.name,
        picture: friend.picture?.data?.url
      }));

      await AsyncStorage.setItem('facebookFriends', JSON.stringify(simplifiedFriends));
      console.log(`✅ Saved ${simplifiedFriends.length} friends`);

      // อัพเดทใน backend (ถ้ามี API)
      await syncFriendsWithBackend(simplifiedFriends);
    } catch (error) {
      console.error('❌ Error saving friends:', error);
    }
  };

  // 🌐 Sync ข้อมูลเพื่อนกับ Backend
  const syncFriendsWithBackend = async (friends) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token || !user?._id) return;

      const response = await fetch(`${API_URL}/v2/users/friends/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          friends: friends,
          source: 'facebook'
        })
      });

      if (response.ok) {
        console.log('✅ Friends synced with backend');
      }
    } catch (error) {
      console.log('⚠️ Could not sync friends with backend:', error);
    }
  };

  // 👥 แสดงคำแนะนำเพื่อน
  const showFriendSuggestions = (friends) => {
    if (friends.length === 0) return;

    const suggestedFriends = friends.slice(0, 3);

    Alert.alert(
      'แนะนำเพื่อนของคุณ! 👋',
      `เราพบเพื่อนของคุณบน Facebook:\n\n${suggestedFriends.map(f => `• ${f.name}`).join('\n')}\n\nต้องการชวนเพื่อนทำเควสร่วมกันไหม?`,
      [
        { text: 'ไว้คราวหลัง', style: 'cancel' },
        {
          text: 'ชวนเลย!',
          onPress: () => navigation.navigate('FriendInvite', {
            friends: suggestedFriends
          })
        }
      ]
    );
  };

  // 🔥 ฟังก์ชัน Disconnect Facebook
  const handleFacebookDisconnect = () => {
    Alert.alert(
      'ยกเลิกการเชื่อมต่อ Facebook',
      'คุณแน่ใจที่จะยกเลิกการเชื่อมต่อ Facebook หรือไม่?\n\nข้อมูลเพื่อนของคุณจะถูกลบออก',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยกเลิกการเชื่อมต่อ',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectFacebook();
            } catch (error) {
              console.error('Disconnect error:', error);
            }
          }
        }
      ]
    );
  };

  // 🔥 Disconnect Facebook
  const disconnectFacebook = async () => {
    try {
      setLoading(true);

      // ลบข้อมูลจาก AsyncStorage
      await AsyncStorage.multiRemove([
        'facebookProfileConnected',
        'facebookProfileData',
        'facebookProfileToken',
        'facebookFriends',
        'facebookToken',
        'facebookUserData'
      ]);

      // รีเซ็ต state
      setSocialConnections(prev => ({
        ...prev,
        facebook: {
          connected: false,
          profileUrl: null,
          name: null,
          profilePicture: null,
          friendCount: 0,
          lastSynced: null
        }
      }));

      // อัพเดท user ถ้ามีข้อมูล Facebook
      if (user?.facebookId) {
        await updateUser({
          ...user,
          facebookConnected: false,
          facebookFriendCount: 0
        });
      }

      Alert.alert('สำเร็จ', 'ยกเลิกการเชื่อมต่อ Facebook แล้ว');

    } catch (error) {
      console.error('Error disconnecting Facebook:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถยกเลิกการเชื่อมต่อได้');
    } finally {
      setLoading(false);
    }
  };

  // 🎮 Connect TikTok
  const connectTikTok = async () => {
    Alert.alert(
      'เชื่อมต่อ TikTok',
      'เร็วๆ นี้! กำลังพัฒนาฟีเจอร์การเชื่อมต่อ TikTok\n\nคุณจะสามารถ:',
      [
        { text: 'รอก่อนน้า' },
        {
          text: 'อยากรู้จัง!',
          onPress: () => {
            console.log('TikTok connection requested');
          }
        }
      ]
    );
  };

  // 🔗 Open Social Profile
  const openSocialProfile = (platform, url) => {
    if (url) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        'ไม่พบโปรไฟล์',
        `กรุณาเชื่อมต่อ ${platform} ก่อน`
      );
    }
  };

  // 📋 Copy Social Info
  // const copySocialInfo = (platform, info, label) => {
  //   Clipboard.setString(info);
  //   Alert.alert('คัดลอกแล้ว!', `${platform} ${label} ถูกคัดลอกแล้ว`);
  //   setTimeout(() => setCopiedText(''), 2000);
  // };

  // 🚪 Logout
  const handleLogout = () => {
    Alert.alert(
      'ออกจากระบบ?',
      'คุณแน่ใจที่จะออกจากระบบหรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ออกจากระบบ',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.replace('Login');
          }
        },
      ]
    );
  };

  // 🎨 Get profile image
  const getProfileImageUri = () => {
    if (user?.photo) return user.photo;
    if (socialConnections.facebook.profilePicture) return socialConnections.facebook.profilePicture;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}&backgroundColor=6C63FF`;
  };

  // 🔧 Share profile
  const shareProfile = async () => {
    try {
      await Share.share({
        message: `✨ ชวนเพื่อนมาเล่น ThaiQuestify!\n\nฉันกำลังเล่น ThaiQuestify มาชวนเพื่อนทำเควสร่วมกัน!\n\n${socialConnections.facebook.connected
          ? `Facebook: ${socialConnections.facebook.name}\n`
          : ''
          }${socialConnections.tiktok.connected
            ? `TikTok: ${socialConnections.tiktok.username}\n`
            : ''
          }\nมาร่วมสนุกด้วยกัน! 🎮`,
        title: 'ชวนเพื่อนเล่น ThaiQuestify'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // 🎨 Loading screen
  if (loading || !user) {
    return (
      <View style={[styles.container, { backgroundColor: COLORS.light }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>กำลังโหลดโปรไฟล์... ✨</Text>
      </View>
    );
  }

  // ==================== UI RENDER ====================
  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <View style={styles.headerContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: getProfileImageUri() }}
              style={styles.avatar}
            />
            <View style={[styles.statusBadge, {
              backgroundColor: isFacebookUser ? COLORS.facebookBlue :
                isGoogleUser ? COLORS.google : COLORS.success
            }]}>
              <Icon
                name={isFacebookUser ? 'facebook' :
                  isGoogleUser ? 'mail' : 'person'}
                size={12}
                color="white"
              />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.name || 'ผู้ใช้ใหม่'}
            </Text>
            <Text style={styles.userEmail}>
              {user.email || 'ไม่มีอีเมล'}
            </Text>

            {/* Social Connections Summary */}
            <View style={styles.socialSummary}>
              {socialConnections.facebook.connected && (
                <View style={styles.socialBadge}>
                  <Icon name="facebook" size={12} color="white" />
                  <Text style={styles.socialBadgeText}>
                    {socialConnections.facebook.friendCount || 0}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareButton} onPress={shareProfile}>
            <Icon name="share" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Social Connections Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 การเชื่อมต่อโซเชียล</Text>
          <Text style={styles.sectionSubtitle}>เชื่อมต่อเพื่อหาเพื่อนทำเควสร่วมกัน</Text>

          {/* Facebook Connection Card */}
          <View style={styles.connectionCard}>
            <View style={styles.connectionHeader}>
              <View style={[styles.platformIcon, { backgroundColor: COLORS.facebookBlue }]}>
                <Icon name="facebook" size={24} color="white" />
              </View>
              <View style={styles.connectionInfo}>
                <Text style={styles.platformName}>Facebook</Text>
                <Text style={styles.platformDesc}>
                  {socialConnections.facebook.connected
                    ? `เชื่อมต่อแล้ว • เพื่อน ${socialConnections.facebook.friendCount} คน`
                    : 'ค้นหาเพื่อนที่เล่น ThaiQuestify'}
                </Text>
              </View>
              <Switch
                value={socialConnections.facebook.connected}
                onValueChange={(value) => {
                  if (value && !socialConnections.facebook.connected) {
                    // ถ้าต้องการเปิดและยังไม่ได้เชื่อมต่อ
                    connectFacebookForFriends();
                  } else if (!value && socialConnections.facebook.connected) {
                    // ถ้าต้องการปิดและมีการเชื่อมต่ออยู่
                    handleFacebookDisconnect();
                  }
                }}
                trackColor={{ false: '#ddd', true: '#1877F2' }}
                thumbColor={socialConnections.facebook.connected ? '#fff' : '#f4f3f4'}
              />
            </View>

            {socialConnections.facebook.connected ? (
              <View style={styles.connectedContent}>
                <View style={styles.connectedRow}>
                  <Icon name="person" size={16} color={COLORS.facebookBlue} />
                  <Text style={styles.connectedText}>
                    {socialConnections.facebook.name || 'Facebook User'}
                  </Text>
                </View>
                <View style={styles.connectedRow}>
                  <Icon name="people" size={16} color={COLORS.facebookBlue} />
                  <Text style={styles.connectedText}>
                    เพื่อน {socialConnections.facebook.friendCount} คน
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.socialAction}
                    onPress={() => openSocialProfile('Facebook', socialConnections.facebook.profileUrl)}
                  >
                    <Icon name="open-in-new" size={16} color={COLORS.facebookBlue} />
                    <Text style={[styles.socialActionText, { color: COLORS.facebookBlue }]}>
                      เปิดโปรไฟล์
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.socialAction, { backgroundColor: '#E7F3FF' }]}
                    onPress={async () => {
                      Alert.alert(
                        'อัพเดทข้อมูลเพื่อน',
                        'ต้องการดึงข้อมูลเพื่อนล่าสุดจาก Facebook หรือไม่?',
                        [
                          { text: 'ยกเลิก', style: 'cancel' },
                          {
                            text: 'อัพเดทเลย',
                            onPress: () => startFacebookProfileConnection()
                          }
                        ]
                      );
                    }}
                  >
                    <Icon name="sync" size={16} color={COLORS.facebookBlue} />
                    <Text style={[styles.socialActionText, { color: COLORS.facebookBlue }]}>
                      อัพเดทเพื่อน
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.connectButton}
                onPress={connectFacebookForFriends}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="add-link" size={20} color="white" />
                    <Text style={styles.connectButtonText}>เชื่อมต่อ Facebook</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            {/* // ใน UI เพิ่มปุ่มสร้าง quest */}
            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: '#8A2BE2' }]}
              onPress={() => navigation.navigate('CreateSocialQuest')}
            >
              <Icon name="add-task" size={20} color="white" />
              <Text style={styles.connectButtonText}>สร้างเควสชุมชน</Text>
            </TouchableOpacity>

          </View>

          {/* TikTok Connection Card */}
          <View style={styles.connectionCard}>
            <View style={styles.connectionHeader}>
              <View style={[styles.platformIcon, { backgroundColor: COLORS.tiktokBlack }]}>
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>TK</Text>
              </View>
              <View style={styles.connectionInfo}>
                <Text style={styles.platformName}>TikTok</Text>
                <Text style={styles.platformDesc}>เร็วๆ นี้!</Text>
              </View>
              <Switch
                value={socialConnections.tiktok.connected}
                onValueChange={connectTikTok}
                trackColor={{ false: '#ddd', true: COLORS.tiktokBlack }}
                disabled={true}
              />
            </View>

            <TouchableOpacity
              style={[styles.connectButton, { backgroundColor: COLORS.tiktokBlack }]}
              onPress={connectTikTok}
              disabled={true}
            >
              <Icon name="pending" size={20} color="white" />
              <Text style={styles.connectButtonText}>เร็วๆ นี้</Text>
            </TouchableOpacity>
          </View>

          {/* Coming Soon Platforms */}
          <Text style={styles.comingSoonTitle}>เร็วๆ นี้! 🚀</Text>
          <View style={styles.comingSoonGrid}>
            <View style={styles.comingSoonCard}>
              <View style={[styles.comingSoonIcon, { backgroundColor: COLORS.instagram }]}>
                <Icon name="camera-alt" size={20} color="white" />
              </View>
              <Text style={styles.comingSoonText}>Instagram</Text>
            </View>
            <View style={styles.comingSoonCard}>
              <View style={[styles.comingSoonIcon, { backgroundColor: COLORS.line }]}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>LINE</Text>
              </View>
              <Text style={styles.comingSoonText}>LINE</Text>
            </View>
          </View>
        </View>

        {/* Friend Quest Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>🎮 ประโยชน์จากการเชื่อมต่อ</Text>
          <View style={styles.benefitItem}>
            <Icon name="emoji-people" size={20} color={COLORS.success} />
            <Text style={styles.benefitText}>ค้นหาเพื่อนที่เล่น ThaiQuestify</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="card-giftcard" size={20} color={COLORS.warning} />
            <Text style={styles.benefitText}>รับคะแนนพิเศษเมื่อชวนเพื่อน</Text>
          </View>
          <View style={styles.benefitItem}>
            <Icon name="group-add" size={20} color={COLORS.primary} />
            <Text style={styles.benefitText}>ทำเควสร่วมกับเพื่อนได้</Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>📋 ข้อมูลบัญชี</Text>

          <View style={styles.infoRow}>
            <Icon name="person" size={18} color={COLORS.primary} />
            <Text style={styles.infoLabel}>ชื่อผู้ใช้</Text>
            <Text style={styles.infoValue}>{user.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="email" size={18} color={COLORS.primary} />
            <Text style={styles.infoLabel}>อีเมล</Text>
            <Text style={styles.infoValue}>{user.email || 'ไม่มี'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="security" size={18} color={COLORS.primary} />
            <Text style={styles.infoLabel}>ประเภทบัญชี</Text>
            <Text style={styles.infoValue}>
              {user.userType === 'customer' ? 'ลูกค้า' :
                user.userType === 'partner' ? 'พาร์ทเนอร์' :
                  user.userType === 'shop' ? 'ร้านค้า' : 'ผู้ใช้'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={18} color={COLORS.primary} />
            <Text style={styles.infoLabel}>สมัครสมาชิกเมื่อ</Text>
            <Text style={styles.infoValue}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : 'ไม่ทราบ'}
            </Text>
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>⚙️ การตั้งค่า</Text>

          <TouchableOpacity style={styles.settingItem}>
            <Icon name="notifications" size={22} color={COLORS.primary} />
            <Text style={styles.settingText}>การแจ้งเตือน</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Icon name="privacy-tip" size={22} color={COLORS.primary} />
            <Text style={styles.settingText}>ความเป็นส่วนตัว</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Icon name="help" size={22} color={COLORS.primary} />
            <Text style={styles.settingText}>ช่วยเหลือ</Text>
            <Icon name="chevron-right" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={20} color="white" />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.version}>ThaiQuestify v2.0.0</Text>
          <Text style={styles.copyright}>© 2024 All rights reserved</Text>
        </View>

        {/* // Create Quest Modal */}
        {/* // เปลี่ยนส่วนของ Modal สร้าง quest */}
        <Modal
          visible={showCreateQuestModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView>
                <Text style={styles.modalTitle}>สร้างเควสของคุณเอง</Text>

                <TextInput
                  style={styles.input}
                  placeholder="ชื่อเควส"
                  value={newQuest.title}
                  onChangeText={(text) => setNewQuest({ ...newQuest, title: text })}
                />

                <TextInput
                  style={[styles.input, { height: 100 }]}
                  placeholder="คำอธิบาย"
                  multiline
                  value={newQuest.description}
                  onChangeText={(text) => setNewQuest({ ...newQuest, description: text })}
                />

                {/* แทนที่ Picker ด้วย TouchableOpacity */}
                <TouchableOpacity
                  style={[styles.input, { justifyContent: 'center' }]}
                  onPress={() => setShowQuestTypePicker(true)}
                >
                  <Text style={{ color: '#333' }}>
                    {selectedQuestType === 'facebook_follow' ? 'ติดตาม Facebook' :
                      selectedQuestType === 'facebook_like' ? 'Like Facebook' :
                        selectedQuestType === 'facebook_share' ? 'แชร์โพสต์' :
                          selectedQuestType === 'website_visit' ? 'เข้าชมเว็บไซต์' :
                            'ดาวน์โหลดแอป'}
                  </Text>
                </TouchableOpacity>

                {/* เพิ่ม Modal สำหรับเลือกประเภท quest */}
                <Modal
                  visible={showQuestTypePicker}
                  transparent={true}
                  animationType="slide"
                >
                  <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                      <Text style={styles.pickerTitle}>เลือกประเภทเควส</Text>

                      {[
                        { label: 'ติดตาม Facebook', value: 'facebook_follow' },
                        { label: 'Like Facebook', value: 'facebook_like' },
                        { label: 'แชร์โพสต์', value: 'facebook_share' },
                        { label: 'เข้าชมเว็บไซต์', value: 'website_visit' },
                        { label: 'ดาวน์โหลดแอป', value: 'app_download' }
                      ].map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={styles.pickerItem}
                          onPress={() => {
                            setSelectedQuestType(type.value);
                            setNewQuest({ ...newQuest, type: type.value });
                            setShowQuestTypePicker(false);
                          }}
                        >
                          <Text style={styles.pickerItemText}>{type.label}</Text>
                        </TouchableOpacity>
                      ))}

                      <TouchableOpacity
                        style={styles.pickerCancel}
                        onPress={() => setShowQuestTypePicker(false)}
                      >
                        <Text style={styles.pickerCancelText}>ยกเลิก</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>

                <TextInput
                  style={styles.input}
                  placeholder="เป้าหมาย (จำนวน)"
                  keyboardType="numeric"
                  value={newQuest.target.toString()}
                  onChangeText={(text) => setNewQuest({ ...newQuest, target: parseInt(text) || 1 })}
                />

                <TextInput
                  style={styles.input}
                  placeholder="รางวัลคะแนน"
                  keyboardType="numeric"
                  value={newQuest.reward.points.toString()}
                  onChangeText={(text) => setNewQuest({
                    ...newQuest,
                    reward: { ...newQuest.reward, points: parseInt(text) || 0 }
                  })}
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowCreateQuestModal(false)}
                  >
                    <Text style={styles.buttonText}>ยกเลิก</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.confirmButton]}
                    onPress={createUserQuest}
                  >
                    <Text style={styles.buttonText}>สร้างเควส</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
};

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'white',
  },
  statusBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  socialSummary: {
    flexDirection: 'row',
    gap: 8,
  },
  socialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  socialBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  shareButton: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3047',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  connectionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  connectionInfo: {
    flex: 1,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3047',
    marginBottom: 4,
  },
  platformDesc: {
    fontSize: 12,
    color: '#666',
  },
  connectedContent: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  connectedText: {
    fontSize: 14,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  socialAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F7F9FC',
    gap: 8,
  },
  socialActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
    marginBottom: 15,
    textAlign: 'center',
  },
  comingSoonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comingSoonCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  comingSoonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  comingSoonText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3047',
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3047',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 15,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#2D3047',
    fontWeight: '500',
  },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3047',
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 15,
  },
  settingText: {
    fontSize: 15,
    color: '#2D3047',
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B8B',
    padding: 16,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  copyright: {
    fontSize: 11,
    color: '#CCC',
  },
  pickerModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 40,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2D3047',
  },
  pickerItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  pickerCancel: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;