// src/screens/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  Switch,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState({
    totalUsers: 1250,
    totalShops: 89,
    totalPartners: 45,
    totalRevenue: 45200,
    pendingApprovals: 12
  });

  const [pendingPartners, setPendingPartners] = useState([
    {
      id: 1,
      name: 'สมชาย ใจดี',
      phone: '081-234-5678',
      area: 'เชียงใหม่',
      appliedDate: '2024-11-20',
      status: 'pending'
    },
    {
      id: 2,
      name: 'สุนิสา วัฒนา',
      phone: '082-345-6789',
      area: 'กรุงเทพ',
      appliedDate: '2024-11-21',
      status: 'pending'
    }
  ]);

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'shop_registration',
      description: 'ร้านกาแฟน่านฟ้า ลงทะเบียนใหม่',
      timestamp: '2 hours ago',
      partner: 'PT001'
    },
    {
      id: 2,
      type: 'partner_approval',
      description: 'อนุมัติพาร์ทเนอร์: สมชาย ใจดี',
      timestamp: '5 hours ago',
      partner: 'PT045'
    },
    {
      id: 3,
      type: 'quest_completion',
      description: 'ผู้ใช้เสร็จสิ้น quest: เยือนร้านท้องถิ่น',
      timestamp: '1 day ago',
      user: 'U1234'
    }
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleApprovePartner = (partnerId) => {
    Alert.alert(
      'อนุมัติพาร์ทเนอร์',
      'คุณต้องการอนุมัติการสมัครพาร์ทเนอร์นี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'อนุมัติ', 
          onPress: () => {
            setPendingPartners(prev => 
              prev.filter(partner => partner.id !== partnerId)
            );
            setStats(prev => ({
              ...prev,
              pendingApprovals: prev.pendingApprovals - 1,
              totalPartners: prev.totalPartners + 1
            }));
          }
        }
      ]
    );
  };

  const handleRejectPartner = (partnerId) => {
    Alert.alert(
      'ปฏิเสธพาร์ทเนอร์',
      'คุณต้องการปฏิเสธการสมัครพาร์ทเนอร์นี้หรือไม่?',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        { 
          text: 'ปฏิเสธ', 
          style: 'destructive',
          onPress: () => {
            setPendingPartners(prev => 
              prev.filter(partner => partner.id !== partnerId)
            );
            setStats(prev => ({
              ...prev,
              pendingApprovals: prev.pendingApprovals - 1
            }));
          }
        }
      ]
    );
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalShops}</Text>
          <Text style={styles.statLabel}>Total Shops</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.totalPartners}</Text>
          <Text style={styles.statLabel}>Partners</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>฿{stats.totalRevenue}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
      </View>

      {/* Pending Approvals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Pending Approvals</Text>
          <Text style={styles.pendingCount}>{stats.pendingApprovals} รายการ</Text>
        </View>
        
        {pendingPartners.slice(0, 3).map(partner => (
          <View key={partner.id} style={styles.approvalItem}>
            <View style={styles.approvalInfo}>
              <Text style={styles.approvalName}>{partner.name}</Text>
              <Text style={styles.approvalDetails}>
                {partner.area} • {partner.phone}
              </Text>
              <Text style={styles.approvalDate}>
                สมัครเมื่อ: {partner.appliedDate}
              </Text>
            </View>
            <View style={styles.approvalActions}>
              <TouchableOpacity 
                style={styles.approveButton}
                onPress={() => handleApprovePartner(partner.id)}
              >
                <Text style={styles.approveButtonText}>อนุมัติ</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.rejectButton}
                onPress={() => handleRejectPartner(partner.id)}
              >
                <Text style={styles.rejectButtonText}>ปฏิเสธ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {pendingPartners.length > 3 && (
          <TouchableOpacity style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>ดูทั้งหมด ({pendingPartners.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Activities */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activities</Text>
        {recentActivities.map(activity => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Text style={styles.activityIconText}>
                {getActivityIcon(activity.type)}
              </Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityDescription}>
                {activity.description}
              </Text>
              <Text style={styles.activityMeta}>
                {activity.timestamp} • {activity.partner || activity.user}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderPartnersTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.comingSoon}>Partners Management - Coming Soon</Text>
    </View>
  );

  const renderShopsTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.comingSoon}>Shops Management - Coming Soon</Text>
    </View>
  );

  const renderSystemTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.comingSoon}>System Settings - Coming Soon</Text>
    </View>
  );

  const getActivityIcon = (type) => {
    const icons = {
      shop_registration: '🏪',
      partner_approval: '👥',
      quest_completion: '🎯',
      user_registration: '👤',
      payment: '💰'
    };
    return icons[type] || '📝';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Admin Dashboard</Text>
          <Text style={styles.userEmail}>{user?.displayName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => logout()}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'partners' && styles.activeTab]}
            onPress={() => setActiveTab('partners')}
          >
            <Text style={[styles.tabText, activeTab === 'partners' && styles.activeTabText]}>
              Partners
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'shops' && styles.activeTab]}
            onPress={() => setActiveTab('shops')}
          >
            <Text style={[styles.tabText, activeTab === 'shops' && styles.activeTabText]}>
              Shops
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'system' && styles.activeTab]}
            onPress={() => setActiveTab('system')}
          >
            <Text style={[styles.tabText, activeTab === 'system' && styles.activeTabText]}>
              System
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'partners' && renderPartnersTab()}
        {activeTab === 'shops' && renderShopsTab()}
        {activeTab === 'system' && renderSystemTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#4a6baf',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  logoutText: {
    color: 'white',
    fontSize: 12,
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4a6baf',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4a6baf',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6baf',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pendingCount: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
  },
  approvalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  approvalInfo: {
    flex: 1,
  },
  approvalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  approvalDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  approvalDate: {
    fontSize: 12,
    color: '#999',
  },
  approvalActions: {
    flexDirection: 'row',
  },
  approveButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  approveButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  seeAllButton: {
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  seeAllText: {
    color: '#4a6baf',
    fontSize: 14,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityIconText: {
    fontSize: 16,
  },
  activityInfo: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 12,
    color: '#666',
  },
  comingSoon: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
    fontStyle: 'italic',
  },
});

export default AdminDashboard;