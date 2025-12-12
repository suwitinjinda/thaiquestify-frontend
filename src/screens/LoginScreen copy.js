import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  ScrollView,
  RefreshControl 
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { 
    signInWithRealUser, 
    quickLoginByType,
    loading, 
    realUsers, 
    usersLoading,
    fetchRealUsers 
  } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real users on component mount
  useEffect(() => {
    fetchRealUsers();
  }, []);

  const handleRealUserLogin = async (user) => {
    try {
      console.log('👆 Logging in as:', user.name);
      await signInWithRealUser(user);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleQuickLogin = async (userType) => {
    try {
      console.log('🚀 Quick login as:', userType);
      const result = await quickLoginByType(userType);
      
      if (!result.success) {
        console.log('❌ Quick login failed:', result.error);
        // You can show an alert here if needed
      }
    } catch (error) {
      console.error('Quick login failed:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRealUsers();
    setRefreshing(false);
  };

  // Get user type color
  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'admin': return '#dc3545';
      case 'partner': return '#4a6baf';
      case 'shop': return '#28a745';
      case 'customer': return '#ffc107';
      default: return '#666';
    }
  };

  // Get user type display name
  const getUserTypeDisplay = (userType) => {
    switch (userType) {
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'partner': return 'พาร์ทเนอร์';
      case 'shop': return 'ร้านค้า';
      case 'customer': return 'ลูกค้า';
      default: return userType;
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ThaiQuestify</Text>
        <Text style={styles.subtitle}>ระบบจัดการร้านค้า</Text>
      </View>

      {/* Real Users Section */}
      <View style={styles.usersSection}>
        <Text style={styles.sectionTitle}>บัญชีผู้ใช้จากระบบ</Text>
        <Text style={styles.sectionSubtitle}>
          {usersLoading ? 'กำลังโหลด...' : `${realUsers.length} บัญชีผู้ใช้`}
        </Text>

        {usersLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#dc3545" />
            <Text style={styles.loadingText}>กำลังโหลดข้อมูลผู้ใช้...</Text>
          </View>
        ) : realUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>ไม่พบข้อมูลผู้ใช้</Text>
            <Text style={styles.emptyStateSubtext}>
              ลากลงเพื่อรีเฟรชหรือตรวจสอบการเชื่อมต่อ
            </Text>
          </View>
        ) : (
          realUsers.map((user) => (
            <TouchableOpacity 
              key={user._id}
              style={styles.userButton}
              onPress={() => handleRealUserLogin(user)}
              disabled={loading}
            >
              <View style={[styles.userAvatar, { backgroundColor: getUserTypeColor(user.userType) }]}>
                <Text style={styles.userAvatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name}</Text>
                <View style={styles.userDetails}>
                  <Text style={styles.userType}>{getUserTypeDisplay(user.userType)}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
                {user.partnerCode && (
                  <Text style={styles.partnerCode}>รหัสพาร์ทเนอร์: {user.partnerCode}</Text>
                )}
                {user.phone && (
                  <Text style={styles.userPhone}>📞 {user.phone}</Text>
                )}
                <Text style={styles.userStatus}>
                  สถานะ: {user.isActive ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน'}
                </Text>
              </View>
              
              <View style={styles.loginIndicator}>
                {loading ? (
                  <ActivityIndicator size="small" color="#4a6baf" />
                ) : (
                  <Text style={styles.loginText}>เข้าสู่ระบบ</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Login by Type */}
      <View style={styles.quickLoginSection}>
        <Text style={styles.quickLoginTitle}>เข้าสู่ระบบด่วนตามบทบาท</Text>
        <View style={styles.quickLoginButtons}>
          <TouchableOpacity 
            style={[styles.quickButton, styles.adminButton]}
            onPress={() => handleQuickLogin('admin')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.quickButtonText}>ผู้ดูแลระบบ</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickButton, styles.partnerButton]}
            onPress={() => handleQuickLogin('partner')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.quickButtonText}>พาร์ทเนอร์</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickButton, styles.shopButton]}
            onPress={() => handleQuickLogin('shop')}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.quickButtonText}>ร้านค้า</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>ThaiQuestify Admin Panel</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  usersSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  userType: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  userEmail: {
    fontSize: 12,
    color: '#999',
  },
  partnerCode: {
    fontSize: 12,
    color: '#4a6baf',
    fontWeight: '500',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 11,
    color: '#666',
  },
  loginIndicator: {
    paddingHorizontal: 8,
  },
  loginText: {
    color: '#4a6baf',
    fontWeight: '500',
    fontSize: 14,
  },
  quickLoginSection: {
    padding: 16,
    marginTop: 20,
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  adminButton: {
    backgroundColor: '#dc3545',
  },
  partnerButton: {
    backgroundColor: '#4a6baf',
  },
  shopButton: {
    backgroundColor: '#28a745',
  },
  quickButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
  footerVersion: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 4,
  },
});

export default LoginScreen;