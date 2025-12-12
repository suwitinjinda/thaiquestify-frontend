// screens/LoginScreen.js - FINAL REVISED CODE

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Linking, // Import Linking
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import IconFA from 'react-native-vector-icons/FontAwesome';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, ResponseType, exchangeCodeAsync } from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

// ======================= CONFIG =======================
const API_URL = 'https://thaiquestify.com/api';
const FACEBOOK_APP_ID = '1479841916431052';
const redirectUri = 'https://thaiquestify.com/auth/callback';

const discovery = {
  authorizationEndpoint: 'https://www.facebook.com/v20.0/dialog/oauth',
  tokenEndpoint: 'https://graph.facebook.com/v20.0/oauth/access_token',
};

console.log('=== FACEBOOK LOGIN CONFIG (FINAL) ===');
console.log('✅ Redirect URI:', redirectUri);
console.log('✅ Platform:', Platform.OS);
console.log('================================');

// ฟังก์ชันสำหรับ Parse Query String ที่ปลอดภัยจาก Error 'URLSearchParams not implemented'
const getQueryParams = (url) => {
  // ดึง Query String (ส่วนที่อยู่หลัง ?)
  const queryString = url.split('?')[1];
  if (!queryString) return {};

  // แปลง "key=value&key2=value2" เป็น Object { key: value, ... }
  return queryString.split('&').reduce((params, param) => {
    const parts = param.split('=');
    if (parts.length === 2) {
      // ใช้ decodeURIComponent เพื่อจัดการค่าที่มีการเข้ารหัส
      params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }
    return params;
  }, {});
};

