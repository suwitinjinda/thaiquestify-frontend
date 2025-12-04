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

const AdminDashboard = () => {
  const navigation = useNavigation();
  const { user, loading: authLoading } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [statistics, setStatistics] = useState({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    rejectedShops: 0
  });
  const [selectedShop, setSelectedShop] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch shops data
  const fetchShops = async () => {
    if (!user) {
      console.log('👤 No user, skipping shops fetch');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Fetching shops for admin...');
      
      const response = await shopAPI.getAllShops();
      console.log('✅ Admin shops data received');
      
      if (response.success && response.data) {
        setShops(response.data || []);
        
        // Calculate statistics
        const shopData = response.data || [];
        const stats = {
          totalShops: shopData.length,
          activeShops: shopData.filter(shop => shop?.status === 'active').length,
          pendingShops: shopData.filter(shop => shop?.status === 'pending').length,
          rejectedShops: shopData.filter(shop => shop?.status === 'rejected').length
        };
        setStatistics(stats);
      }
      
    } catch (error) {
      console.error('❌ Error fetching shops:', error);
      setShops([]);
      setStatistics({
        totalShops: 0,
        activeShops: 0,
        pendingShops: 0,
        rejectedShops: 0
      });
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShops();
  };

  useEffect(() => {
    if (user && !authLoading) {
      console.log('👤 User loaded, fetching shops:', user.name);
      fetchShops();
    } else if (!user) {
      console.log('👤 User logged out, clearing shops data');
      setShops([]);
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, authLoading]);

  // Safe array access functions
  const getPendingShops = () => {
    return Array.isArray(shops) ? shops.filter(shop => shop?.status === 'pending') : [];
  };

  const getAllShops = () => {
    return Array.isArray(shops) ? shops : [];
  };

  // Approve shop
  const approveShop = async (shopId) => {
    if (!user) {
      Alert.alert('Error', 'Please login to perform this action');
      return;
    }

    try {
      console.log(`✅ Approving shop: ${shopId}`);
      
      const response = await shopAPI.updateShopStatus(shopId, 'active');
      
      if (response.success) {
        Alert.alert('สำเร็จ', 'อนุมัติร้านค้าเรียบร้อยแล้ว');
        fetchShops(); // Refresh data
      } else {
        Alert.alert('ข้อผิดพลาด', response.message || 'ไม่สามารถอนุมัติร้านค้าได้');
      }
      
    } catch (error) {
      console.error('❌ Error approving shop:', error);
      Alert.alert('ข้อผิดพลาด', error.message);
    }
  };

  // Reject shop
  const rejectShop = async (shopId, reason) => {
    if (!user) {
      Alert.alert('Error', 'Please login to perform this action');
      return;
    }

    try {
      console.log(`❌ Rejecting shop: ${shopId}`, reason);
      
      const response = await shopAPI.updateShopStatus(shopId, 'rejected', reason);
      
      if (response.success) {
        Alert.alert('สำเร็จ', 'ปฏิเสธร้านค้าเรียบร้อยแล้ว');
        setModalVisible(false);
        setRejectionReason('');
        setSelectedShop(null);
        fetchShops(); // Refresh data
      } else {
        Alert.alert('ข้อผิดพลาด', response.message || 'ไม่สามารถปฏิเสธร้านค้าได้');
      }
      
    } catch (error) {
      console.error('❌ Error rejecting shop:', error);
      Alert.alert('ข้อผิดพลาด', error.message);
    }
  };

  // Open rejection modal
  const openRejectionModal = (shop) => {
    setSelectedShop(shop);
    setModalVisible(true);
  };

  // Format date for Thai locale
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'รูปแบบวันที่ไม่ถูกต้อง';
    }
  };

  // Get status badge style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return styles.activeBadge;
      case 'pending':
        return styles.pendingBadge;
      case 'rejected':
        return styles.rejectedBadge;
      case 'suspended':
        return styles.suspendedBadge;
      default:
        return styles.pendingBadge;
    }
  };

  // Get status text in Thai
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'เปิดใช้งาน';
      case 'pending':
        return 'รอตรวจสอบ';
      case 'rejected':
        return 'ถูกปฏิเสธ';
      case 'suspended':
        return 'ระงับชั่วคราว';
      default:
        return 'รอตรวจสอบ';
    }
  };

  // Show loading while auth is initializing
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

  // Show login prompt if no user
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
          <Text style={styles.headerSubtitle}>การตรวจสอบร้านค้า</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#dc3545" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูลร้านค้า...</Text>
        </View>
      </View>
    );
  }

  // Use safe array access
  const pendingShops = getPendingShops();
  const allShops = getAllShops();

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
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileText}>โปรไฟล์</Text>
        </TouchableOpacity>
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
          <Text style={styles.statNumber}>{statistics.rejectedShops || 0}</Text>
          <Text style={styles.statLabel}>ถูกปฏิเสธ</Text>
        </View>
      </View>

      {/* Shops Pending Approval */}
      <View style={styles.shopsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            ร้านค้าที่รอการอนุมัติ ({pendingShops.length})
          </Text>
          <TouchableOpacity onPress={fetchShops}>
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
            <View key={shop._id || shop.shopId} style={styles.shopCard}>
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
                  onPress={() => approveShop(shop._id)}
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
      </View>

      {/* All Shops */}
      <View style={styles.shopsSection}>
        <Text style={styles.sectionTitle}>ร้านค้าทั้งหมด ({allShops.length})</Text>
        {allShops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>ไม่มีข้อมูลร้านค้า</Text>
          </View>
        ) : (
          allShops.map(shop => (
            <View key={shop._id || shop.shopId} style={styles.shopCard}>
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
                onPress={() => rejectShop(selectedShop?._id, rejectionReason)}
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
  shopsSection: {
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
  seeAllText: {
    color: '#4a6baf',
    fontSize: 14,
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
});

export default AdminDashboard;