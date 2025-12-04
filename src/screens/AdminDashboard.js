// src/screens/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { shopAPI } from '../services/shopService';
import { questTemplateAPI } from '../services/questTemplateService';

const AdminDashboard = () => {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shops'); // 'shops' or 'quests'
  const [shops, setShops] = useState([]);
  const [quests, setQuests] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [statistics, setStatistics] = useState({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    rejectedShops: 0,
    totalQuests: 0,
    activeQuests: 0,
    pendingQuests: 0
  });
  const [selectedShop, setSelectedShop] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch all data
  const fetchData = async () => {
    if (!user) {
      console.log('👤 No user, skipping data fetch');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Fetching admin data...');
      
      // Fetch shops
      const shopsResponse = await shopAPI.getAllShops();
      console.log('✅ Shops data received');
      
      if (shopsResponse.success && shopsResponse.data) {
        setShops(shopsResponse.data || []);
        
        // Calculate shop statistics
        const shopData = shopsResponse.data || [];
        const shopStats = {
          totalShops: shopData.length,
          activeShops: shopData.filter(shop => shop?.status === 'active').length,
          pendingShops: shopData.filter(shop => shop?.status === 'pending').length,
          rejectedShops: shopData.filter(shop => shop?.status === 'rejected').length
        };
        
        // Update statistics with shop data
        setStatistics(prev => ({
          ...prev,
          ...shopStats
        }));
      }

      // TODO: Fetch quests data when you have the API
      // const questsResponse = await questAPI.getAllQuests();
      // if (questsResponse.success) {
      //   setQuests(questsResponse.data || []);
      //   // Calculate quest statistics...
      // }
      
    } catch (error) {
      console.error('❌ Error fetching admin data:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  useEffect(() => {
    if (user && !authLoading) {
      console.log('👤 User loaded, fetching admin data:', user.name);
      fetchData();
    } else if (!user) {
      console.log('👤 User logged out, clearing data');
      setShops([]);
      setQuests([]);
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, authLoading]);

  // Shop Management Functions
  const approveShop = async (shop) => {
    if (!user) {
      Alert.alert('Error', 'Please login to perform this action');
      return;
    }

    try {
      console.log(`✅ Approving shop:`, shop);
      
      const response = await shopAPI.updateShopStatus(shop._id, 'active');
      
      if (response.success) {
        Alert.alert('สำเร็จ', 'อนุมัติร้านค้าเรียบร้อยแล้ว');
        fetchData(); // Refresh all data
      } else {
        Alert.alert('ข้อผิดพลาด', response.message || 'ไม่สามารถอนุมัติร้านค้าได้');
      }
      
    } catch (error) {
      console.error('❌ Error approving shop:', error);
      Alert.alert('ข้อผิดพลาด', error.message);
    }
  };

  const rejectShop = async (shop, reason) => {
    if (!user) {
      Alert.alert('Error', 'Please login to perform this action');
      return;
    }

    try {
      console.log(`❌ Rejecting shop:`, shop);
      
      const response = await shopAPI.updateShopStatus(shop._id, 'rejected', reason);
      
      if (response.success) {
        Alert.alert('สำเร็จ', 'ปฏิเสธร้านค้าเรียบร้อยแล้ว');
        setModalVisible(false);
        setRejectionReason('');
        setSelectedShop(null);
        fetchData(); // Refresh all data
      } else {
        Alert.alert('ข้อผิดพลาด', response.message || 'ไม่สามารถปฏิเสธร้านค้าได้');
      }
      
    } catch (error) {
      console.error('❌ Error rejecting shop:', error);
      Alert.alert('ข้อผิดพลาด', error.message);
    }
  };

  const openRejectionModal = (shop) => {
    setSelectedShop(shop);
    setModalVisible(true);
  };

  // Quest Management Functions (Placeholder - to be implemented)
  const approveQuest = async (quest) => {
    Alert.alert('Info', 'Quest approval functionality coming soon');
  };

  const rejectQuest = async (quest) => {
    Alert.alert('Info', 'Quest rejection functionality coming soon');
  };

  // Utility Functions
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'รูปแบบวันที่ไม่ถูกต้อง';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active': return styles.activeBadge;
      case 'pending': return styles.pendingBadge;
      case 'rejected': return styles.rejectedBadge;
      case 'suspended': return styles.suspendedBadge;
      default: return styles.pendingBadge;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'เปิดใช้งาน';
      case 'pending': return 'รอตรวจสอบ';
      case 'rejected': return 'ถูกปฏิเสธ';
      case 'suspended': return 'ระงับชั่วคราว';
      default: return 'รอตรวจสอบ';
    }
  };

  // Safe array access
  const getPendingShops = () => {
    return Array.isArray(shops) ? shops.filter(shop => shop?.status === 'pending') : [];
  };

  // Loading States
  if (authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>กำลังโหลด...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc3545" />
          <Text style={styles.loadingText}>กำลังเตรียมข้อมูล...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>ต้องการการยืนยันตัวตน</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>กรุณาเข้าสู่ระบบเพื่อใช้งานฟังก์ชันผู้ดูแลระบบ</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>ไปที่หน้าเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>ระบบจัดการ</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc3545" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      </View>
    );
  }

  const pendingShops = getPendingShops();

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
  <View>
    <Text style={styles.headerTitle}>Admin Dashboard</Text>
    <Text style={styles.headerSubtitle}>
      ยินดีต้อนรับ, {user?.name || 'Admin'}
    </Text>
    <Text style={styles.userEmail}>{user?.email}</Text>
  </View>
  
  <View style={styles.headerButtons}>
    {/* <TouchableOpacity 
      style={styles.managementButton}
      onPress={() => navigation.navigate('AdminQuestTemplates')}
    >
      <Text style={styles.managementButtonText}>📋 Templates</Text>
    </TouchableOpacity> */}
    
    <TouchableOpacity 
      style={styles.profileButton}
      onPress={() => navigation.navigate('Profile')}
    >
      <Text style={styles.profileText}>โปรไฟล์</Text>
    </TouchableOpacity>
  </View>