// =====================================================
export default function LoginScreen({ navigation }) {
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [debugData, setDebugData] = useState({
    step1: null,
    step2: null,
    finalResult: null,
    errors: []
  });

  // เพิ่ม debug info
  const addDebugInfo = useCallback((step, data, isError = false) => {
    console.log(`🔍 [${step}]`, data);
    setDebugData(prev => ({
      ...prev,
      [step]: data,
      ...(isError && {
        errors: [...prev.errors, { step, data, timestamp: new Date().toISOString() }]
      })
    }));
  }, []);

  // ขั้นตอน 2: ส่ง access_token ไป login จริง
  const finalLoginWithToken = async (accessToken) => {
    console.log('🔐 Finalizing login...');
    try {
      const loginRes = await fetch(`${API_URL}/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ token: accessToken }),
      });
      // ... (Logic การจัดการ Login/Navigation) ...
      const result = await loginRes.json();
      addDebugInfo('finalResult', { url: `${API_URL}/auth/facebook`, status: loginRes.status, response: result });

      if (result.success) {
        console.log('✅ LOGIN SUCCESSFUL!');
        await AsyncStorage.setItem('authToken', result.token);
        await AsyncStorage.setItem('userData', JSON.stringify(result.user));
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        console.error('❌ Final login failed:', result);
        Alert.alert('เข้าสู่ระบบล้มเหลว', result.message || 'ไม่สามารถเข้าสู่ระบบได้');
        setFacebookLoading(false);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถดำเนินการเข้าสู่ระบบได้');
      setFacebookLoading(false);
    }
  };

  // ขั้นตอน 1: ส่ง code ไป backend แลก access_token
  const exchangeCodeForToken = useCallback(async ({ code, state, redirectUri, discovery }) => {
    try {
      console.log('🔄 [CLIENT] Starting exchangeCodeAsync...');

      const tokenResponse = await exchangeCodeAsync(
        {
          clientId: FACEBOOK_APP_ID,
          code: code,
          redirectUri: redirectUri,
          extraParams: { state: state },
        },
        discovery,
      );

      console.log('✅ [CLIENT] Token Exchange Success!');
      const facebookAccessToken = tokenResponse.accessToken;

      await finalLoginWithToken(facebookAccessToken);

    } catch (error) {
      console.error('❌ [CLIENT] Token Exchange Failed:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถแลกเปลี่ยนรหัสเข้าสู่ระบบได้');
      setFacebookLoading(false);
    }
  }, [finalLoginWithToken]);

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: FACEBOOK_APP_ID,
      redirectUri,
      scopes: ['public_profile', 'email'],
      responseType: ResponseType.Code,
      extraParams: { display: 'popup' },
    },
    discovery
  );


  // 🎯 [FIXED] useEffect สำหรับจัดการ Response และ Deep Link
  useEffect(() => {
    // ----------------------------------------------------
    // 1. จัดการ Response จาก useAuthRequest (กรณีปกติ)
    // ----------------------------------------------------
    if (response?.type === 'success' && response.params) {
      console.log('--- CLIENT AUTH RESPONSE RECEIVED (useAuthRequest) ---');
      console.log('Params:', response.params);

      const { code, error, error_description } = response.params;

      if (code) {
        console.log('✅ CLIENT received Code from Backend via useAuthRequest. Initiating Exchange.');
        exchangeCodeForToken({
          code,
          state: response.params.state,
          redirectUri,
          discovery,
          // request, // ไม่จำเป็นสำหรับ exchangeCodeForToken
        });
      } else if (error) {
        const errorMessage = error_description || error;
        Alert.alert("เกิดข้อผิดพลาด", `Error: ${errorMessage}`);
        setFacebookLoading(false);
      }
    }

    // ----------------------------------------------------
    // 2. จัดการ Deep Link โดยตรง (กรณีที่ useAuthRequest ค้าง/ไม่ทำงาน)
    // ----------------------------------------------------

    // ฟังก์ชัน Listener สำหรับรับลิงก์เมื่อแอปกำลังรันอยู่
    const handleDeepLink = ({ url }) => {
      if (url && url.includes('code=')) {
        console.log('🔗 [DEEP LINK] RECEIVED (App Running):', url);

        // **FIX: ใช้ url แทน initialUrl**
        const urlParams = getQueryParams(url);
        const code = urlParams.code;
        const state = urlParams.state;

        if (code) {
          console.log('✅ [DEEP LINK] Found Code! Initiating Exchange via direct link.');
          exchangeCodeForToken({
            code,
            state,
            redirectUri,
            discovery,
          });
        }
      }
    };

    // 🎯 FIX: เรียก getInitialURL ด้วย .then() เพื่อจัดการ Promise และ Error ที่ดีขึ้น
    Linking.getInitialURL()
      .then(initialUrl => {
        if (initialUrl && initialUrl.includes('code=')) {
          console.log('🔗 [DEEP LINK] RECEIVED (Initial URL):', initialUrl);
          const urlParams = getQueryParams(initialUrl);
          const code = urlParams.code;
          const state = urlParams.state;

          if (code) {
            console.log('✅ [DEEP LINK] Found Code! Initiating Exchange via initial link.');
            exchangeCodeForToken({ code, state, redirectUri, discovery });
          }
        }
      })
      .catch(e => {
        console.error('❌ Error calling Linking.getInitialURL:', e.message || e);
      });

    // ลงทะเบียน Listener
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Cleanup listener เมื่อ Component ถูกทำลาย
    return () => {
      subscription.remove();
    };

  }, [response, exchangeCodeForToken, redirectUri, discovery]); // เพิ่ม dependencies ที่ถูกต้อง

  // ... (ส่วนอื่นๆ ของ Component - handleFacebookLogin, testSimpleWebBrowser, formatDebugData)

  // ... (ส่วนอื่นๆ ของ Component - handleFacebookLogin, testSimpleWebBrowser, formatDebugData)

  // ... (การแสดงผล/Return JSX) ...

  // ... (การแสดงผล/Return JSX) ...
  // ... (JSX ของ View และ Styles) ...
  // ... (JSX ของ View และ Styles) ...

  // ... (ต่อด้วย Stylesheet) ...

  // ฟังก์ชันหลักสำหรับ Facebook login
  const handleFacebookLogin = async () => {
    console.log('🔵 Starting Facebook login...');

    // Clear old debug data
    setDebugData({
      step1: null,
      step2: null,
      finalResult: null,
      errors: []
    });

    if (!request) {
      Alert.alert('กำลังเตรียมการ...', 'กรุณารอสักครู่');
      return;
    }

    setFacebookLoading(true);
    addDebugInfo('step1', {
      message: 'Starting Facebook login process',
      timestamp: new Date().toISOString(),
      redirectUri: redirectUri
    });

    try {
      console.log('🌐 Opening Facebook login...');
      console.log('🌐 Using redirect URI:', redirectUri);

      // ใช้ promptAsync โดยไม่กำหนด options มากเกินไป
      await promptAsync();

    } catch (error) {
      console.error('❌ Error opening Facebook login:', error);
      Alert.alert(
        'ไม่สามารถเปิด Facebook ได้',
        error.message || 'กรุณาลองอีกครั้ง'
      );
      setFacebookLoading(false);
    }
  };

  // ฟังก์ชันทดสอบด้วย WebBrowser แบบง่าย
  const testSimpleWebBrowser = async () => {
    console.log('🔵 Testing simple WebBrowser login');
    setFacebookLoading(true);

    try {
      // ใช้ URL แบบง่าย
      const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent('https://thaiquestify.com/auth/callback')}&response_type=code&scope=public_profile,email`;

      console.log('🔗 Simple Auth URL:', authUrl);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'thaiquestify://auth', // 🎯 เปลี่ยนจาก Web URI เป็น App Scheme
        {
          showTitle: false,
          enableBarCollapsing: true,
        }
      );

      console.log('📱 WebBrowser result type:', result.type);

      if (result.type === 'success' && result.url) {
        console.log('✅ Success URL:', result.url);

        // Parse code จาก URL แบบง่าย
        const urlString = result.url;
        const urlParams = getQueryParams(urlString);
        const code = urlParams.code;
        const state = urlParams.state; // WebBrowser อาจจะไม่ส่ง state กลับมา

        if (code) {
          console.log('✅ Got code from WebBrowser');
          exchangeCodeForToken({ code, state, redirectUri, discovery });
        } else {
          Alert.alert('Error', 'No code in response');
          setFacebookLoading(false);
        }
      } else {
        console.log('❌ WebBrowser cancelled or failed');
        Alert.alert('ยกเลิก', 'การเข้าสู่ระบบถูกยกเลิก');
        setFacebookLoading(false);
      }
    } catch (error) {
      console.error('❌ WebBrowser error:', error);
      Alert.alert('Error', error.message);
      setFacebookLoading(false);
    }
  };

  // แสดงข้อมูล debug
  const formatDebugData = (data) => {
    if (!data) return 'No data';
    try {
      const safeData = { ...data };
      // ซ่อนข้อมูล sensitive
      if (safeData.params?.code) {
        safeData.params.code = '***' + safeData.params.code.substring(safeData.params.code.length - 6);
      }
      return JSON.stringify(safeData, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#4a6baf', '#6b8cce', '#8fa8e3']} style={styles.bg}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>ThaiQuestify</Text>
            <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อเริ่มใช้งาน</Text>

            <TouchableOpacity
              style={[styles.fbButton, facebookLoading && styles.buttonDisabled]}
              onPress={handleFacebookLogin}
              disabled={facebookLoading}
            >
              {facebookLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.fbTextLoading}>กำลังดำเนินการ...</Text>
                </View>
              ) : (
                <>
                  <IconFA name="facebook" size={24} color="#fff" />
                  <Text style={styles.fbText}>เข้าสู่ระบบด้วย Facebook</Text>
                </>
              )}
            </TouchableOpacity>

            {/* ปุ่มทดสอบแบบง่าย */}
            <TouchableOpacity
              style={[styles.testButton, facebookLoading && styles.buttonDisabled]}
              onPress={testSimpleWebBrowser}
              disabled={facebookLoading}
            >
              <Text style={styles.testButtonText}>ทดสอบแบบธรรมดา (เปิดในเบราว์เซอร์)</Text>
            </TouchableOpacity>

            {/* DEBUG SECTION */}
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>🔧 ข้อมูล Debug</Text>

              <View style={styles.debugBox}>
                <Text style={styles.debugSubtitle}>การตั้งค่า</Text>
                <Text style={styles.stateText}>Redirect URI: {redirectUri}</Text>
                <Text style={styles.stateText}>แพลตฟอร์ม: {Platform.OS}</Text>
              </View>

              <View style={styles.debugBox}>
                <Text style={styles.debugSubtitle}>สถานะปัจจุบัน</Text>
                <Text style={styles.stateText}>
                  กำลังโหลด: {facebookLoading ? '✅ กำลังดำเนินการ' : '❌ ไม่ได้โหลด'}
                </Text>
                <Text style={styles.stateText}>
                  Response ล่าสุด: {response?.type || 'ยังไม่มี'}
                </Text>
                {response?.params?.error && (
                  <Text style={styles.errorStateText}>
                    ข้อผิดพลาด: {response.params.error}
                  </Text>
                )}
              </View>

              {/* Step Results */}
              {debugData.step1 && (
                <View style={styles.debugBox}>
                  <Text style={styles.debugSubtitle}>ขั้นตอน 1: การตอบกลับจาก Facebook</Text>
                  <ScrollView style={styles.dataScrollView}>
                    <Text style={styles.dataText}>
                      {formatDebugData(debugData.step1)}
                    </Text>
                  </ScrollView>
                </View>
              )}

              {/* Step 2 Result */}
              {debugData.step2 && (
                <View style={styles.debugBox}>
                  <Text style={styles.debugSubtitle}>ขั้นตอน 2: การแลกเปลี่ยนรหัส</Text>
                  <ScrollView style={styles.dataScrollView}>
                    <Text style={styles.dataText}>
                      {formatDebugData(debugData.step2)}
                    </Text>
                  </ScrollView>
                </View>
              )}

              {/* Step 3 Result */}
              {debugData.finalResult && (
                <View style={styles.debugBox}>
                  <Text style={styles.debugSubtitle}>ขั้นตอน 3: การเข้าสู่ระบบขั้นสุดท้าย</Text>
                  <ScrollView style={styles.dataScrollView}>
                    <Text style={styles.dataText}>
                      {formatDebugData(debugData.finalResult)}
                    </Text>
                  </ScrollView>
                </View>
              )}

              {/* คำแนะนำแก้ปัญหา */}
              <View style={styles.troubleshootBox}>
                <Text style={styles.troubleshootTitle}>🛠️ แก้ไขปัญหา "Something went wrong"</Text>
                <Text style={styles.troubleshootText}>
                  หากเห็นข้อความ "Something went wrong" ใน Facebook:
                </Text>
                <Text style={styles.troubleshootText}>1. ตรวจสอบว่า URL นี้ถูกเพิ่มใน Facebook App Settings:</Text>
                <Text style={styles.troubleshootCode}>{redirectUri}</Text>
                <Text style={styles.troubleshootText}>2. ลองใช้ปุ่ม "ทดสอบแบบธรรมดา"</Text>
                <Text style={styles.troubleshootText}>3. ลองลบแอป Facebook และติดตั้งใหม่</Text>
                <Text style={styles.troubleshootText}>4. ลองใช้เครื่องหรือเบราว์เซอร์อื่น</Text>
              </View>

              {/* ปุ่มล้างข้อมูล debug */}
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setDebugData({
                  step1: null,
                  step2: null,
                  finalResult: null,
                  errors: []
                })}
              >
                <Text style={styles.clearButtonText}>ล้างข้อมูล Debug</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  content: {
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  fbButton: {
    backgroundColor: '#1877F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 16,
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fbText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  fbTextLoading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugContainer: {
    width: '100%',
    marginTop: 20,
  },
  debugTitle: {
    color: '#ff8800',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  debugBox: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  debugSubtitle: {
    color: '#29b6f6',
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 14,
  },
  dataScrollView: {
    maxHeight: 150,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 5,
    padding: 10,
  },
  dataText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  stateText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
  },
  errorStateText: {
    color: '#ff4444',
    fontSize: 12,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  troubleshootBox: {
    backgroundColor: 'rgba(255, 87, 34, 0.2)',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ff5722',
  },
  troubleshootTitle: {
    color: '#ff5722',
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 14,
  },
  troubleshootText: {
    color: '#fff',
    fontSize: 11,
    marginBottom: 4,
  },
  troubleshootCode: {
    color: '#ffcc80',
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 5,
    borderRadius: 4,
    marginVertical: 5,
  },
  clearButton: {
    backgroundColor: '#757575',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});