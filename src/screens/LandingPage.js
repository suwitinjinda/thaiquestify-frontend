import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';

const { width } = Dimensions.get('window');

const LandingPage = ({ navigation }) => {
  const { user, loading: authLoading } = useAuth();

  // ✅ ใช้ useRef ถูกต้อง
  const dataLoadedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [refreshing, setRefreshing] = useState(false);
  const [regionStats, setRegionStats] = useState({});
  const [hotQuests, setHotQuests] = useState([]);
  const [socialQuests, setSocialQuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socialQuestsLoading, setSocialQuestsLoading] = useState(false);
  const [userStats, setUserStats] = useState({
    completedQuests: 0,
    totalPoints: 0,
    rewardsClaimed: 0
  });

  // TikTok States
  const [tiktokQuests, setTiktokQuests] = useState([]);
  const [tiktokLoading, setTiktokLoading] = useState(false);
  const [showTikTokConnect, setShowTikTokConnect] = useState(false);
  const [tiktokConnected, setTiktokConnected] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState('');

  const tiktokAuthInProgress = useRef(false);

  // ตรวจสอบว่า DailyQuests screen พร้อมใช้งาน
  const [dailyQuestsAvailable, setDailyQuestsAvailable] = useState(false);

  const API_BASE_URL = 'http://127.0.0.1:5000';

  // โหลด Social Quests และ TikTok เมื่อ focus หน้า
  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadSocialQuests();
        checkTikTokConnection();
        loadTikTokChallenges();
      }
    }, [user])
  );

  useEffect(() => {
    // โหลดข้อมูลครั้งเดียว
    if (!dataLoadedRef.current) {
      console.log('🏁 Initial load - calling loadDashboardData');
      loadDashboardData();
      dataLoadedRef.current = true;
    }

    // ตรวจสอบ navigation
    try {
      if (navigation && typeof navigation.navigate === 'function') {
        setDailyQuestsAvailable(true);
        console.log('✅ Navigation is available');
      } else {
        console.log('⚠️ Navigation may not be properly passed');
        setDailyQuestsAvailable(false);
      }
    } catch (error) {
      console.log('⚠️ Error checking navigation:', error.message);
      setDailyQuestsAvailable(false);
    }

    // Animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [navigation]);

  // ==================== TIKTOK FUNCTIONS ====================

  // ตรวจสอบการเชื่อมต่อ TikTok
  const checkTikTokConnection = async () => {
    if (!user) return false;

    try {
      // ตรวจสอบจาก backend หรือ local storage
      const userId = user._id;
      const timestamp = Date.now();
      const token = `user-token-${userId}-${timestamp}`;

      const response = await axios.get(`${API_BASE_URL}/api/integrations/tiktok/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success && response.data.connected) {
        setTiktokConnected(true);
        setTiktokUsername(response.data.username || '');
        return true;
      } else {
        setTiktokConnected(false);
        return false;
      }
    } catch (error) {
      console.log('❌ Error checking TikTok connection:', error.message);
      // ใช้ค่า default จาก user object
      const hasTikTok = user.tiktokConnected || user.socialConnections?.tiktok;
      setTiktokConnected(!!hasTikTok);
      return !!hasTikTok;
    }
  };

  // โหลด TikTok challenges
  const loadTikTokChallenges = async () => {
    if (!user) {
      console.log('⚠️ User not logged in for TikTok');
      setTiktokQuests([]);
      return;
    }

    if (tiktokAuthInProgress.current) {
      console.log('⚠️ TikTok auth already in progress');
      return;
    }

    try {
      setTiktokLoading(true);
      console.log('🔄 Loading TikTok challenges...');

      // ตรวจสอบการเชื่อมต่อ TikTok
      const isConnected = await checkTikTokConnection();

      if (!isConnected) {
        console.log('⚠️ TikTok not connected');
        setTiktokQuests(getMockTikTokChallenges()); // แสดง mock data เพื่อดึงดูด
        setTiktokLoading(false);
        return;
      }

      // หากเชื่อมต่อแล้ว ดึงข้อมูล TikTok quests
      const userId = user._id;
      const timestamp = Date.now();
      const token = `user-token-${userId}-${timestamp}`;

      const response = await axios.get(`${API_BASE_URL}/api/tiktok/challenges`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 3,
          sort: 'trending',
          includeJoined: true
        },
        timeout: 5000
      });

      if (response.data.success) {
        const challenges = response.data.data?.challenges || response.data.challenges || [];
        console.log(`✅ Loaded ${challenges.length} TikTok challenges`);
        setTiktokQuests(challenges);
      } else {
        console.log('⚠️ No TikTok challenges available');
        setTiktokQuests(getMockTikTokChallenges());
      }

    } catch (error) {
      console.error('❌ Error loading TikTok challenges:', error.message);
      // แสดง mock data เมื่อ API error
      setTiktokQuests(getMockTikTokChallenges());
    } finally {
      setTiktokLoading(false);
    }
  };

  // Mock TikTok challenges (fallback)
  const getMockTikTokChallenges = () => {
    return [
      {
        _id: 'tiktok1',
        title: 'TikTok Hashtag Challenge',
        description: 'สร้างวิดีโอด้วยแฮชแท็ก #ThaiQuestifyChallenge',
        hashtag: 'ThaiQuestifyChallenge',
        creator: {
          name: 'ทีมงานไทยเควส',
          avatarColor: '#EE1D52'
        },
        participants: 156,
        reward: {
          participantPoints: 50,
          type: 'tiktok',
          extra: 'โอกาสติดหน้า FYPI'
        },
        location: 'ทั่วประเทศ',
        category: 'TikTok',
        isJoined: false,
        target: 500,
        completed: 156,
        verificationType: 'hashtag',
        videoRequirements: {
          minDuration: 15,
          hashtags: ['ThaiQuestifyChallenge'],
          sounds: []
        },
        platform: 'tiktok'
      },
      {
        _id: 'tiktok2',
        title: 'Duet Challenge',
        description: 'ทำ Duet กับวิดีโอตัวอย่างของเรา',
        hashtag: 'ThaiQuestifyDuet',
        creator: {
          name: 'แบรนด์พันธมิตร',
          avatarColor: '#000000'
        },
        participants: 89,
        reward: {
          participantPoints: 75,
          type: 'tiktok',
          extra: 'รีวอร์ดพิเศษจากแบรนด์'
        },
        location: 'ออนไลน์',
        category: 'TikTok',
        isJoined: true,
        target: 200,
        completed: 89,
        verificationType: 'duet',
        videoRequirements: {
          duetWith: 'video_12345',
          minDuration: 10
        },
        platform: 'tiktok'
      },
      {
        _id: 'tiktok3',
        title: 'Sound Challenge',
        description: 'ใช้เสียงเฉพาะและแท็กเรา @thaiquestify',
        hashtag: 'ThaiQuestifySound',
        creator: {
          name: 'Community',
          avatarColor: '#69C9D0'
        },
        participants: 42,
        reward: {
          participantPoints: 40,
          type: 'tiktok'
        },
        location: 'ทั่วประเทศ',
        category: 'TikTok',
        isJoined: false,
        target: 100,
        completed: 42,
        verificationType: 'sound',
        videoRequirements: {
          soundId: 'sound_67890',
          hashtags: ['ThaiQuestifySound', 'ThaiQuestify'],
          mention: '@thaiquestify'
        },
        platform: 'tiktok'
      }
    ];
  };

  // เชื่อมต่อบัญชี TikTok
  const connectTikTokAccount = async () => {
    if (tiktokAuthInProgress.current) {
      Alert.alert('กำลังดำเนินการ', 'การเชื่อมต่อ TikTok กำลังดำเนินการอยู่');
      return;
    }

    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนเชื่อมต่อ TikTok');
      navigation.navigate('Login');
      return;
    }

    try {
      tiktokAuthInProgress.current = true;
      setShowTikTokConnect(false);

      navigation.navigate('ProfileTab');

    } catch (error) {
      console.error('❌ Error connecting TikTok:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเชื่อมต่อ TikTok');
    } finally {
      tiktokAuthInProgress.current = false;
    }
  };

  // Join TikTok challenge
  const joinTikTokChallenge = async (challengeId, challengeTitle) => {
    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนเข้าร่วม TikTok Challenge');
      navigation.navigate('Login');
      return;
    }

    if (!tiktokConnected) {
      Alert.alert(
        'เชื่อมต่อ TikTok ก่อน',
        'คุณต้องเชื่อมต่อบัญชี TikTok ก่อนเข้าร่วม Challenge',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          { text: 'เชื่อมต่อทันที', onPress: () => setShowTikTokConnect(true) }
        ]
      );
      return;
    }

    try {
      console.log(`🔄 Joining TikTok challenge: ${challengeId}`);
      const userId = user._id;
      const timestamp = Date.now();
      const token = `user-token-${userId}-${timestamp}`;

      const response = await axios.post(
        `${API_BASE_URL}/api/tiktok/challenges/${challengeId}/join`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Successfully joined TikTok challenge');

        // อัปเดตสถานะใน UI
        setTiktokQuests(prevChallenges =>
          prevChallenges.map(challenge =>
            challenge._id === challengeId
              ? {
                ...challenge,
                isJoined: true,
                participants: (challenge.participants || 0) + 1,
                completed: (challenge.completed || 0) + 1
              }
              : challenge
          )
        );

        Alert.alert(
          'สำเร็จ!',
          `คุณเข้าร่วม "${challengeTitle}" แล้ว!\n\nสร้างวิดีโอด้วยแฮชแท็กที่กำหนด และระบบจะตรวจสอบอัตโนมัติ`
        );

        // นำทางไปหน้า verify หรือ instructions
        navigation.navigate('QuestDetails', { questId: challengeId });

      } else {
        Alert.alert('ไม่สำเร็จ', 'ไม่สามารถเข้าร่วม Challenge ได้: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Error joining TikTok challenge:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าร่วม Challenge');
    }
  };

  // นำทางไปหน้า TikTok Challenges
  const navigateToTikTokChallenges = () => {
    if (!navigation || !navigation.navigate) {
      Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
      return;
    }

    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนใช้งาน TikTok Challenges');
      navigation.navigate('Login');
      return;
    }

    try {
      navigation.navigate('TikTokChallenges');
    } catch (error) {
      console.error('❌ Error navigating to TikTokChallenges:', error);
      Alert.alert('ไม่พร้อมใช้งาน', 'TikTok Challenges screen ยังไม่พร้อม');
    }
  };

  // ==================== EXISTING FUNCTIONS ====================

  // ฟังก์ชันโหลด Social Quests จาก API
  const loadSocialQuests = async () => {
    if (!user) {
      console.log('⚠️ User not logged in');
      setSocialQuests([]);
      return;
    }

    try {
      setSocialQuestsLoading(true);
      console.log('🔄 Loading social quests...');

      // 🔥 สร้าง token ให้ถูกต้องตาม format
      const userId = user._id; // "693ffa718345527c6c532fa9"
      const timestamp = Date.now(); // ต้องมี timestamp
      const token = `user-token-${userId}-${timestamp}`;

      console.log(`🔍 Using token: ${token.substring(0, 40)}...`);

      const API_URL = 'https://thaiquestify.com';

      const response = await axios.get(`${API_URL}/api/user-generated-quests/public`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          limit: 4,
          sort: 'popular',
          status: 'active'
        },
        timeout: 5000
      });

      console.log('✅ API Response status:', response.status);

      if (response.data.success) {
        const quests = response.data.data?.quests || response.data.data || [];
        console.log(`✅ Success! Loaded ${quests.length} social quests`);
        setSocialQuests(quests);
      } else {
        console.log('⚠️ API returned success:false', response.data.message);
        setSocialQuests(getMockSocialQuests());
      }

    } catch (error) {
      console.error('❌ Error loading social quests:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      setSocialQuests(getMockSocialQuests());
    } finally {
      setSocialQuestsLoading(false);
    }
  };

  // Mock data สำหรับ Social Quests (ถ้า API ไม่ทำงาน)
  const getMockSocialQuests = () => {
    return [
      {
        _id: 'social1',
        title: 'ติดตามเพจอาหารไทย',
        description: 'ติดตามเพจอาหารไทยเพื่อรับสูตรอาหารฟรี',
        creator: {
          name: 'น้ำฝน',
          avatarColor: '#FF6B35'
        },
        participants: 24,
        reward: {
          participantPoints: 30,
          type: 'community'
        },
        location: 'กรุงเทพมหานคร',
        category: 'อาหาร',
        isJoined: false,
        target: 50,
        completed: 24
      },
      {
        _id: 'social2',
        title: 'Like โพสต์ท่องเที่ยว',
        description: 'กดไลค์โพสต์รีวิวสถานที่ท่องเที่ยว',
        creator: {
          name: 'ภูมิ',
          avatarColor: '#4a6baf'
        },
        participants: 18,
        reward: {
          participantPoints: 20,
          type: 'travel'
        },
        location: 'พระนครศรีอยุธยา',
        category: 'ท่องเที่ยว',
        isJoined: true,
        target: 100,
        completed: 18
      },
      {
        _id: 'social3',
        title: 'แชร์โปรโมชั่น',
        description: 'แชร์โปรโมชั่นร้านค้าออนไลน์',
        creator: {
          name: 'ต้น',
          avatarColor: '#28a745'
        },
        participants: 12,
        reward: {
          participantPoints: 40,
          type: 'shopping'
        },
        location: 'เชียงใหม่',
        category: 'ช้อปปิ้ง',
        isJoined: false,
        target: 30,
        completed: 12
      }
    ];
  };

  // ฟังก์ชันเข้าร่วม Social Quest
  const joinSocialQuest = async (questId, questTitle) => {
    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนเข้าร่วมเควส');
      navigation.navigate('Login');
      return;
    }

    try {
      console.log(`🔄 Joining social quest: ${questId}`);
      const token = user.token || user.id;

      const response = await axios.post(
        `${API_BASE_URL}/api/user-generated-quests/${questId}/join`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        console.log('✅ Successfully joined quest:', response.data);

        // อัปเดตสถานะใน UI
        setSocialQuests(prevQuests =>
          prevQuests.map(quest =>
            quest._id === questId
              ? {
                ...quest,
                isJoined: true,
                participants: (quest.participants || 0) + 1,
                completed: (quest.completed || 0) + 1
              }
              : quest
          )
        );

        Alert.alert('สำเร็จ!', `เข้าร่วมเควส "${questTitle}" สำเร็จ!`);
      } else {
        Alert.alert('ไม่สำเร็จ', 'ไม่สามารถเข้าร่วมเควสได้: ' + response.data.message);
      }
    } catch (error) {
      console.error('❌ Error joining social quest:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าร่วมเควส');
    }
  };

  // ฟังก์ชันนำทางไปยัง Social Quests หน้าหลัก
  const navigateToSocialQuests = () => {
    if (!navigation || !navigation.navigate) {
      Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
      return;
    }

    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนใช้งาน Social Quests');
      navigation.navigate('Login');
      return;
    }

    try {
      console.log('🚀 Navigating to SocialQuests...');
      navigation.navigate('SocialQuests');
    } catch (error) {
      console.error('❌ Error navigating to SocialQuests:', error);
      Alert.alert('ไม่พร้อมใช้งาน', 'Social Quests screen ยังไม่พร้อม');
    }
  };

  // ฟังก์ชันนำทางไปยัง Create Social Quest
  const navigateToCreateSocialQuest = () => {
    if (!navigation || !navigation.navigate) {
      Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
      return;
    }

    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนสร้างเควส');
      navigation.navigate('Login');
      return;
    }

    try {
      console.log('🚀 Navigating to CreateSocialQuest...');
      navigation.navigate('CreateSocialQuest');
    } catch (error) {
      console.error('❌ Error navigating to CreateSocialQuest:', error);
      Alert.alert('ไม่พร้อมใช้งาน', 'Create Social Quest screen ยังไม่พร้อม');
    }
  };

  // ฟังก์ชันนำทางไปยังรายละเอียด Social Quest
  const navigateToSocialQuestDetail = (questId) => {
    if (!navigation || !navigation.navigate) {
      Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
      return;
    }

    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนดูรายละเอียดเควส');
      navigation.navigate('Login');
      return;
    }

    try {
      console.log(`🚀 Navigating to SocialQuestDetail: ${questId}`);
      navigation.navigate('SocialQuestDetail', { questId });
    } catch (error) {
      console.error('❌ Error navigating to SocialQuestDetail:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเปิดรายละเอียดเควสได้');
    }
  };

  // ฟังก์ชันแสดงผู้สร้าง quest
  const renderCreatorAvatar = (creator) => {
    const initials = creator?.name?.substring(0, 2).toUpperCase() || '??';
    const backgroundColor = creator?.avatarColor || '#4a6baf';

    return (
      <View style={[styles.creatorAvatar, { backgroundColor }]}>
        <Text style={styles.creatorAvatarText}>{initials}</Text>
      </View>
    );
  };

  // คำนวณเปอร์เซ็นต์ความคืบหน้า
  const calculateProgress = (completed, target) => {
    if (!target || target === 0) return 0;
    return Math.min((completed / target) * 100, 100);
  };

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data...');

      // Reload social quests และ TikTok เมื่อ refresh
      if (user) {
        await Promise.all([
          loadSocialQuests(),
          checkTikTokConnection(),
          loadTikTokChallenges()
        ]);
      }

      // ใช้ mock data สำหรับส่วนอื่นๆ ตามเดิม
      setTimeout(() => {
        setRegionStats(getFallbackRegionStats());
        setHotQuests(getFallbackHotQuests());

        if (user) {
          setUserStats({
            completedQuests: 12,
            totalPoints: 1560,
            rewardsClaimed: 3
          });
        }

        setLoading(false);
        console.log('✅ Dashboard data loaded');
      }, 300);

    } catch (error) {
      console.error('❌ Error in loadDashboardData:', error.message);
      setLoading(false);
    }
  }, [user]);

  const getFallbackRegionStats = () => {
    return {
      "กลาง": {
        activeQuests: 17,
        popularProvinces: ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี"],
        totalShops: 6,
        trending: "เทรนด์คาเฟ่และร้านอาหารแนวๆ"
      }
    };
  };

  const getFallbackHotQuests = () => {
    return [
      {
        _id: '1',
        name: 'Facebook Check-in',
        rewardAmount: 20,
        province: 'กรุงเทพมหานคร',
      },
      {
        _id: '2',
        name: 'Instagram Story',
        rewardAmount: 25,
        province: 'กรุงเทพมหานคร',
      },
      {
        _id: '3',
        name: 'LINE Share',
        rewardAmount: 15,
        province: 'นนทบุรี',
      }
    ];
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  // ฟังก์ชันสำหรับ navigation ไปยัง Daily Quests
  const navigateToDailyQuests = () => {
    if (!navigation || !navigation.navigate) {
      Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
      return;
    }

    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนใช้งาน Daily Quests');
      navigation.navigate('Login');
      return;
    }

    try {
      console.log('🚀 Navigating to DailyQuests...');
      navigation.navigate('DailyQuests');
    } catch (error) {
      console.error('❌ Error navigating to DailyQuests:', error);
      Alert.alert('ไม่พร้อมใช้งาน', 'Daily Quests screen ยังไม่พร้อม');
    }
  };

  // ฟังก์ชันสำหรับ navigation ไปยัง Explore
  const navigateToExplore = () => {
    if (!navigation || !navigation.navigate) {
      Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
      return;
    }

    if (!user) {
      Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบก่อนสำรวจเควส');
      navigation.navigate('Login');
      return;
    }

    try {
      console.log('🚀 Navigating to ExploreTab...');
      navigation.navigate('ExploreTab');
    } catch (error) {
      console.error('❌ Error navigating to ExploreTab:', error);
      Alert.alert('ไม่พร้อมใช้งาน', 'Explore screen ยังไม่พร้อม');
    }
  };

  // Render TikTok badge for quest cards
  const renderPlatformBadge = (platform) => {
    if (platform === 'tiktok') {
      return (
        <View style={styles.tiktokBadge}>
          <Icon name="video-library" size={10} color="#FFFFFF" />
          <Text style={styles.tiktokBadgeText}>TikTok</Text>
        </View>
      );
    }
    return null;
  };

  if (loading && !dataLoadedRef.current) {
    return (
      <View style={styles.fullLoadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังเตรียมข้อมูล...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* TikTok Connect Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTikTokConnect}
        onRequestClose={() => setShowTikTokConnect(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Icon name="video-library" size={32} color="#EE1D52" />
              <Text style={styles.modalTitle}>เชื่อมต่อ TikTok</Text>
            </View>

            <Text style={styles.modalDescription}>
              เชื่อมต่อบัญชี TikTok ของคุณเพื่อ:
              {"\n"}• เข้าร่วม TikTok Challenges
              {"\n"}• ตรวจสอบอัตโนมัติเมื่อคุณโพสต์วิดีโอ
              {"\n"}• รับคะแนนพิเศษจากกิจกรรม TikTok
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowTikTokConnect(false)}
              >
                <Text style={styles.modalCancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConnectButton]}
                onPress={connectTikTokAccount}
              >
                <Icon name="link" size={20} color="#FFFFFF" />
                <Text style={styles.modalConnectButtonText}>เชื่อมต่อ TikTok</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>ThaiQuestify</Text>
          <Text style={styles.subtitle}>ค้นหาเควสน่าสนใจใกล้คุณ</Text>
        </View>

        <View style={styles.headerRight}>
          {user ? (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => {
                if (navigation && navigation.navigate) {
                  navigation.navigate('Profile');
                } else {
                  Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
                }
              }}
            >
              <Icon name="person" size={28} color="#28a745" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.loginPromptButton}
              onPress={() => {
                if (navigation && navigation.navigate) {
                  navigation.navigate('Login');
                } else {
                  Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
                }
              }}
            >
              <Icon name="login" size={28} color="#6c757d" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            {user ? `ยินดีต้อนรับ, ${user.name}!` : 'ยินดีต้อนรับสู่ ThaiQuestify!'}
          </Text>
          <Text style={styles.welcomeText}>
            {user
              ? `ค้นหาเควสน่าสนใจในพื้นที่ที่คุณต้องการ พร้อมรับรางวัลมากมาย`
              : 'เข้าสู่ระบบเพื่อค้นหาเควสน่าสนใจในพื้นที่ที่คุณต้องการ พร้อมรับรางวัลมากมาย'
            }
          </Text>

          {user && (
            <View style={styles.userStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.completedQuests}</Text>
                <Text style={styles.statLabel}>เควสที่ทำแล้ว</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.totalPoints}</Text>
                <Text style={styles.statLabel}>คะแนนสะสม</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{userStats.rewardsClaimed}</Text>
                <Text style={styles.statLabel}>รางวัลที่ได้รับ</Text>
              </View>
            </View>
          )}
        </View>

        {/* TikTok Challenges Section - NEW */}
        {user && (
          <View style={[styles.socialQuestsSection, { borderLeftColor: '#EE1D52', borderLeftWidth: 4 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Icon name="video-library" size={20} color="#EE1D52" />
                <Text style={[styles.sectionTitle, { color: '#EE1D52', marginLeft: 8 }]}>
                  TikTok Challenges
                </Text>
                {!tiktokConnected && (
                  <TouchableOpacity
                    style={styles.connectTikTokButton}
                    onPress={() => setShowTikTokConnect(true)}
                  >
                    <Icon name="link" size={14} color="#FFFFFF" />
                    <Text style={styles.connectTikTokText}>เชื่อมต่อ</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={navigateToTikTokChallenges}
              >
                <Text style={[styles.seeAllText, { color: '#EE1D52' }]}>ดูทั้งหมด</Text>
                <Icon name="chevron-right" size={16} color="#EE1D52" />
              </TouchableOpacity>
            </View>

            {tiktokLoading ? (
              <View style={styles.socialLoadingContainer}>
                <ActivityIndicator size="small" color="#EE1D52" />
                <Text style={styles.socialLoadingText}>กำลังโหลด TikTok Challenges...</Text>
              </View>
            ) : tiktokQuests.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.socialQuestsScroll}
              >
                {tiktokQuests.map((quest) => {
                  const progress = calculateProgress(quest.completed || 0, quest.target || 1);

                  return (
                    <View key={quest._id} style={[styles.socialQuestCard, { borderColor: '#FFE6EC', borderWidth: 1 }]}>
                      <TouchableOpacity
                        style={styles.socialQuestContent}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('QuestDetails', { questId: quest._id })}
                      >
                        {/* TikTok Platform Badge */}
                        {renderPlatformBadge(quest.platform)}

                        <View style={styles.socialQuestHeader}>
                          {renderCreatorAvatar(quest.creator)}
                          <View style={styles.socialQuestCreatorInfo}>
                            <Text style={styles.creatorName} numberOfLines={1}>
                              {quest.creator?.name || 'แบรนด์'}
                            </Text>
                            <View style={styles.hashtagBadge}>
                              <Icon name="tag" size={10} color="#FFFFFF" />
                              <Text style={styles.hashtagText}>
                                #{quest.hashtag || 'challenge'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.participantsBadge}>
                            <Icon name="people" size={12} color="#666" />
                            <Text style={styles.participantsText}>
                              {quest.participants || 0}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.socialQuestTitle, { color: '#000000' }]} numberOfLines={2}>
                          {quest.title || quest.name}
                        </Text>

                        <Text style={styles.socialQuestDescription} numberOfLines={2}>
                          {quest.description || 'ไม่มีคำอธิบาย'}
                        </Text>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                          <View style={styles.progressLabels}>
                            <Text style={styles.progressText}>
                              {quest.completed || 0}/{quest.target || 1} คน
                            </Text>
                            <Text style={[styles.progressPercent, { color: '#EE1D52' }]}>
                              {Math.round(progress)}%
                            </Text>
                          </View>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  width: `${progress}%`,
                                  backgroundColor: '#EE1D52'
                                }
                              ]}
                            />
                          </View>
                        </View>

                        <View style={styles.socialQuestFooter}>
                          <View style={styles.verificationBadge}>
                            <Icon name="verified" size={12} color="#25F4EE" />
                            <Text style={styles.verificationText}>
                              {quest.verificationType === 'hashtag' ? 'ตรวจสอบอัตโนมัติ' : 'ตรวจสอบด้วยมือ'}
                            </Text>
                          </View>

                          <View style={[styles.rewardBadge, { backgroundColor: '#FFE6EC' }]}>
                            <Icon name="emoji-events" size={12} color="#EE1D52" />
                            <Text style={[styles.rewardText, { color: '#EE1D52' }]}>
                              {quest.reward?.participantPoints || quest.rewardAmount || 0} คะแนน
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.joinButton,
                          quest.isJoined && styles.joinedButton,
                          { backgroundColor: quest.isJoined ? '#E9ECEf' : '#EE1D52' }
                        ]}
                        onPress={() => joinTikTokChallenge(quest._id, quest.title)}
                        disabled={quest.isJoined}
                      >
                        <Text style={[
                          styles.joinButtonText,
                          quest.isJoined && styles.joinedButtonText
                        ]}>
                          {quest.isJoined ? 'เข้าร่วมแล้ว' : 'เข้าร่วมทันที'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noSocialQuestsContainer}>
                <Icon name="video-library" size={40} color="#ccc" />
                <Text style={styles.noSocialQuestsText}>
                  ยังไม่มี TikTok Challenges
                </Text>
                {!tiktokConnected ? (
                  <TouchableOpacity
                    style={[styles.createQuestButton, { backgroundColor: '#EE1D52' }]}
                    onPress={() => setShowTikTokConnect(true)}
                  >
                    <Icon name="link" size={16} color="white" />
                    <Text style={styles.createQuestButtonText}>
                      เชื่อมต่อ TikTok เพื่อเริ่มต้น
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.createQuestButton, { backgroundColor: '#25F4EE' }]}
                    onPress={navigateToTikTokChallenges}
                  >
                    <Icon name="explore" size={16} color="white" />
                    <Text style={styles.createQuestButtonText}>
                      สำรวจ TikTok Challenges
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        {/* Social Quests Section - EXISTING */}
        {user && (
          <View style={styles.socialQuestsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 เควสจากชุมชน</Text>
              <TouchableOpacity
                style={styles.seeAllButton}
                onPress={navigateToSocialQuests}
              >
                <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
                <Icon name="chevron-right" size={16} color="#4a6baf" />
              </TouchableOpacity>
            </View>

            {socialQuestsLoading ? (
              <View style={styles.socialLoadingContainer}>
                <ActivityIndicator size="small" color="#4a6baf" />
                <Text style={styles.socialLoadingText}>กำลังโหลดเควสชุมชน...</Text>
              </View>
            ) : socialQuests.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.socialQuestsScroll}
              >
                {socialQuests.map((quest) => {
                  const progress = calculateProgress(quest.completed || 0, quest.target || 1);

                  return (
                    <View key={quest._id} style={styles.socialQuestCard}>
                      <TouchableOpacity
                        style={styles.socialQuestContent}
                        activeOpacity={0.7}
                        onPress={() => navigateToSocialQuestDetail(quest._id)}
                      >
                        <View style={styles.socialQuestHeader}>
                          {renderCreatorAvatar(quest.creator)}
                          <View style={styles.socialQuestCreatorInfo}>
                            <Text style={styles.creatorName} numberOfLines={1}>
                              {quest.creator?.name || 'สมาชิก'}
                            </Text>
                            <Text style={styles.socialQuestCategory}>
                              {quest.category || 'ทั่วไป'}
                            </Text>
                          </View>
                          <View style={styles.participantsBadge}>
                            <Icon name="people" size={12} color="#666" />
                            <Text style={styles.participantsText}>
                              {quest.participants || 0}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.socialQuestTitle} numberOfLines={2}>
                          {quest.title || quest.name}
                        </Text>

                        <Text style={styles.socialQuestDescription} numberOfLines={2}>
                          {quest.description || 'ไม่มีคำอธิบาย'}
                        </Text>

                        {/* Progress Bar */}
                        <View style={styles.progressContainer}>
                          <View style={styles.progressLabels}>
                            <Text style={styles.progressText}>
                              {quest.completed || 0}/{quest.target || 1} คน
                            </Text>
                            <Text style={styles.progressPercent}>
                              {Math.round(progress)}%
                            </Text>
                          </View>
                          <View style={styles.progressBar}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${progress}%` }
                              ]}
                            />
                          </View>
                        </View>

                        <View style={styles.socialQuestFooter}>
                          <View style={styles.locationBadge}>
                            <Icon name="location-on" size={12} color="#666" />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {quest.location || quest.province || 'หลายพื้นที่'}
                            </Text>
                          </View>

                          <View style={styles.rewardBadge}>
                            <Icon name="emoji-events" size={12} color="#FF6B35" />
                            <Text style={styles.rewardText}>
                              {quest.reward?.participantPoints || quest.rewardAmount || 0} คะแนน
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.joinButton,
                          quest.isJoined && styles.joinedButton
                        ]}
                        onPress={() => joinSocialQuest(quest._id, quest.title)}
                        disabled={quest.isJoined}
                      >
                        <Text style={[
                          styles.joinButtonText,
                          quest.isJoined && styles.joinedButtonText
                        ]}>
                          {quest.isJoined ? 'เข้าร่วมแล้ว' : 'เข้าร่วมทันที'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.noSocialQuestsContainer}>
                <Icon name="group" size={40} color="#ccc" />
                <Text style={styles.noSocialQuestsText}>
                  ยังไม่มีเควสชุมชนในขณะนี้
                </Text>
                <TouchableOpacity
                  style={styles.createQuestButton}
                  onPress={navigateToCreateSocialQuest}
                >
                  <Icon name="add" size={16} color="white" />
                  <Text style={styles.createQuestButtonText}>
                    สร้างเควสแรกของคุณ
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Hot Quests */}
        <View style={styles.hotQuestsSection}>
          <Text style={styles.sectionTitle}>🔥 เควสฮิตประจำวัน</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hotQuestsScroll}
          >
            {hotQuests.map((quest) => (
              <TouchableOpacity
                key={quest._id}
                style={styles.hotQuestCard}
                activeOpacity={0.7}
                onPress={() => {
                  if (!navigation || !navigation.navigate) {
                    Alert.alert('ข้อผิดพลาด', 'ระบบนำทางไม่พร้อมใช้งาน');
                    return;
                  }

                  if (!user) {
                    Alert.alert('กรุณาเข้าสู่ระบบ', 'กรุณาเข้าสู่ระบบเพื่อดูรายละเอียดเควส');
                    navigation.navigate('Login');
                    return;
                  }
                  // ไปหน้าควส (ถ้ามี)
                }}
              >
                <Text style={styles.hotQuestTitle}>{quest.name}</Text>
                <Text style={styles.hotQuestReward}>
                  {quest.rewardAmount} คะแนน
                </Text>
                <Text style={styles.hotQuestLocation}>
                  📍 {quest.province}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions - UPDATED SECTION */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>⚡ เริ่มต้นทันที</Text>

          <View style={styles.quickActionsGrid}>
            {/* Daily Quests Card */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={navigateToDailyQuests}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
                <Icon name="emoji-events" size={28} color="#FF6B35" />
              </View>
              <Text style={styles.quickActionTitle}>Daily Quests</Text>
              <Text style={styles.quickActionDescription}>
                รายได้พิเศษทุกวัน
              </Text>
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>NEW</Text>
              </View>
            </TouchableOpacity>

            {/* Explore Quests Card */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={navigateToExplore}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#E8F4FD' }]}>
                <Icon name="explore" size={28} color="#4a6baf" />
              </View>
              <Text style={styles.quickActionTitle}>สำรวจเควส</Text>
              <Text style={styles.quickActionDescription}>
                ค้นหาเควสใหม่ๆ
              </Text>
            </TouchableOpacity>

            {/* TikTok Challenges Card */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={navigateToTikTokChallenges}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFE6EC' }]}>
                <Icon name="video-library" size={28} color="#EE1D52" />
              </View>
              <Text style={styles.quickActionTitle}>TikTok</Text>
              <Text style={styles.quickActionDescription}>
                Challenges ใหม่
              </Text>
              {user && tiktokQuests.length > 0 && (
                <View style={[styles.badgeContainer, { backgroundColor: '#EE1D52' }]}>
                  <Text style={styles.badgeText}>{tiktokQuests.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* TikTok Connect Promo Banner */}
        {user && !tiktokConnected && (
          <TouchableOpacity
            style={[styles.promoBanner, { borderLeftColor: '#EE1D52', backgroundColor: '#FFE6EC' }]}
            onPress={() => setShowTikTokConnect(true)}
            activeOpacity={0.8}
          >
            <View style={styles.promoContent}>
              <Icon name="video-library" size={32} color="#EE1D52" />
              <View style={styles.promoTextContainer}>
                <Text style={[styles.promoTitle, { color: '#EE1D52' }]}>
                  เชื่อมต่อ TikTok!
                </Text>
                <Text style={styles.promoDescription}>
                  ร่วม TikTok Challenges และรับคะแนนพิเศษ
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#EE1D52" />
            </View>
          </TouchableOpacity>
        )}

        {/* Create Social Quest Promo Banner (แสดงเมื่อล็อกอินแล้ว) */}
        {user && (
          <TouchableOpacity
            style={[styles.promoBanner, { borderLeftColor: '#8A2BE2', backgroundColor: '#F8F5FF' }]}
            onPress={navigateToCreateSocialQuest}
            activeOpacity={0.8}
          >
            <View style={styles.promoContent}>
              <Icon name="add-circle" size={32} color="#8A2BE2" />
              <View style={styles.promoTextContainer}>
                <Text style={[styles.promoTitle, { color: '#5D3FD3' }]}>
                  สร้างเควสของคุณเอง!
                </Text>
                <Text style={styles.promoDescription}>
                  สร้างเควสและรับคะแนนเมื่อมีคนเข้าร่วม
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#8A2BE2" />
            </View>
          </TouchableOpacity>
        )}

        {/* Daily Quests Promo Banner */}
        <TouchableOpacity
          style={styles.promoBanner}
          onPress={navigateToDailyQuests}
          activeOpacity={0.8}
        >
          <View style={styles.promoContent}>
            <Icon name="local-fire-department" size={32} color="#FF6B35" />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>เริ่ม Daily Streak วันนี้!</Text>
              <Text style={styles.promoDescription}>
                ทำเควสรายวันรับคะแนนพิเศษและรักษา Streak
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FF6B35" />
          </View>
        </TouchableOpacity>

        {/* Social Quests Promo Banner (แสดงเมื่อมีเควสชุมชน) */}
        {user && socialQuests.length > 0 && (
          <TouchableOpacity
            style={[styles.promoBanner, { borderLeftColor: '#4a6baf', backgroundColor: '#E8F4FD' }]}
            onPress={navigateToSocialQuests}
            activeOpacity={0.8}
          >
            <View style={styles.promoContent}>
              <Icon name="groups" size={32} color="#4a6baf" />
              <View style={styles.promoTextContainer}>
                <Text style={[styles.promoTitle, { color: '#4a6baf' }]}>
                  เข้าร่วมเควสชุมชน!
                </Text>
                <Text style={styles.promoDescription}>
                  มี {socialQuests.length} เควสชุมชนรอคุณอยู่
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#4a6baf" />
            </View>
          </TouchableOpacity>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            มีร้านค้ามากกว่า 100 ร้านเข้าร่วมโครงการ
          </Text>
          {user && socialQuests.length > 0 && (
            <Text style={styles.footerSocialText}>
              • มี {socialQuests.length} เควสชุมชนให้เข้าร่วม
            </Text>
          )}
          {user && tiktokQuests.length > 0 && (
            <Text style={[styles.footerSocialText, { color: '#EE1D52' }]}>
              • มี {tiktokQuests.length} TikTok Challenges
            </Text>
          )}
          <Text style={styles.footerVersion}>ThaiQuestify v2.1.0 • TikTok Ready</Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

// เพิ่ม StyleSheet สำหรับส่วน TikTok
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  fullLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 20,
    gap: 8,
    maxWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a6baf',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  hotQuestsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hotQuestsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  hotQuestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hotQuestTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  hotQuestReward: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 4,
  },
  hotQuestLocation: {
    fontSize: 11,
    color: '#666',
  },

  // Social Quests Styles
  socialQuestsSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4a6baf',
    marginRight: 4,
  },
  socialLoadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  socialLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  socialQuestsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  socialQuestCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  socialQuestContent: {
    flex: 1,
  },
  socialQuestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  creatorAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialQuestCreatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  socialQuestCategory: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  participantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participantsText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  socialQuestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  socialQuestDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4a6baf',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a6baf',
    borderRadius: 3,
  },
  socialQuestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f3f4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE8D6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '500',
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: '#4a6baf',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinedButton: {
    backgroundColor: '#e9ecef',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  joinedButtonText: {
    color: '#666',
  },
  noSocialQuestsContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noSocialQuestsText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 20,
  },
  createQuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6baf',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createQuestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // TikTok Specific Styles
  connectTikTokButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EE1D52',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  connectTikTokText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  tiktokBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    zIndex: 10,
  },
  tiktokBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  hashtagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  hashtagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 4,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verificationText: {
    fontSize: 10,
    color: '#25F4EE',
    fontWeight: '500',
    marginLeft: 4,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConnectButton: {
    backgroundColor: '#EE1D52',
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalConnectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Quick Actions Section
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '31%', // 3 cards per row with spacing
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    position: 'relative',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 40,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Promo Banner
  promoBanner: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 6,
    borderLeftColor: '#FF6B35',
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoTextContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  promoDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Footer
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSocialText: {
    fontSize: 11,
    color: '#4a6baf',
    marginBottom: 4,
  },
  footerVersion: {
    fontSize: 11,
    color: '#ccc',
  },
});

export default LandingPage;