</View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.totalShops || 0}</Text>
          <Text style={styles.statLabel}>ร้านค้าทั้งหมด</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.activeShops || 0}</Text>
          <Text style={styles.statLabel}>ร้านที่เปิดใช้งาน</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.pendingNumber]}>{statistics.pendingShops || 0}</Text>
          <Text style={styles.statLabel}>รอตรวจสอบ</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.totalQuests || 0}</Text>
          <Text style={styles.statLabel}>เควสทั้งหมด</Text>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'shops' && styles.activeTab]}
          onPress={() => setActiveTab('shops')}
        >
          <Text style={[styles.tabText, activeTab === 'shops' && styles.activeTabText]}>
            🏪 จัดการร้านค้า
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'quests' && styles.activeTab]}
          onPress={() => setActiveTab('quests')}
        >
          <Text style={[styles.tabText, activeTab === 'quests' && styles.activeTabText]}>
            🎯 จัดการเควส
          </Text>
        </TouchableOpacity>
      </View>

      {/* Shop Management Section */}
      {activeTab === 'shops' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              ร้านค้าที่รอการอนุมัติ ({pendingShops.length})
            </Text>
            <TouchableOpacity onPress={fetchData}>
              <Text style={styles.seeAllText}>รีเฟรช</Text>
            </TouchableOpacity>
          </View>

          {pendingShops.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>ไม่มีร้านค้าที่รอการอนุมัติ</Text>
              <Text style={styles.emptyStateSubtext}>ทุกร้านค้าได้รับการตรวจสอบแล้ว</Text>
            </View>
          ) : (
            pendingShops.map(shop => (
              <View key={shop._id} style={styles.shopCard}>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{shop.shopName}</Text>
                  <Text style={styles.shopDetail}>รหัสร้าน: {shop.shopId}</Text>
                  <Text style={styles.shopDetail}>ประเภท: {shop.shopType}</Text>
                  <Text style={styles.shopDetail}>ที่ตั้ง: {shop.province} {shop.district}</Text>
                  <Text style={styles.shopDetail}>ที่อยู่: {shop.address}</Text>
                  <Text style={styles.shopDetail}>โทร: {shop.phone}</Text>
                  <Text style={styles.shopDetail}>เวลาทำการ: {shop.businessHours}</Text>
                  <Text style={styles.shopDetail}>
                    วันที่ลงทะเบียน: {formatDate(shop.registeredAt)}
                  </Text>
                  <Text style={styles.shopDetail}>
                    พาร์ทเนอร์: {shop.partnerCode} ({shop.partnerId?.name || 'N/A'})
                  </Text>
                  {shop.description && (
                    <Text style={styles.shopDescription}>คำอธิบาย: {shop.description}</Text>
                  )}
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.approveButton}
                    onPress={() => approveShop(shop)}
                  >
                    <Text style={styles.approveButtonText}>อนุมัติ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.rejectButton}
                    onPress={() => openRejectionModal(shop)}
                  >
                    <Text style={styles.rejectButtonText}>ปฏิเสธ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* All Shops */}
          <View style={styles.subSection}>
            <Text style={styles.subSectionTitle}>ร้านค้าทั้งหมด ({shops.length})</Text>
            {shops.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>ไม่มีข้อมูลร้านค้า</Text>
              </View>
            ) : (
              shops.map(shop => (
                <View key={shop._id} style={styles.shopCard}>
                  <View style={styles.shopInfo}>
                    <Text style={styles.shopName}>{shop.shopName}</Text>
                    <Text style={styles.shopDetail}>รหัส: {shop.shopId} • {shop.province}</Text>
                    <Text style={styles.shopDetail}>โทร: {shop.phone} • {shop.shopType}</Text>
                    <View style={[styles.statusBadge, getStatusStyle(shop.status)]}>
                      <Text style={styles.statusText}>
                        {getStatusText(shop.status)}
                      </Text>
                    </View>
                    {shop.rejectionReason && (
                      <Text style={styles.rejectionReason}>เหตุผล: {shop.rejectionReason}</Text>
                    )}
                    <Text style={styles.shopDetail}>
                      อัปเดตล่าสุด: {formatDate(shop.updatedAt)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* Quest Management Section */}
      {activeTab === 'quests' && (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>การจัดการเควส</Text>
        <TouchableOpacity onPress={fetchData}>
          <Text style={styles.seeAllText}>รีเฟรช</Text>
        </TouchableOpacity>
      </View>

      {/* Quest Management Cards */}
      <View style={styles.managementCards}>
        {/* Quest Templates Card */}
        <TouchableOpacity 
          style={styles.managementCard}
          onPress={() => navigation.navigate('AdminQuestTemplates')}
        >
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>📋</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Quest Templates</Text>
            <Text style={styles.cardDescription}>
              จัดการเทมเพลตเควสสำหรับร้านค้า
            </Text>
            <Text style={styles.cardStats}>
              {templates.length} Templates Available
            </Text>
          </View>
          <View style={styles.cardArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Coming Soon Features */}
        <View style={styles.comingSoonCard}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>🚧</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Quest Approvals</Text>
            <Text style={styles.cardDescription}>
              อนุมัติ/ปฏิเสธเควสจากร้านค้า
            </Text>
            <Text style={styles.comingSoonBadge}>เร็วๆ นี้</Text>
          </View>
        </View>

        <View style={styles.comingSoonCard}>
          <View style={styles.cardIconContainer}>
            <Text style={styles.cardIcon}>📊</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Quest Analytics</Text>
            <Text style={styles.cardDescription}>
              ดูสถิติและรายงานเควส
            </Text>
            <Text style={styles.comingSoonBadge}>เร็วๆ นี้</Text>
          </View>
        </View>
      </View>
      

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>{templates.length}</Text>
          <Text style={styles.quickStatLabel}>เทมเพลตทั้งหมด</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>
            {templates.filter(t => t.isActive).length}
          </Text>
          <Text style={styles.quickStatLabel}>เทมเพลตที่ใช้งาน</Text>
        </View>
        <View style={styles.quickStat}>
          <Text style={styles.quickStatNumber}>0</Text>
          <Text style={styles.quickStatLabel}>เควสรออนุมัติ</Text>
        </View>
      </View>
    </View>
  )}

      {/* Rejection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ปฏิเสธร้านค้า</Text>
            <Text style={styles.modalSubtitle}>
              {selectedShop?.shopName} (รหัส: {selectedShop?.shopId})
            </Text>
            
            <Text style={styles.modalLabel}>เหตุผลในการปฏิเสธ:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="กรุณาระบุเหตุผลในการปฏิเสธ..."
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setRejectionReason('');
                  setSelectedShop(null);
                }}
              >
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmRejectButton]}
                onPress={() => rejectShop(selectedShop, rejectionReason)}
                disabled={!rejectionReason.trim()}
              >
                <Text style={styles.confirmRejectButtonText}>ยืนยันการปฏิเสธ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#dc3545',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  userEmail: {
    fontSize: 12,
    color: 'white',
    opacity: 0.8,
    marginTop: 2,
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  profileText: {
    color: 'white',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    backgroundColor: 'white',
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: '45%',
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
  pendingNumber: {
    color: '#ffc107',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#dc3545',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  section: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  subSection: {
    marginTop: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4a6baf',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  shopCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  shopDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  shopDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
    lineHeight: 18,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  activeBadge: {
    backgroundColor: '#28a745',
  },
  pendingBadge: {
    backgroundColor: '#ffc107',
  },
  rejectedBadge: {
    backgroundColor: '#dc3545',
  },
  suspendedBadge: {
    backgroundColor: '#6c757d',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  rejectionReason: {
    fontSize: 12,
    color: '#dc3545',
    fontStyle: 'italic',
    marginTop: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  approveButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  approveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  comingSoonContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffc107',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  placeholderSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  placeholderItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginLeft: 10,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    margin: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  confirmRejectButton: {
    backgroundColor: '#dc3545',
  },
  confirmRejectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  managementCards: {
  marginBottom: 20,
},
managementCard: {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  borderLeftWidth: 4,
  borderLeftColor: '#4a6baf',
},
comingSoonCard: {
  backgroundColor: '#f8f9fa',
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  flexDirection: 'row',
  alignItems: 'center',
  borderLeftWidth: 4,
  borderLeftColor: '#6c757d',
  opacity: 0.7,
},
cardIconContainer: {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: '#e3f2fd',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 16,
},
cardIcon: {
  fontSize: 20,
},
cardContent: {
  flex: 1,
},
cardTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 4,
},
cardDescription: {
  fontSize: 14,
  color: '#666',
  marginBottom: 4,
},
cardStats: {
  fontSize: 12,
  color: '#4a6baf',
  fontWeight: '500',
},
comingSoonBadge: {
  fontSize: 11,
  color: '#dc3545',
  fontWeight: '600',
  backgroundColor: '#ffeaea',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 10,
  alignSelf: 'flex-start',
},
cardArrow: {
  padding: 8,
},
arrowText: {
  fontSize: 18,
  color: '#4a6baf',
  fontWeight: 'bold',
},
quickStats: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
quickStat: {
  alignItems: 'center',
  flex: 1,
},
quickStatNumber: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#4a6baf',
  marginBottom: 4,
},
quickStatLabel: {
  fontSize: 12,
  color: '#666',
  textAlign: 'center',
  },
headerButtons: {
  flexDirection: 'row',
  alignItems: 'center',
},
managementButton: {
  backgroundColor: 'rgba(255,255,255,0.2)',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
  marginRight: 8,
},
managementButtonText: {
  color: 'white',
  fontSize: 12,
  fontWeight: '500',
  },
// Partner Management Styles
  partnerCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  partnerDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  partnerStats: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 8,
  },
  partnerStat: {
    fontSize: 12,
    color: '#4a6baf',
    marginRight: 15,
    fontWeight: '500',
  },
  partnerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  activateButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  activateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  deactivateButton: {
    backgroundColor: '#ffc107',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  deactivateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  resetButton: {
    backgroundColor: '#17a2b8',
    padding: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  inactiveBadge: {
    backgroundColor: '#6c757d',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  quickActionButton: {
    backgroundColor: '#4a6baf',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#28a745',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminDashboard;