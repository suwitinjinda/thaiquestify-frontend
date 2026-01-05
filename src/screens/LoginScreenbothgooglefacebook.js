// ====================================================================
// LoginScreen.js - COMPLETE FIXED VERSION WITH GOOGLE PKCE
// ====================================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Dimensions
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Linking from 'expo-linking';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = '1479841916431052';
const { width } = Dimensions.get('window');
const API_URL = 'https://thaiquestify.com/api';
const REDIRECT_URI = 'https://thaiquestify.com/auth/callback';
const REDIRECT_URI_GOOGLE = 'https://thaiquestify.com/auth/google/callback';

const NATIVE_REDIRECT_URI = makeRedirectUri({
  scheme: 'thaiquestify', // <- CHANGE THIS TO YOUR APP'S SCHEME!
  path: 'auth/google', // The path the server will redirect to
});

const getParams = (url) => {
  try {
    const urlObject = new URL(url);
    return Object.fromEntries(urlObject.searchParams.entries());
  } catch (e) {
    console.error("Failed to parse URL:", e);
    return {};
  }
};

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [userData, setUserData] = useState(null);
  const [tempUser, setTempUser] = useState(null);
  const [loginMethod, setLoginMethod] = useState(''); // 'facebook' or 'google'
  // const [accessToken, setAccessToken] = useState(''); // Unused state, removed from declaration

  // 🔥 สำหรับ Google Login
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    expoClientId: '502499639746-gre0812tf2nq1f72tq5j4knh3e4l2704.apps.googleusercontent.com',
    webClientId: '502499639746-gre0812tf2nq1f72tq5j4knh3e4l2704.apps.googleusercontent.com',
    androidClientId: '502499639746-gre0812tf2nq1f72tq5j4knh3e4l2704.apps.googleusercontent.com',
    iosClientId: '502499639746-gre0812tf2nq1f72tq5j4knh3e4l2704.apps.googleusercontent.com',

    // 🔥 CRITICAL FIX: Use the hardcoded URI for Google, which the server will handle.
    redirectUri: REDIRECT_URI_GOOGLE,
  }, {
    // 🛑 CRITICAL FIX: Tell Expo NOT to use its internal proxy, forcing it to use the redirectUri above
    useProxy: false,

    // IMPORTANT: Tell the auth session where the server will send the code back to 
    // This must match the deep link redirect in your server.js (thaiquestify://auth/google)
    returnUrl: NATIVE_REDIRECT_URI,
  });

  // 🔥 ใช้ useRef ติดตาม browser state
  const browserOpenRef = useRef(false);
  const browserClosingRef = useRef(false);

  // ==================== GOOGLE LOGIN ====================

  // NOTE: We rely on the Linking listener now instead of this useEffect, 
  // but keep it as a fallback for the prompt error type.
  useEffect(() => {
    if (googleResponse?.type === 'error') {
      console.error('Google auth error:', googleResponse.error);
      Alert.alert('Google Login Failed', googleResponse.error?.message || 'เกิดข้อผิดพลาด');
    }
  }, [googleResponse]);

  // 🚨 PKCE FIX: handleGoogleCodeExchange now relies on the googleRequest object 
  const handleGoogleCodeExchange = async (code) => {
    setIsLoading(true);

    // 🔑 1. ดึง Verifier และ URI ที่ใช้ใน Deep Link
    const codeVerifier = googleRequest?.codeVerifier;
    const redirectUri = REDIRECT_URI_GOOGLE;

    // --- L3 DEBUG START: Google Exchange Params ---
    console.log('--- L3 DEBUG: Google Exchange Params (Frontend) ---');
    console.log(`CODE: ${code.substring(0, 10)}... (Length: ${code.length})`);
    console.log(`CODE_VERIFIER: ${codeVerifier ? codeVerifier.substring(0, 10) + '...' : 'MISSING'}`);
    console.log(`REDIRECT_URI_USED_FOR_FETCH: ${redirectUri}`);
    console.log('--------------------------------------------------');
    // --- L3 DEBUG END ---

    if (!codeVerifier) {
      Alert.alert("Error", "Missing code verifier. Cannot complete PKCE flow.");
      setIsLoading(false);
      return;
    }

    try {
      // 2. ส่ง Request ไปยัง Backend API ของคุณ
      const apiResponse = await fetch(`${API_URL}/auth/google/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code,
          redirect_uri: redirectUri, // Backend จะไม่ใช้ค่านี้ แต่อาจต้องการไว้ตรวจสอบ
          code_verifier: codeVerifier,
        }),
      });

      const data = await apiResponse.json();

      console.log('✅ Exchange Data from Backend:', data);

      if (data.success) {
        // Login สำเร็จ
        await checkAndProcessGoogleUser(
          data.user,
          data.token // นี่คือ JWT ของแอปพลิเคชัน
        );
      } else {
        // Backend ส่ง Error กลับมา
        throw new Error(data.message || 'Login failed due to server error.');
      }

    } catch (error) {
      console.error('❌ Google login error:', error);
      Alert.alert('Google Login Failed', error.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAndProcessGoogleUser = async (userData, token, errorStatus) => {
    console.log(userData)
    try {
      if (errorStatus === 'user_not_found') {
        // ผู้ใช้ใหม่: เปิด Modal ยืนยัน
        setUserData(userData);
        setTempUser({
          // ... map fields
          accessToken: token, // ใช้ token ที่ได้จาก backend (อาจเป็น Google token หรือ JWT)
        });
        setShowUserInfo(true);
        setIsLoading(false); // 🚨 ต้องยกเลิกสถานะโหลดก่อนเปิด Modal
      } else {
        // ผู้ใช้เดิม: เข้าสู่ระบบ
        await handleLoginSuccess(userData, token);
        // handleLoginSuccess จะจัดการ setIsLoading(false) เอง
      }
    } catch (e) {
      console.error('❌ Error in processing Google user:', e);
      Alert.alert('Error', e.message);
      setIsLoading(false); // 🚨 ต้องยกเลิกสถานะโหลดถ้ามี Error
    }
  };



  const loginGoogle = async () => {
    setLoginMethod('google');
    try {
      // This call generates the code verifier and stores it in googleRequest
      await googlePromptAsync();
    } catch (error) {
      console.error('Google prompt error:', error);
    }
  };

  // ==================== FACEBOOK LOGIN ====================
  // (Facebook login code เดิมทั้งหมด)

  // ... (Your existing checkAndProcessFacebookUser, fetchFacebookUserData functions)
  // ... (Your existing loginFacebook function)
  // ... (Your existing confirmSaveToDB function, which must handle both fb and google tempUser fields)


  // 🔥 ฟังก์ชันปิด browser ที่ชัดเจน
  const closeAllBrowsers = async () => {
    if (browserClosingRef.current) {
      console.log('⚠️ Already closing browser...');
      return;
    }

    browserClosingRef.current = true;
    console.log('🔒 Attempting to close all browser sessions...');

    try {
      await WebBrowser.dismissBrowser();
      console.log('✅ Browser closed with dismissBrowser');
    } catch (error1) {
      console.log('⚠️ dismissBrowser failed');
    } finally {
      browserOpenRef.current = false;
      browserClosingRef.current = false;
    }
  };

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      const cleanup = async () => {
        try {
          await closeAllBrowsers();
        } catch (e) {
          // ignore
        }
      };
      cleanup();
    };
  }, []);

  // 🚨 CRITICAL: Deep Link Listener (Handles success from BOTH Google and Facebook server redirects)
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      console.log('🔗 Received deep link:', url);

      // NOTE: Keep the WebBrowser cleanup logic here
      // If the browser session is already dismissed by the expo-auth-session's internal listener, 
      // this might throw an error, so we wrap it.
      try {
        await closeEverything();
      } catch (e) {
        // Ignore errors during cleanup
      }


      // ===== GOOGLE (CHECK FIRST) =====
      if (url.startsWith('thaiquestify://auth/google')) {
        const { code, error } = getParams(url);

        // 🛑 CRITICAL: We need the googleRequest object to be populated here. 
        // Since we rely on the Linking listener, the googlePromptAsync must have been called first.

        if (error || !code) {
          Alert.alert('Google Error', error || 'No code');
          return;
        }

        setLoginMethod('google');
        setIsLoading(true);
        // 🔑 PKCE FIX: Call exchange manually with the code
        handleGoogleCodeExchange(code);
        return;
      }

      // ===== FACEBOOK (FALLBACK) =====
      // This is the Facebook logic that was previously handled here
      if (!url.startsWith('thaiquestify://auth')) return; // Ensures it's our scheme

      // Parse parameters for Facebook
      const { code, error } = getParams(url);
      if (error || !code) {
        Alert.alert('Facebook Error', error || 'No code');
        return;
      }

      setLoginMethod('facebook');
      setIsLoading(true);

      try {
        // ... (Your existing Facebook exchange logic)
        const ex = await fetch(`${API_URL}/auth/facebook/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirect_uri: REDIRECT_URI }),
        });

        const exData = await ex.json();
        if (!exData.access_token) throw new Error('No access token');

        const fbUserData = await fetchFacebookUserData(exData.access_token);
        await closeAllBrowsers();
        await checkAndProcessFacebookUser(fbUserData, exData.access_token);
      } catch (e) {
        Alert.alert('Error', e.message);
        setIsLoading(false);
        await closeAllBrowsers();
      }
    });

    return () => sub.remove();
  }, [googleRequest, handleGoogleCodeExchange]); // Add dependencies for Google

  // ... (Your existing closeEverything function)
  const closeEverything = async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await WebBrowser.dismissBrowser();
        break;
      } catch (e) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  };

  // 🔍 ฟังก์ชันเช็ค FacebookID และดำเนินการ
  const checkAndProcessFacebookUser = async (fbUserData, accessToken) => {
    try {
      console.log('🔍 Checking if facebookId exists:', fbUserData.facebookId);

      const res = await fetch(`${API_URL}/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facebookId: fbUserData.facebookId,
          email: fbUserData.email,
          name: fbUserData.name,
          picture: fbUserData.profilePicture,
          token: accessToken
        }),
      });

      const data = await res.json();
      console.log('✅ Backend result:', data);

      if (data.success) {
        await handleLoginSuccess(data.user, data.token);
      } else {
        console.log('⚠️ Backend response:', data.message);

        if (data.error === 'user_not_found') {
          // User ใหม่
          setUserData(fbUserData);
          setTempUser({
            ...fbUserData,
            accessToken: accessToken
          });
          setShowUserInfo(true);
          setIsLoading(false);
        } else {
          throw new Error(data.message || 'Cannot login');
        }
      }

    } catch (error) {
      console.error('❌ Error processing user:', error);
      setUserData(fbUserData);
      setTempUser({
        ...fbUserData,
        accessToken: accessToken
      });
      setShowUserInfo(true);
      setIsLoading(false);
    }
  };

  // ดึงข้อมูลผู้ใช้จาก Facebook Graph API
  const fetchFacebookUserData = async (accessToken) => {
    try {
      const FACEBOOK_FIELDS = [
        'id',
        'name',
        'first_name',
        'last_name',
        'email',
        'picture.type(large)',
        'gender',
        'birthday',
        'link'
      ].join(',');

      const response = await fetch(
        `https://graph.facebook.com/v20.0/me?fields=${FACEBOOK_FIELDS}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error(`Facebook API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        facebookId: data.id,
        name: data.name,
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        email: data.email || `fb_${data.id}@thaiquestify.com`,
        profilePicture: data.picture?.data?.url || null,
        gender: data.gender || 'ไม่ระบุ',
        birthday: data.birthday || 'ไม่ระบุ',
        profileUrl: data.link || `https://www.facebook.com/${data.id}`,
        hasEmail: !!data.email,
        rawData: data
      };
    } catch (error) {
      console.error('Error fetching Facebook data:', error);
      throw error;
    }
  };

  // ฟังก์ชันเข้าสู่ระบบสำเร็จ
  const handleLoginSuccess = async (userData, token) => {
    // console.log(userData)
    try {
      console.log('🔐 Saving login data...');
      console.log(userData)
      console.log('🔐 Google login successful, redirecting to Landing Page...');
      console.log('🔐 ========== GOOGLE LOGIN SUCCESS ==========');
      console.log('📦 1. User Data จาก Backend:', JSON.stringify(userData, null, 2));
      console.log('🔑 2. Token:', token?.substring(0, 50) + '...');
      console.log('🆔 3. Google ID จาก userData:', userData.googleId);
      console.log('📧 4. Email:', userData.email);
      console.log('👤 5. Name:', userData.name);
      console.log('🖼️ 6. Photo:', userData.photo);
      console.log('🎯 7. User Type:', userData.userType);
      console.log('✅ 8. Is Email Verified:', userData.isEmailVerified);
      console.log('📝 9. Signup Method:', userData.signupMethod);
      console.log('📅 10. Created At:', userData.createdAt);
      console.log('🔄 11. Last Login:', userData.lastLogin);
      console.log('📱 12. All Keys:', Object.keys(userData));
      console.log('============================================');

      // ปิดก่อน
      await closeEverything();

      // ใช้ signIn จาก AuthContext
      const success = await signIn(userData, token);

      if (success) {
        console.log('🎉 Login successful!');

        // 🔥 รอให้ browser ปิดสนิท
        await new Promise(resolve => setTimeout(resolve, 300));

        // ปิด modal
        setShowUserInfo(false);
        setTempUser(null);
        setUserData(null);

        // ไปที่ MainTabs
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });

        return true;
      } else {
        console.error('❌ Sign in failed in AuthContext');
        Alert.alert('Error', 'Cannot save login data');
        return false;
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('Error', 'Login failed');
      return false;
    }
  };

  const handleGoogleLoginSuccess = async (userData, token) => {
    try {
      console.log(userData)
      console.log('🔐 Google login successful, redirecting to Landing Page...');
      console.log('🔐 ========== GOOGLE LOGIN SUCCESS ==========');
      console.log('📦 1. User Data จาก Backend:', JSON.stringify(userData, null, 2));
      console.log('🔑 2. Token:', token?.substring(0, 50) + '...');
      console.log('🆔 3. Google ID จาก userData:', userData.googleId);
      console.log('📧 4. Email:', userData.email);
      console.log('👤 5. Name:', userData.name);
      console.log('🖼️ 6. Photo:', userData.photo);
      console.log('🎯 7. User Type:', userData.userType);
      console.log('✅ 8. Is Email Verified:', userData.isEmailVerified);
      console.log('📝 9. Signup Method:', userData.signupMethod);
      console.log('📅 10. Created At:', userData.createdAt);
      console.log('🔄 11. Last Login:', userData.lastLogin);
      console.log('📱 12. All Keys:', Object.keys(userData));
      console.log('============================================');

      // 1. บันทึกข้อมูล Google-specific
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      // 2. บันทึกข้อมูลเพิ่มเติมสำหรับ Google
      await AsyncStorage.setItem('loginMethod', 'google');
      await AsyncStorage.setItem('googleUserId', userData.googleId || '');

      // 3. ใช้ signIn จาก AuthContext
      const success = await signIn(userData, token);

      if (success) {
        console.log('🎉 Google AuthContext signIn successful');

        // 4. ไปที่ Landing Page (HomeTab) โดยตรง
        navigation.replace('MainTabs', {
          screen: 'HomeTab',
          params: {
            justLoggedIn: true,
            loginMethod: 'google',
            timestamp: Date.now(),
            userName: userData.name || 'ผู้ใช้ Google'
          }
        });

        return true;
      } else {
        console.error('❌ Google sign in failed in AuthContext');
        Alert.alert('เข้าสู่ระบบล้มเหลว', 'ไม่สามารถบันทึกข้อมูลการเข้าสู่ระบบได้');
        return false;
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
      return false;
    }
  };

  // เมื่อผู้ใช้ยืนยันบันทึกข้อมูล (กรณี user ใหม่)
  const confirmSaveToDB = async () => {
    if (!tempUser?.accessToken) {
      Alert.alert('Error', 'No access token');
      return;
    }

    setIsLoading(true);
    try {
      console.log('💾 Saving new user to database...');

      const endpoint = loginMethod === 'facebook'
        ? `${API_URL}/auth/facebook`
        : `${API_URL}/auth/google`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Use common fields where possible, or check loginMethod
          facebookId: tempUser.facebookId, // Will be undefined for Google, which is fine
          googleId: tempUser.googleId, // Will be undefined for Facebook
          email: tempUser.email,
          name: tempUser.name,
          picture: tempUser.profilePicture,
          token: tempUser.accessToken
        }),
      });

      const data = await res.json();
      console.log('✅ Save result:', data);

      if (!data.success) throw new Error(data.message);

      const loginSuccess = await handleLoginSuccess(data.user, data.token);

      if (!loginSuccess) {
        throw new Error('Cannot save login data');
      }

    } catch (e) {
      console.error('❌ Save error:', e);
      Alert.alert('Error', e.message);
      setIsLoading(false);
    }
  };

  const loginFacebook = async () => {
    setLoginMethod('facebook');

    if (browserOpenRef.current) {
      console.log('⚠️ Browser already open, closing first...');
      await closeAllBrowsers();
    }

    const SCOPES = ['email', 'public_profile'].join(',');

    // NOTE: Uses REDIRECT_URI which should be the general server callback for FB
    const authUrl =
      `https://www.facebook.com/v20.0/dialog/oauth` +
      `?client_id=${FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(SCOPES)}`;

    try {
      console.log('🌐 Opening Facebook login...');
      browserOpenRef.current = true;
      await WebBrowser.openBrowserAsync(authUrl);
    } catch (error) {
      console.error('WebBrowser error:', error);
      browserOpenRef.current = false;
    }
  };

  const cancelSave = () => {
    setShowUserInfo(false);
    setTempUser(null);
    setUserData(null);
    Alert.alert('Cancelled', 'Save cancelled');
  };

  // 🔥 แสดง loading screen พิเศษ
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>
          {loginMethod === 'google' ? 'กำลังเข้าสู่ระบบด้วย Google...' : 'กำลังเข้าสู่ระบบด้วย Facebook...'}
        </Text>
        <Text style={styles.loadingSubtext}>กรุณารอสักครู่</Text>

        <TouchableOpacity
          style={styles.forceCloseButton}
          onPress={closeAllBrowsers}
        >
          <Icon name="close" size={16} color="white" />
          <Text style={styles.forceCloseText}>
            หากหน้า Login ค้าง ให้กดที่นี่
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1877F2" barStyle="light-content" />

      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.appName}>ThaiQuestify</Text>
        <Text style={styles.appTagline}>ค้นหาเควส ร่วมกิจกรรม รับรางวัล</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Icon name="emoji-events" size={80} color="#4a6baf" style={styles.welcomeIcon} />
          <Text style={styles.welcomeTitle}>ยินดีต้อนรับสู่ ThaiQuestify</Text>
          <Text style={styles.welcomeText}>
            เข้าสู่ระบบเพื่อค้นหาเควสน่าสนใจในพื้นที่ที่คุณต้องการ
            พร้อมรับรางวัลและสิทธิพิเศษมากมาย
          </Text>
        </View>

        {/* Login Options */}
        <View style={styles.loginOptions}>
          <Text style={styles.loginTitle}>เลือกวิธีการเข้าสู่ระบบ</Text>

          {/* 🔥 ปุ่มแนวนอน Google + Facebook */}
          <View style={styles.socialButtonsRow}>
            {/* Google Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.googleButton]}
              onPress={loginGoogle}
              disabled={isLoading || !googleRequest} // Disable if request object isn't ready
            >
              <Icon name="mail" size={24} color="#DB4437" />
              <Text style={styles.googleButtonText}>
                Google
              </Text>
            </TouchableOpacity>

            {/* Facebook Button */}
            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={loginFacebook}
              disabled={isLoading}
            >
              <Icon name="facebook" size={24} color="white" />
              <Text style={styles.facebookButtonText}>
                Facebook
              </Text>
            </TouchableOpacity>
          </View>

          {/* 🚨 ลบ Email Login ออกไป */}
        </View>

        {/* Terms & Privacy */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            เมื่อเข้าสู่ระบบ แสดงว่าคุณยอมรับ{' '}
            <Text style={styles.termsLink}>ข้อกำหนดการใช้งาน</Text>{' '}
            และ{' '}
            <Text style={styles.termsLink}>นโยบายความเป็นส่วนตัว</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Modal แสดงข้อมูลผู้ใช้ใหม่ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showUserInfo}
        onRequestClose={() => setShowUserInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>ยินดีต้อนรับ! 👋</Text>
              <Text style={styles.modalSubtitle}>ไม่พบข้อมูลของคุณในระบบ กรุณาตรวจสอบข้อมูลก่อนบันทึก</Text>

              {/* รูปโปรไฟล์ */}
              {userData?.profilePicture && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: userData.profilePicture }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {/* ข้อมูลผู้ใช้ */}
              <View style={styles.infoContainer}>
                <InfoRow label="ชื่อ-นามสกุล" value={userData?.name} />
                <InfoRow label="อีเมล" value={userData?.email} />
                <InfoRow label={loginMethod === 'facebook' ? 'Facebook ID' : 'Google ID'}
                  value={userData?.facebookId || userData?.googleId} />
                <InfoRow label="สถานะ" value="ผู้ใช้ใหม่" />
                <InfoRow label="วิธีการเข้าสู่ระบบ" value={loginMethod === 'facebook' ? 'Facebook' : 'Google'} />
              </View>

              {/* คำอธิบาย */}
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>ข้อมูลนี้จะถูกบันทึก:</Text>
                <Text style={styles.noteText}>• ชื่อและอีเมล</Text>
                <Text style={styles.noteText}>• รูปโปรไฟล์ (ถ้ามี)</Text>
                <Text style={styles.noteText}>• {loginMethod === 'facebook' ? 'Facebook ID' : 'Google ID'} สำหรับเข้าสู่ระบบในครั้งต่อไป</Text>
              </View>

              {/* ปุ่มดำเนินการ */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={confirmSaveToDB}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.buttonText}>บันทึกและเข้าสู่ระบบ</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={cancelSave}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Component ย่อย
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue} numberOfLines={2}>
      {value || 'ไม่ระบุ'}
    </Text>
  </View>
);

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  forceCloseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 30,
    gap: 8,
  },
  forceCloseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#1877F2',
    padding: 25,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  welcomeIcon: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginOptions: {
    marginBottom: 30,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  // 🔥 ปุ่มแนวนอน
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  facebookButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  // ลบส่วน email button และ footer links ออก
  termsSection: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#4a6baf',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1877F2',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#1877F2',
  },
  infoContainer: {
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    width: '40%',
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoValue: {
    width: '60%',
    fontSize: 16,
    color: '#555',
  },
  noteBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#1877F2',
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 25,
  },
  actionButton: {
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButton: {
    backgroundColor: '#1877F2',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});