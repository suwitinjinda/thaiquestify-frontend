// src/screens/ProfileScreen.js - Simplified (Account Info + TikTok Connect)
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Share,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import TikTokConnectCard from '../components/integrations/TikTokConnectCard';
 
export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
 
  const COLORS = useMemo(
    () => ({
      primary: '#6C63FF',
      light: '#F7F9FC',
      danger: '#FF6B8B',
      google: '#DB4437',
    }),
    []
  );
 
  const isGoogleUser = !!(user?.googleId || user?.signupMethod === 'google');
 
  const getProfileImageUri = useCallback(() => {
    if (user?.photo) return user.photo;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
      user?.email || 'user'
    )}&backgroundColor=6C63FF`;
  }, [user]);
 
  const shareProfile = useCallback(async () => {
    try {
      await Share.share({
        message: `ชวนเพื่อนมาเล่น ThaiQuestify!\n\nชื่อ: ${user?.name || '-'}\nอีเมล: ${user?.email || '-'}`,
        title: 'ThaiQuestify',
      });
    } catch (e) {
      console.error('Share error:', e);
    }
  }, [user]);
 
  const handleLogout = useCallback(() => {
    Alert.alert('ออกจากระบบ?', 'คุณแน่ใจที่จะออกจากระบบหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          await signOut();
          setLoading(false);
          navigation.replace('Login');
        },
      },
    ]);
  }, [navigation, signOut]);
 
  if (!user) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.light }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 16, color: '#666' }}>กรุณาเข้าสู่ระบบ</Text>
      </View>
    );
  }
 
  return (
    <View style={[styles.container, { backgroundColor: COLORS.light }]}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />
 
      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: getProfileImageUri() }} style={styles.avatar} />
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isGoogleUser ? COLORS.google : COLORS.primary },
              ]}
            >
              <Icon name={isGoogleUser ? 'mail' : 'person'} size={12} color="#fff" />
            </View>
          </View>
 
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name || 'ผู้ใช้ใหม่'}</Text>
            <Text style={styles.userEmail}>{user.email || 'ไม่มีอีเมล'}</Text>
          </View>
 
          <TouchableOpacity style={styles.shareButton} onPress={shareProfile}>
            <Icon name="share" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
 
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Connections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔗 เชื่อมต่อบัญชีสำหรับทำเควส</Text>
          <Text style={styles.sectionSubtitle}>เชื่อมต่อเพื่อให้ระบบดึงข้อมูลไปตรวจสอบเควส</Text>
 
          <TikTokConnectCard />
        </View>
 
        {/* ข้อมูลบัญชี (kept) */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>📋 ข้อมูลบัญชี</Text>
 
          <View style={styles.infoRow}>
            <Icon name="person" size={18} color={COLORS.primary} />
            <Text style={styles.infoLabel}>ชื่อผู้ใช้</Text>
            <Text style={styles.infoValue}>{user.name || '-'}</Text>
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
              {user.userType === 'customer'
                ? 'ลูกค้า'
                : user.userType === 'partner'
                ? 'พาร์ทเนอร์'
                : user.userType === 'shop'
                ? 'ร้านค้า'
                : 'ผู้ใช้'}
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
 
        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: COLORS.danger }]}
          onPress={handleLogout}
          disabled={loading}
        >
          <Icon name="logout" size={20} color="#fff" />
          <Text style={styles.logoutText}>{loading ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</Text>
        </TouchableOpacity>
 
        <View style={styles.footer}>
          <Text style={styles.version}>ThaiQuestify</Text>
        </View>
      </ScrollView>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
 
  header: {
    paddingTop: 60,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center' },
 
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: 'white' },
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
 
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  userEmail: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
 
  shareButton: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
 
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
 
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3047', marginBottom: 8 },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 20 },
 
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoCardTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3047', marginBottom: 20 },
 
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 15,
  },
  infoLabel: { fontSize: 14, color: '#666', flex: 1 },
  infoValue: { fontSize: 14, color: '#2D3047', fontWeight: '500' },
 
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: { color: 'white', fontSize: 16, fontWeight: '600' },
 
  footer: { alignItems: 'center', padding: 10 },
  version: { fontSize: 12, color: '#999' },
});