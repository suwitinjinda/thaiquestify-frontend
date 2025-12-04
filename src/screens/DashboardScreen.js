import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
    Dimensions,
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalQuests: 0,
    activeQuests: 0,
    completedQuests: 0,
    totalPoints: 0,
    pendingRewards: 0,
    shopCount: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user) {
        // Load user-specific dashboard data
        const response = await api.get(`/users/${user._id}/dashboard`);
        if (response.data.success) {
          setStats(response.data.data);
        }
      } else {
        // Load public dashboard data
        const response = await api.get('/dashboard/public');
        if (response.data.success) {
          setStats(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity 
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const QuickAction = ({ title, icon, color, route, params }) => (
    <TouchableOpacity 
      style={styles.quickAction}
      onPress={() => navigation.navigate(route, params)}
    >
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={20} color="white" />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังโหลดแดชบอร์ด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {user ? `ยินดีต้อนรับ, ${user.name}!` : 'แดชบอร์ด'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {user ? `ตำแหน่ง: ${user.userType || 'ผู้ใช้'}` : 'เข้าสู่ระบบเพื่อดูข้อมูลส่วนตัว'}
          </Text>
        </View>
        {user && (
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Icon name="settings" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ภาพรวม</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="เควสทั้งหมด"
              value={stats.totalQuests}
              icon="assignment"
              color="#4a6baf"
              onPress={() => navigation.navigate('QuestTab')}
            />
            
            <StatCard
              title="เควสที่ทำแล้ว"
              value={stats.completedQuests}
              icon="check-circle"
              color="#28a745"
              onPress={() => navigation.navigate('UserQuests')}
            />
            
            <StatCard
              title="คะแนนสะสม"
              value={stats.totalPoints}
              icon="star"
              color="#ffc107"
              onPress={() => navigation.navigate('WalletTab')}
            />
            
            <StatCard
              title="รางวัลรอรับ"
              value={stats.pendingRewards}
              icon="card-giftcard"
              color="#dc3545"
              onPress={() => navigation.navigate('WalletTab')}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ดำเนินการรวดเร็ว</Text>
          <View style={styles.quickActions}>
            {user ? (
              <>
                {user.userType === 'customer' && (
                  <>
                    <QuickAction
                      title="เควสของฉัน"
                      icon="list-alt"
                      color="#4a6baf"
                      route="UserQuests"
                    />
                    <QuickAction
                      title="ค้นหาเควส"
                      icon="search"
                      color="#28a745"
                      route="ExploreTab"
                    />
                    <QuickAction
                      title="กระเป๋าเงิน"
                      icon="wallet"
                      color="#ffc107"
                      route="WalletTab"
                    />
                    <QuickAction
                      title="โปรไฟล์"
                      icon="person"
                      color="#dc3545"
                      route="Profile"
                    />
                  </>
                )}
                
                {user.userType === 'shop' && (
                  <>
                    <QuickAction
                      title="สร้างเควส"
                      icon="add-circle"
                      color="#4a6baf"
                      route="ShopCreateQuest"
                    />
                    <QuickAction
                      title="จัดการเควส"
                      icon="assignment"
                      color="#28a745"
                      route="ShopDashboard"
                    />
                    <QuickAction
                      title="ดูสถิติ"
                      icon="analytics"
                      color="#ffc107"
                      route="ShopDashboard"
                    />
                    <QuickAction
                      title="ตั้งค่า"
                      icon="settings"
                      color="#dc3545"
                      route="Profile"
                    />
                  </>
                )}
                
                {user.userType === 'admin' && (
                  <>
                    <QuickAction
                      title="จัดการร้านค้า"
                      icon="store"
                      color="#4a6baf"
                      route="ManageShops"
                    />
                    <QuickAction
                      title="เทมเพลตเควส"
                      icon="description"
                      color="#28a745"
                      route="AdminQuestTemplates"
                    />
                    <QuickAction
                      title="ดูสถิติ"
                      icon="analytics"
                      color="#ffc107"
                      route="AdminDashboard"
                    />
                    <QuickAction
                      title="ผู้ใช้งาน"
                      icon="people"
                      color="#dc3545"
                      route="AdminDashboard"
                    />
                  </>
                )}
                
                {user.userType === 'partner' && (
                  <>
                    <QuickAction
                      title="ร้านค้าในเครือ"
                      icon="store"
                      color="#4a6baf"
                      route="ManageShops"
                    />
                    <QuickAction
                      title="ลงทะเบียนร้าน"
                      icon="add-business"
                      color="#28a745"
                      route="ShopRegister"
                    />
                    <QuickAction
                      title="ดูสถิติ"
                      icon="analytics"
                      color="#ffc107"
                      route="PartnerDashboard"
                    />
                    <QuickAction
                      title="รายงาน"
                      icon="assessment"
                      color="#dc3545"
                      route="PartnerDashboard"
                    />
                  </>
                )}
              </>
            ) : (
              // Quick actions for non-logged in users
              <>
                <QuickAction
                  title="เข้าสู่ระบบ"
                  icon="login"
                  color="#4a6baf"
                  route="Login"
                />
                <QuickAction
                  title="สมัครสมาชิก"
                  icon="person-add"
                  color="#28a745"
                  route="Login"
                />
                <QuickAction
                  title="ค้นหาเควส"
                  icon="search"
                  color="#ffc107"
                  route="ExploreTab"
                />
                <QuickAction
                  title="เกี่ยวกับเรา"
                  icon="info"
                  color="#dc3545"
                  route="MainTabs"
                />
              </>
            )}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>กิจกรรมล่าสุด</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#e7f3ff' }]}>
                <Icon name="notifications" size={20} color="#4a6baf" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>มีเควสใหม่ในพื้นที่คุณ</Text>
                <Text style={styles.activityTime}>5 นาทีที่แล้ว</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#d4edda' }]}>
                <Icon name="check-circle" size={20} color="#28a745" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>คุณได้รับรางวัลจากเควส #1234</Text>
                <Text style={styles.activityTime}>2 ชั่วโมงที่แล้ว</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#fff3cd' }]}>
                <Icon name="star" size={20} color="#ffc107" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>คุณได้รับ 50 คะแนน</Text>
                <Text style={styles.activityTime}>1 วันที่แล้ว</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4a6baf',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default DashboardScreen;