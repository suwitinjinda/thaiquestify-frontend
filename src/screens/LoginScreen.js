// src/screens/LoginScreen.js - GOOGLE ONLY (cleaned, same flow)
import React, { useCallback, useEffect, useState } from 'react';
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
  Dimensions,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
 
WebBrowser.maybeCompleteAuthSession();
 
const { width } = Dimensions.get('window');
 
const API_URL = 'https://thaiquestify.com/api';
 
// Keep exactly as your working setup
const REDIRECT_URI_GOOGLE = 'https://thaiquestify.com/auth/google/callback';
const NATIVE_REDIRECT_URI = makeRedirectUri({
  scheme: 'thaiquestify',
  path: 'auth/google',
});
 
// Safe query parsing for deep link URLs
const getParams = (url) => {
  const query = url.split('?')[1];
  if (!query) return {};
  return query.split('&').reduce((acc, kv) => {
    const [k, v] = kv.split('=');
    if (!k) return acc;
    acc[decodeURIComponent(k)] = decodeURIComponent(v || '');
    return acc;
  }, {});
};
 
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue} numberOfLines={2}>
      {value || 'ไม่ระบุ'}
    </Text>
  </View>
);
 
export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
 
  const [isLoading, setIsLoading] = useState(false);
 
  // New user modal
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [userData, setUserData] = useState(null);
  const [tempUser, setTempUser] = useState(null);
 
  // Google request (keep your exact IDs and redirect)
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest(
    {
      expoClientId: '502499639746-gre0812tf2nq1f72tq5j4knh3e4l2704.apps.googleusercontent.com',
      webClientId: '502499639746-gre0812tf2nq1f72tq5j4knh3e4l2704.apps.googleusercontent.com',
      androidClientId: '502499639746-gre0812tf2nq1f72tq5j4knh3e4l2704.apps.googleusercontent.com',
      iosClientId: '502499639746-gre0812tf2nq1f72tq5j4knh3e4l2704.apps.googleusercontent.com',
      redirectUri: REDIRECT_URI_GOOGLE,
    },
    {
      useProxy: false,
      returnUrl: NATIVE_REDIRECT_URI,
    }
  );
 
  useEffect(() => {
    if (googleResponse?.type === 'error') {
      console.error('Google auth error:', googleResponse.error);
      Alert.alert('Google Login Failed', googleResponse.error?.message || 'เกิดข้อผิดพลาด');
    }
  }, [googleResponse]);
 
  const dismissBrowserHard = useCallback(async () => {
    for (let i = 0; i < 3; i += 1) {
      try {
        await WebBrowser.dismissBrowser();
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 120));
      }
    }
  }, []);
 
  useEffect(() => {
    return () => {
      dismissBrowserHard().catch(() => {});
    };
  }, [dismissBrowserHard]);
 
  const handleLoginSuccess = useCallback(
    async (u, token) => {
      try {
        await dismissBrowserHard();
 
        const ok = await signIn(u, token);
        if (!ok) {
          Alert.alert('Error', 'Cannot save login data');
          return false;
        }
 
        // clear modal state
        setShowUserInfo(false);
        setTempUser(null);
        setUserData(null);
 
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
 
        return true;
      } catch (e) {
        console.error('Login success handling error:', e);
        Alert.alert('Error', 'Login failed');
        return false;
      }
    },
    [dismissBrowserHard, navigation, signIn]
  );
 
  const checkAndProcessGoogleUser = useCallback(
    async (u, token, errorStatus) => {
      if (errorStatus === 'user_not_found') {
        setUserData(u);
        setTempUser({ ...u, token });
        setShowUserInfo(true);
        return;
      }
      await handleLoginSuccess(u, token);
    },
    [handleLoginSuccess]
  );
 
  const handleGoogleCodeExchange = useCallback(
    async (code) => {
      setIsLoading(true);
 
      const codeVerifier = googleRequest?.codeVerifier;
      if (!codeVerifier) {
        Alert.alert('Error', 'Missing code verifier. Cannot complete PKCE flow.');
        setIsLoading(false);
        return;
      }
 
      try {
        const apiResponse = await fetch(`${API_URL}/auth/google/exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            redirect_uri: REDIRECT_URI_GOOGLE,
            code_verifier: codeVerifier,
          }),
        });
 
        const data = await apiResponse.json();
 
        if (data?.success) {
          await checkAndProcessGoogleUser(data.user, data.token, data.errorStatus);
        } else {
          throw new Error(data?.message || 'Login failed due to server error.');
        }
      } catch (error) {
        console.error('Google exchange error:', error);
        Alert.alert('Google Login Failed', error.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    },
    [checkAndProcessGoogleUser, googleRequest]
  );
 
  // Deep link listener (GOOGLE ONLY)
  useEffect(() => {
    const sub = Linking.addEventListener('url', async ({ url }) => {
      console.log('Deep link:', url);
 
      // close browser immediately to avoid stuck UI
      await dismissBrowserHard();
 
      // your native redirect pattern
      if (url.startsWith('thaiquestify://auth/google')) {
        const { code, error } = getParams(url);
        if (error || !code) {
          Alert.alert('Google Error', error || 'No code');
          return;
        }
        await handleGoogleCodeExchange(code);
      }
    });
 
    return () => sub.remove();
  }, [dismissBrowserHard, handleGoogleCodeExchange]);
 
  const loginGoogle = async () => {
    try {
      await googlePromptAsync();
    } catch (error) {
      console.error('Google prompt error:', error);
    }
  };
 
  const confirmSaveToDB = async () => {
    if (!tempUser?.token) {
      Alert.alert('Error', 'No access token');
      return;
    }
 
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId: tempUser.googleId,
          email: tempUser.email,
          name: tempUser.name,
          picture: tempUser.photo,
          token: tempUser.token,
        }),
      });
 
      const data = await res.json();
      if (!data?.success) throw new Error(data?.message || 'Save failed');
 
      const ok = await handleLoginSuccess(data.user, data.token);
      if (!ok) throw new Error('Cannot save login data');
    } catch (e) {
      console.error('Save new user error:', e);
      Alert.alert('Error', e.message);
    } finally {
      setIsLoading(false);
    }
  };
 
  const cancelSave = () => {
    setShowUserInfo(false);
    setTempUser(null);
    setUserData(null);
    Alert.alert('Cancelled', 'Save cancelled');
  };
 
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>กำลังเข้าสู่ระบบด้วย Google...</Text>
        <Text style={styles.loadingSubtext}>กรุณารอสักครู่</Text>
 
        <TouchableOpacity style={styles.forceCloseButton} onPress={dismissBrowserHard}>
          <Icon name="close" size={16} color="white" />
          <Text style={styles.forceCloseText}>หากหน้า Login ค้าง ให้กดที่นี่</Text>
        </TouchableOpacity>
      </View>
    );
  }
 
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4285F4" barStyle="light-content" />
 
      <View style={styles.header}>
        <Text style={styles.appName}>ThaiQuestify</Text>
        <Text style={styles.appTagline}>ค้นหาเควส ร่วมกิจกรรม รับรางวัล</Text>
      </View>
 
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <Icon name="emoji-events" size={80} color="#4285F4" style={styles.welcomeIcon} />
          <Text style={styles.welcomeTitle}>ยินดีต้อนรับสู่ ThaiQuestify</Text>
          <Text style={styles.welcomeText}>
            เข้าสู่ระบบเพื่อค้นหาเควสน่าสนใจในพื้นที่ที่คุณต้องการ พร้อมรับรางวัลและสิทธิพิเศษมากมาย
          </Text>
        </View>
 
        <View style={styles.loginSection}>
          <Text style={styles.loginTitle}>เข้าสู่ระบบด้วย Google</Text>
 
          <TouchableOpacity
            style={styles.googleButton}
            onPress={loginGoogle}
            disabled={isLoading || !googleRequest}
          >
            <View style={styles.googleButtonContent}>
              <Icon name="mail" size={24} color="#DB4437" />
              <Text style={styles.googleButtonText}>เข้าสู่ระบบด้วย Google</Text>
            </View>
          </TouchableOpacity>
 
          <View style={styles.benefitsSection}>
            <Text style={styles.benefitsTitle}>ทำไมต้องใช้ Google?</Text>
            <View style={styles.benefitItem}>
              <Icon name="security" size={16} color="#34A853" />
              <Text style={styles.benefitText}>ปลอดภัยด้วยระบบของ Google</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="speed" size={16} color="#4285F4" />
              <Text style={styles.benefitText}>เข้าสู่ระบบเร็วในครั้งต่อไป</Text>
            </View>
            <View style={styles.benefitItem}>
              <Icon name="verified-user" size={16} color="#FBBC05" />
              <Text style={styles.benefitText}>ยืนยันตัวตนอัตโนมัติ</Text>
            </View>
          </View>
 
          <Text style={styles.termsText}>
            เมื่อเข้าสู่ระบบ แสดงว่าคุณยอมรับ <Text style={styles.termsLink}>ข้อกำหนดการใช้งาน</Text> และ{' '}
            <Text style={styles.termsLink}>นโยบายความเป็นส่วนตัว</Text>
          </Text>
        </View>
      </ScrollView>
 
      <Modal animationType="slide" transparent visible={showUserInfo} onRequestClose={() => setShowUserInfo(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>ยินดีต้อนรับ!</Text>
              <Text style={styles.modalSubtitle}>ไม่พบข้อมูลของคุณในระบบ กรุณาตรวจสอบข้อมูลก่อนบันทึก</Text>
 
              {!!userData?.photo && (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: userData.photo }} style={styles.profileImage} resizeMode="cover" />
                </View>
              )}
 
              <View style={styles.infoContainer}>
                <InfoRow label="ชื่อ-นามสกุล" value={userData?.name} />
                <InfoRow label="อีเมล" value={userData?.email} />
                <InfoRow label="Google ID" value={userData?.googleId} />
                <InfoRow label="สถานะ" value="ผู้ใช้ใหม่" />
                <InfoRow label="วิธีการเข้าสู่ระบบ" value="Google" />
              </View>
 
              <View style={styles.noteBox}>
                <Text style={styles.noteTitle}>ข้อมูลนี้จะถูกบันทึก:</Text>
                <Text style={styles.noteText}>• ชื่อและอีเมล</Text>
                <Text style={styles.noteText}>• รูปโปรไฟล์ (ถ้ามี)</Text>
                <Text style={styles.noteText}>• Google ID สำหรับเข้าสู่ระบบในครั้งต่อไป</Text>
              </View>
 
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.confirmButton]}
                  onPress={confirmSaveToDB}
                  disabled={isLoading}
                >
                  {isLoading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.buttonText}>บันทึกและเข้าสู่ระบบ</Text>}
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
 
// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
 
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: { fontSize: 18, color: '#333', marginTop: 20 },
  loadingSubtext: { fontSize: 14, color: '#666', marginTop: 5 },
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
  forceCloseText: { color: 'white', fontSize: 14, fontWeight: '500' },
 
  header: {
    backgroundColor: '#4285F4',
    padding: 25,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  appTagline: { fontSize: 14, color: 'rgba(255,255,255,0.9)', textAlign: 'center' },
 
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
 
  welcomeSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  welcomeIcon: { marginBottom: 20 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  welcomeText: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22 },
 
  loginSection: { marginBottom: 30, alignItems: 'center' },
  loginTitle: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 25, textAlign: 'center' },
 
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    width: '80%',
  },
  googleButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  googleButtonText: { marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#333' },
 
  benefitsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    width: '90%',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  benefitsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  benefitText: { fontSize: 14, color: '#666', marginLeft: 10 },
 
  termsText: { fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 18, marginTop: 20 },
  termsLink: { color: '#4285F4', fontWeight: '500' },
 
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
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
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#4285F4', textAlign: 'center', marginBottom: 5 },
  modalSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
 
  imageContainer: { alignItems: 'center', marginVertical: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#4285F4' },
 
  infoContainer: { marginVertical: 15 },
  infoRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  infoLabel: { width: '40%', fontSize: 16, fontWeight: '600', color: '#333' },
  infoValue: { width: '60%', fontSize: 16, color: '#555' },
 
  noteBox: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, marginVertical: 15, borderLeftWidth: 4, borderLeftColor: '#4285F4' },
  noteTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  noteText: { fontSize: 14, color: '#666', marginBottom: 4 },
 
  buttonContainer: { marginTop: 25 },
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
  confirmButton: { backgroundColor: '#4285F4' },
  cancelButton: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd' },
 
  buttonText: { fontSize: 16, color: 'white', fontWeight: 'bold' },
  cancelButtonText: { fontSize: 16, color: '#666', fontWeight: '600' },
});