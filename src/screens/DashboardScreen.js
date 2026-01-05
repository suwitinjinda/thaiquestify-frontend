// src/screens/DashboardScreen.js - FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const DashboardScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading dashboard data...');

      // ❌ หยุดเรียก API ที่ไม่มี
      // const response = await fetch('https://thaiquestify.com/api/dashboard');

      // ✅ ใช้ mock data เท่านั้น
      setTimeout(() => {
        const mockData = getMockDashboardData(user?.userType);
        setDashboardData(mockData);
        setLoading(false);
        console.log('✅ Dashboard loaded with mock data');
      }, 500);

    } catch (error) {
      console.error('❌ Error loading dashboard:', error);

      // Fallback to mock data
      const mockData = getMockDashboardData(user?.userType);
      setDashboardData(mockData);
      setLoading(false);
    }
  };

  const getMockDashboardData = (userType) => {
    // Mock data สำหรับ user ทุกประเภท
    const baseData = {
      totalQuests: 24,
      activeQuests: 8,
      completedQuests: 16,
      totalPoints: 1250,
      recentActivities: [
        { id: 1, title: 'Facebook Check-in สำเร็จ', points: 100, time: '2 ชั่วโมงที่แล้ว' },
        { id: 2, title: 'รีวิวร้านอาหาร', points: 150, time: '1 วันที่แล้ว' },
        { id: 3, title: 'เข้าร่วมกิจกรรม', points: 50, time: '2 วันที่แล้ว' },
      ]
    };

    switch (userType) {
      case 'shop':
        return {
          ...baseData,
          shopStats: {
            totalShops: 1,
            activeCampaigns: 3,
            totalParticipants: 45,
            revenue: 12500
          },
          userType: 'shop'
        };

      case 'partner':
        return {
          ...baseData,
          partnerStats: {
            partnerShops: 8,
            activeShops: 6,
            totalRevenue: 85000,
            commission: 8500
          },
          userType: 'partner'
        };

      case 'admin':
        return {
          ...baseData,
          adminStats: {
            totalUsers: 1234,
            totalShops: 567,
            activeQuests: 89,
            systemHealth: 'ดี'
          },
          userType: 'admin'
        };

      default: // customer
        return {
          ...baseData,
          customerStats: {
            questsCompleted: 12,
            currentRank: 'Explorer',
            nextRank: 'Adventurer',
            pointsToNextRank: 250
          },
          userType: 'customer'
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังโหลดแดชบอร์ด...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>แดชบอร์ด</Text>
        <Text style={styles.subtitle}>
          {user ? `สวัสดี, ${user.name}!` : 'ยินดีต้อนรับ'}
        </Text>
      </View>

      {/* Stats Cards */}
      {dashboardData && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Icon name="assignment" size={24} color="#4a6baf" />
            <Text style={styles.statNumber}>{dashboardData.totalQuests}</Text>
            <Text style={styles.statLabel}>เควสทั้งหมด</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="check-circle" size={24} color="#28a745" />
            <Text style={styles.statNumber}>{dashboardData.completedQuests}</Text>
            <Text style={styles.statLabel}>สำเร็จแล้ว</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="trending-up" size={24} color="#ffb347" />
            <Text style={styles.statNumber}>{dashboardData.totalPoints}</Text>
            <Text style={styles.statLabel}>คะแนน</Text>
          </View>
        </View>
      )}

      {/* User Type Specific Content */}
      {user?.userType === 'customer' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📈 ความคืบหน้าของคุณ</Text>
          <View style={styles.progressCard}>
            <Text style={styles.progressText}>ระดับปัจจุบัน: Explorer</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '65%' }]} />
            </View>
            <Text style={styles.progressSubtext}>เหลืออีก 250 คะแนนเพื่อเลื่อนขั้น</Text>
          </View>
        </View>
      )}

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 กิจกรรมล่าสุด</Text>
        {dashboardData?.recentActivities?.map(activity => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Icon name="check" size={20} color="#28a745" />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
            <Text style={styles.activityPoints}>+{activity.points} pts</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 การดำเนินการด่วน</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('QuestTab')}
          >
            <Icon name="search" size={24} color="#4a6baf" />
            <Text style={styles.quickActionText}>ค้นหาเควส</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Icon name="person" size={24} color="#4a6baf" />
            <Text style={styles.quickActionText}>โปรไฟล์</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>อัปเดตล่าสุด: วันนี้</Text>
        <Text style={styles.footerVersion}>Dashboard v1.0</Text>
      </View>
    </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a6baf',
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#666',
  },
  activityCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e7f3ff',
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
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  activityPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  footerVersion: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 4,
  },
});

export default DashboardScreen;