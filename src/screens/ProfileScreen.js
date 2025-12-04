// ProfileScreen.js - ENHANCED BEAUTIFUL VERSION
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
// import LinearGradient from 'react-native-linear-gradient';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileScreen = ({ navigation, route }) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    completedQuests: 0,
    totalPoints: 0,
    rewardsClaimed: 0,
    totalShops: 0,
    activeQuests: 0
  });

  // Redirect to login immediately if no user
  useEffect(() => {
    if (!user) {
      console.log('🚫 No user found in ProfileScreen - redirecting to login');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      return;
    }
    
    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setLoading(false);
      // ใน production ควรดึงข้อมูลสถิติจริงจาก API
      loadUserStats();
    }, 800);
    
    return () => clearTimeout(timer);
  }, [user, navigation]);

  const loadUserStats = async () => {
    // ตัวอย่างการโหลดสถิติผู้ใช้
    // ใน production ควรเรียก API จริง
    const stats = {
      completedQuests: 12,
      totalPoints: 1560,
      rewardsClaimed: 3,
      totalShops: user.userType === 'partner' ? 8 : 0,
      activeQuests: user.userType === 'shop' ? 5 : 0
    };
    setUserStats(stats);
  };

  const handleLogout = async () => {
    try {
      Alert.alert(
        'ยืนยันการออกจากระบบ',
        'คุณแน่ใจว่าต้องการออกจากระบบหรือไม่?',
        [
          {
            text: 'ยกเลิก',
            style: 'cancel',
          },
          {
            text: 'ออกจากระบบ',
            style: 'destructive',
            onPress: async () => {
              console.log('User confirmed logout');
              await signOut();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถออกจากระบบได้');
    }
  };

  // // Navigation functions
  // const navigateToShopDashboard = () => {
  //   console.log('🏪 Navigating to Shop Dashboard');
  //   navigation.navigate('ShopDashboard');
  // };

  // const navigateToPartnerDashboard = () => {
  //   console.log('🤝 Navigating to Partner Dashboard');
  //   navigation.navigate('PartnerDashboard');
  // };

  // const navigateToAdminDashboard = () => {
  //   console.log('👑 Navigating to Admin Dashboard');
  //   navigation.navigate('AdminDashboard');
  // };

  // const navigateToPartnerRegister = () => {
  //   console.log('📝 Navigating to Partner Register');
  //   navigation.navigate('PartnerRegister');
  // };

  // const navigateToUserQuests = () => {
  //   console.log('🎯 Navigating to User Quests');
  //   navigation.navigate('UserQuests');
  // };

  // In ProfileScreen.js - Update the navigation functions
const navigateToShopDashboard = () => {
  console.log('🏪 Navigating to Shop Dashboard');
  // Use navigation.navigate to MainTabs, then DashboardTab
  navigation.navigate('MainTabs', { 
    screen: 'DashboardTab',
    params: { userType: 'shop' }
  });
};

const navigateToPartnerDashboard = () => {
  console.log('🤝 Navigating to Partner Dashboard');
  // Use navigation.navigate to MainTabs, then DashboardTab
  navigation.navigate('MainTabs', { 
    screen: 'DashboardTab',
    params: { userType: 'partner' }
  });
};

const navigateToAdminDashboard = () => {
  console.log('👑 Navigating to Admin Dashboard');
  // Use navigation.navigate to MainTabs, then DashboardTab
  navigation.navigate('MainTabs', { 
    screen: 'DashboardTab',
    params: { userType: 'admin' }
  });
};

const navigateToPartnerRegister = () => {
  console.log('📝 Navigating to Partner Register');
  navigation.navigate('PartnerRegister');
};

const navigateToUserQuests = () => {
  console.log('🎯 Navigating to User Quests');
  navigation.navigate('UserQuests');
};

  // Show loading while checking auth
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังเปลี่ยนหน้า...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังโหลดโปรไฟล์...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4a6baf" barStyle="light-content" />
      
      {/* Header Section with Gradient */}
      <LinearGradient
  colors={['#4a6baf', '#6b8cce']}
  style={styles.horizontalHeader}
>
  <View style={styles.horizontalContent}>
    <View style={styles.avatarWithBadge}>
      <Image 
        source={{ 
          uri: user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ffffff&color=4a6baf&size=70`
        }} 
        style={styles.horizontalAvatar}
      />
      <View style={[styles.floatingBadge, { backgroundColor: getRoleBadgeColor(user.userType) }]}>
        <Icon name={getRoleIcon(user.userType)} size={10} color="white" />
      </View>
    </View>
    
    <View style={styles.horizontalInfo}>
      <Text style={styles.horizontalName} numberOfLines={1}>{user.name}</Text>
      <Text style={styles.horizontalEmail} numberOfLines={1}>{user.email}</Text>
      <View style={styles.horizontalMeta}>
        {user.phone && (
          <View style={styles.compactPhone}>
            <Icon name="phone" size={10} color="rgba(255,255,255,0.8)" />
            <Text style={styles.compactPhoneText}>{user.phone}</Text>
          </View>
        )}
        <Text style={styles.compactMemberSince}>
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('th-TH') : 'ใหม่'}
        </Text>
      </View>
    </View>
  </View>
</LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Statistics Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>📊 สถิติของฉัน</Text>
          
          <View style={styles.statsGrid}>
            {/* User Type Specific Stats */}
            {user.userType === 'shop' && (
              <>
                <StatCard 
                  icon="store" 
                  value={userStats.totalShops} 
                  label="ร้านค้า" 
                  color="#45b7d1"
                />
                <StatCard 
                  icon="assignment-turned-in" 
                  value={userStats.activeQuests} 
                  label="เควสที่เปิด" 
                  color="#4ecdc4"
                />
                <StatCard 
                  icon="trending-up" 
                  value={userStats.completedQuests} 
                  label="เควสสำเร็จ" 
                  color="#96ceb4"
                />
                <StatCard 
                  icon="attach-money" 
                  value={userStats.totalPoints} 
                  label="คะแนน" 
                  color="#ffb347"
                />
              </>
            )}

            {user.userType === 'partner' && (
              <>
                <StatCard 
                  icon="business-center" 
                  value={userStats.totalShops} 
                  label="ร้านค้าในเครือ" 
                  color="#4ecdc4"
                />
                <StatCard 
                  icon="check-circle" 
                  value={Math.floor(userStats.totalShops * 0.8)} 
                  label="ร้านที่เปิด" 
                  color="#96ceb4"
                />
                <StatCard 
                  icon="trending-up" 
                  value={userStats.completedQuests} 
                  label="เควสทั้งหมด" 
                  color="#ffb347"
                />
                <StatCard 
                  icon="show-chart" 
                  value="ดีมาก" 
                  label="ประสิทธิภาพ" 
                  color="#45b7d1"
                />
              </>
            )}

            {user.userType === 'admin' && (
              <>
                <StatCard 
                  icon="admin-panel-settings" 
                  value="ผู้ดูแลระบบ" 
                  label="บทบาท" 
                  color="#ff6b6b"
                />
                <StatCard 
                  icon="people" 
                  value="1,234" 
                  label="ผู้ใช้ทั้งหมด" 
                  color="#4ecdc4"
                />
                <StatCard 
                  icon="store" 
                  value="567" 
                  label="ร้านค้า" 
                  color="#96ceb4"
                />
                <StatCard 
                  icon="security" 
                  value="เต็ม" 
                  label="สิทธิ์การเข้าถึง" 
                  color="#ffb347"
                />
              </>
            )}

            {/* Customer Stats */}
            {user.userType === 'customer' && (
              <>
                <StatCard 
                  icon="emoji-events" 
                  value={userStats.completedQuests} 
                  label="เควสสำเร็จ" 
                  color="#96ceb4"
                />
                <StatCard 
                  icon="star" 
                  value={userStats.totalPoints} 
                  label="คะแนนสะสม" 
                  color="#ffb347"
                />
                <StatCard 
                  icon="card-giftcard" 
                  value={userStats.rewardsClaimed} 
                  label="รางวัลที่ได้รับ" 
                  color="#4ecdc4"
                />
                <StatCard 
                  icon="trending-up" 
                  value="ใหม่" 
                  label="สถานะ" 
                  color="#45b7d1"
                />
              </>
            )}
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>🚀 การดำเนินการด่วน</Text>
          
          <View style={styles.quickActionsGrid}>
            {/* Common actions for all users */}
            <QuickActionButton 
              icon="edit" 
              title="แก้ไขโปรไฟล์" 
              onPress={() => navigation.navigate('EditProfile')}
              color="#4a6baf"
            />
            
            <QuickActionButton 
              icon="settings" 
              title="การตั้งค่า" 
              onPress={() => navigation.navigate('Settings')}
              color="#6c757d"
            />

            {/* Customer specific actions */}
            {user.userType === 'customer' && (
              <>
                <QuickActionButton 
                  icon="assignment" 
                  title="เควสของฉัน" 
                  onPress={navigateToUserQuests}
                  color="#28a745"
                />
                
                <QuickActionButton 
                  icon="business-center" 
                  title="สมัครเป็นพาร์ทเนอร์" 
                  onPress={navigateToPartnerRegister}
                  color="#ff6b6b"
                />
              </>
            )}

            {/* Shop owner actions */}
            {user.userType === 'shop' && (
              <>
                <QuickActionButton 
                  icon="dashboard" 
                  title="แดชบอร์ด" 
                  onPress={navigateToShopDashboard}
                  color="#45b7d1"
                />
                
                <QuickActionButton 
                  icon="add-task" 
                  title="สร้างเควส" 
                  onPress={() => navigation.navigate('ShopCreateQuest')}
                  color="#28a745"
                />
              </>
            )}

            {/* Partner actions */}
            {user.userType === 'partner' && (
              <QuickActionButton 
                icon="dashboard" 
                title="แดชบอร์ดพาร์ทเนอร์" 
                onPress={navigateToPartnerDashboard}
                color="#4ecdc4"
              />
            )}

            {/* Admin actions */}
            {user.userType === 'admin' && (
              <QuickActionButton 
                icon="dashboard" 
                title="แดชบอร์ดแอดมิน" 
                onPress={navigateToAdminDashboard}
                color="#ff6b6b"
              />
            )}
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>⚙️ การตั้งค่าบัญชี</Text>
          
          <MenuButton 
            icon="person" 
            title="ข้อมูลส่วนตัว" 
            onPress={() => navigation.navigate('EditProfile')}
          />
          
          <MenuButton 
            icon="notifications" 
            title="การแจ้งเตือน" 
            onPress={() => {}}
          />
          
          <MenuButton 
            icon="security" 
            title="ความปลอดภัย" 
            onPress={() => {}}
          />
          
          <MenuButton 
            icon="help" 
            title="ช่วยเหลือและสนับสนุน" 
            onPress={() => {}}
          />
          
          <MenuButton 
            icon="info" 
            title="เกี่ยวกับแอป" 
            onPress={() => {}}
          />

          {/* Customer specific menu */}
          {user.userType === 'customer' && (
            <>
              <MenuButton 
                icon="assignment" 
                title="เควสของฉัน" 
                onPress={navigateToUserQuests}
              />
              
              <MenuButton 
                icon="business-center" 
                title="สมัครเป็นพาร์ทเนอร์" 
                onPress={navigateToPartnerRegister}
              />
            </>
          )}

          {/* Shop owner specific menu */}
          {user.userType === 'shop' && (
            <MenuButton 
              icon="dashboard" 
              title="แดชบอร์ดร้านค้า" 
              onPress={navigateToShopDashboard}
            />
          )}

          {/* Partner specific menu */}
          {user.userType === 'partner' && (
            <MenuButton 
              icon="dashboard" 
              title="แดชบอร์ดพาร์ทเนอร์" 
              onPress={navigateToPartnerDashboard}
            />
          )}

          {/* Admin specific menu */}
          {user.userType === 'admin' && (
            <MenuButton 
              icon="dashboard" 
              title="แดชบอร์ดแอดมิน" 
              onPress={navigateToAdminDashboard}
            />
          )}

          {/* Logout Button */}
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LinearGradient
              colors={['#ff6b6b', '#ff8e8e']}
              style={styles.logoutGradient}
            >
              <Icon name="logout" size={20} color="white" />
              <Text style={styles.logoutText}>ออกจากระบบ</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>ThaiQuestify v2.0.0</Text>
          <Text style={styles.copyrightText}>© 2024 All rights reserved</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// Reusable Stat Card Component
const StatCard = ({ icon, value, label, color }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
      <Icon name={icon} size={20} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Reusable Quick Action Button Component
const QuickActionButton = ({ icon, title, onPress, color = '#4a6baf' }) => (
  <TouchableOpacity style={styles.quickActionButton} onPress={onPress}>
    <LinearGradient
      colors={[color + '20', color + '10']}
      style={styles.quickActionGradient}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={20} color="white" />
      </View>
      <Text style={styles.quickActionText}>{title}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// Reusable Menu Button Component
const MenuButton = ({ icon, title, onPress }) => (
  <TouchableOpacity style={styles.menuButton} onPress={onPress}>
    <View style={styles.menuButtonLeft}>
      <View style={styles.menuIconContainer}>
        <Icon name={icon} size={20} color="#4a6baf" />
      </View>
      <Text style={styles.menuButtonText}>{title}</Text>
    </View>
    <Icon name="chevron-right" size={20} color="#ccc" />
  </TouchableOpacity>
);

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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Prompt-Regular',
  },
  header: {
    padding: 25,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  roleBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    gap: 4,
  },
  roleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Prompt-Bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Prompt-Bold',
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Prompt-Regular',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Prompt-Regular',
  },
  memberSince: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
    fontFamily: 'Prompt-Light',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  statsSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    fontFamily: 'Prompt-Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    fontFamily: 'Prompt-Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontFamily: 'Prompt-Regular',
  },
  quickActionsSection: {
    marginBottom: 25,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionButton: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#2c3e50',
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'Prompt-Medium',
  },
  menuSection: {
    marginBottom: 20,
  },
  menuButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  menuButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuButtonText: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'Prompt-Medium',
    flex: 1,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Prompt-Medium',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#bdc3c7',
    fontFamily: 'Prompt-Regular',
  },
  copyrightText: {
    fontSize: 10,
    color: '#bdc3c7',
    marginTop: 4,
    fontFamily: 'Prompt-Light',
  },
  // Design 3: Horizontal Layout
  horizontalHeader: {
    padding: 14,
  },
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWithBadge: {
    position: 'relative',
    marginRight: 12,
  },
  horizontalAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
  },
  floatingBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4a6baf',
  },
  horizontalInfo: {
    flex: 1,
  },
  horizontalName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  horizontalEmail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  horizontalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  compactPhoneText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 4,
  },
  compactMemberSince: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
  },
});

// Helper functions
const getRoleBadgeColor = (userType) => {
  switch (userType) {
    case 'admin': return '#ff6b6b';
    case 'partner': return '#4ecdc4';
    case 'shop': return '#45b7d1';
    case 'customer': return '#96ceb4';
    default: return '#95a5a6';
  }
};

const getRoleIcon = (userType) => {
  switch (userType) {
    case 'admin': return 'admin-panel-settings';
    case 'partner': return 'business-center';
    case 'shop': return 'store';
    case 'customer': return 'person';
    default: return 'help';
  }
};

const getRoleDisplayName = (userType) => {
  switch (userType) {
    case 'admin': return 'ผู้ดูแลระบบ';
    case 'partner': return 'พาร์ทเนอร์';
    case 'shop': return 'เจ้าของร้าน';
    case 'customer': return 'ลูกค้า';
    default: return 'ผู้ใช้';
  }
};

export default ProfileScreen;