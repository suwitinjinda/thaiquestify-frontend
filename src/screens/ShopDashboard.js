// src/screens/ShopDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Image, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { shopAPI } from '../services/shopService';
import { userAPI } from '../services/userService1';

const ShopDashboard = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showShopSelector, setShowShopSelector] = useState(false);
  const [quests, setQuests] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    activeQuests: 0,
    completedQuests: 0,
    customerSatisfaction: 0,
    totalBalance: 0
  });

  useEffect(() => {
    if (user) {
      loadUserShops();
    }
  }, [user]);

  const loadUserShops = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading shops for user:', user.email, user.userType);
      
      let userShops = [];
      
      if (user.userType === 'shop') {
        // สำหรับ shop owner: ดึงร้านค้าของตัวเอง
        const response = await shopAPI.getShops();
        if (response.success) {
          // console.log(response.data)
          userShops = response.data || [];
          console.log('✅ Found shops for shop owner:', userShops.length);
        }
      } else if (user.userType === 'admin') {
        // สำหรับ admin: ดึงร้านค้าทั้งหมดหรือร้านที่เกี่ยวข้อง
        const allShopsResponse = await shopAPI.getQuestsByShopId();
        if (allShopsResponse.success) {
          userShops = allShopsResponse.data || [];
          console.log('✅ Found all shops for admin:', userShops.length);
        }
      } else if (user.userType === 'partner') {
        // สำหรับ partner: ดึงร้านค้าที่ partner ดูแล
        const partnerShopsResponse = await shopAPI.getPartnerShops();
        if (partnerShopsResponse.success) {
          userShops = partnerShopsResponse.data.shops || [];
          console.log('✅ Found shops for partner:', userShops.length);
        }
      }

      setShops(userShops);
      
      // เลือกร้านแรกเป็น default หรือให้ผู้ใช้เลือก
      if (userShops.length > 0) {
        if (userShops.length === 1) {
          // ถ้ามีร้านเดียวให้เลือกอัตโนมัติ
          setSelectedShop(userShops[0]);
          loadShopData(userShops[0]);
        } else {
          // ถ้ามีหลายร้านให้แสดงตัวเลือก
          setShowShopSelector(true);
        }
      } else {
        // ไม่มีร้านค้า
        Alert.alert(
          'No Shops Found',
          user.userType === 'shop' 
            ? 'You are not associated with any shop. Please contact administrator.'
            : 'No shops available for your account.',
          [{ text: 'OK' }]
        );
      }
      
    } catch (error) {
      console.error('❌ Error loading shops:', error);
      Alert.alert('Error', 'Failed to load shop data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadShopData = async (shop) => {
  console.log(shop)
  try {
    console.log('🔄 Loading data for shop:', shop.shopName);
    setSelectedShop(shop);
    
    // ✅ Use the new method that expects shop ID
    const questsResponse = await shopAPI.getQuestsByShopId(shop.shopId);
    console.log(questsResponse)
    
    if (questsResponse.success) {
      setQuests(questsResponse.data || []);
    }
    
  } catch (error) {
    console.error('Error loading shop quests:', error);
    throw error;
  }
  };  
  

  const onRefresh = () => {
    setRefreshing(true);
    if (selectedShop) {
      loadShopData(selectedShop);
    } else {
      loadUserShops();
    }
  };

  const handleShopSelect = (shop) => {
    setShowShopSelector(false);
    loadShopData(shop);
  };

  const createNewQuest = () => {
    if (!selectedShop) {
      Alert.alert('Error', 'Please select a shop first');
      return;
    }
    console.log("mm:",selectedShop)
    navigation.navigate('ShopCreateQuest', { shopId: selectedShop._id, shId: selectedShop.shopId ,shName: selectedShop.shopName});
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('th-TH');
  };

  const getQuestStatusStyle = (status) => {
    switch (status) {
      case 'active': return styles.activeStatus;
      case 'paused': return styles.pausedStatus;
      case 'completed': return styles.completedStatus;
      default: return styles.draftStatus;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>Loading shop data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <TouchableOpacity style={styles.header} onPress={handleProfilePress}>
        <Image 
          source={{ uri: user?.photo || 'https://via.placeholder.com/50' }} 
          style={styles.avatar} 
        />
        <View style={styles.headerText}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userRole}>
            {user?.userType === 'admin' ? 'Administrator' : 
             user?.userType === 'partner' ? 'Partner' : 'Shop Owner'}
          </Text>
          {selectedShop && (
            <Text style={styles.shopName}>🏪 {selectedShop.shopName}</Text>
          )}
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.profileText}>Profile →</Text>
        </View>
      </TouchableOpacity> */}

      {/* Shop Selector Button */}
      {shops.length > 1 && (
        <TouchableOpacity 
          style={styles.shopSelector}
          onPress={() => setShowShopSelector(true)}
        >
          <Text style={styles.shopSelectorText}>
            🏪 Switch Shop ({shops.length} available)
          </Text>
        </TouchableOpacity>
      )}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedShop ? (
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>
                {stats.totalBalance.toLocaleString()} THB
              </Text>
              <View style={styles.shopInfo}>
                <Text style={styles.shopInfoText}>
                  📍 {selectedShop.province} • 🆔 {selectedShop.shopId}
                </Text>
                <Text style={styles.shopInfoText}>
                  📞 {selectedShop.phone} • {selectedShop.status}
                </Text>
              </View>
            </View>

            {/* Stats Overview */}
            <Text style={styles.sectionTitle}>Shop Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>฿{stats.totalEarnings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Spent</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.activeQuests}</Text>
                <Text style={styles.statLabel}>Active Quests</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.completedQuests}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.customerSatisfaction}/5</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
            </View>

            {/* Quest Management */}
            <View style={styles.questSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Quests ({quests.length})</Text>
                <TouchableOpacity style={styles.createButton} onPress={createNewQuest}>
                  <Text style={styles.createButtonText}>+ Create Quest</Text>
                </TouchableOpacity>
              </View>

              {quests.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateTitle}>No Quests Yet</Text>
                  <Text style={styles.emptyStateText}>
                    Create your first quest to engage with customers
                  </Text>
                  <TouchableOpacity 
                    style={styles.createFirstButton}
                    onPress={createNewQuest}
                  >
                    <Text style={styles.createFirstButtonText}>Create First Quest</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                quests.map(quest => (
                  <TouchableOpacity 
                    key={quest._id} 
                    style={styles.questCard}
                    onPress={() => navigation.navigate('QuestDetails', { questId: quest._id })}
                  >
                    <View style={styles.questHeader}>
                      <Text style={styles.questTitle}>{quest.name}</Text>
                      <View style={[styles.statusBadge, getQuestStatusStyle(quest.status)]}>
                        <Text style={styles.statusText}>{quest.status}</Text>
                      </View>
                    </View>
                    
                    <Text style={styles.questDescription} numberOfLines={2}>
                      {quest.description}
                    </Text>

                    <View style={styles.questStats}>
                      <Text style={styles.questStat}>
                        💰 Budget: ฿{quest.budget?.toLocaleString()}
                      </Text>
                      <Text style={styles.questStat}>
                        👥 Participants: {quest.currentParticipants || 0}/{quest.maxParticipants}
                      </Text>
                      <Text style={styles.questStat}>
                        📅 Created: {formatDate(quest.createdAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        ) : (
          <View style={styles.noShopContainer}>
            <Text style={styles.noShopTitle}>No Shop Selected</Text>
            <Text style={styles.noShopText}>
              Please select a shop to view dashboard
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Shop Selection Modal */}
      <Modal
        visible={showShopSelector}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowShopSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Shop</Text>
            <Text style={styles.modalSubtitle}>
              Choose a shop to manage ({shops.length} available)
            </Text>
            
            <FlatList
              data={shops}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.shopItem}
                  onPress={() => handleShopSelect(item)}
                >
                  <View style={styles.shopItemInfo}>
                    <Text style={styles.shopItemName}>{item.shopName}</Text>
                    <Text style={styles.shopItemDetails}>
                      🆔 {item.shopId} • 📍 {item.province}
                    </Text>
                    <Text style={styles.shopItemStatus}>
                      Status: {item.status} • 📞 {item.phone}
                    </Text>
                  </View>
                  <Text style={styles.selectArrow}>→</Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowShopSelector(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  welcome: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 12,
    color: '#4a6baf',
    fontWeight: '600',
    marginTop: 2,
  },
  shopName: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  headerIcon: {
    padding: 8,
  },
  profileText: {
    color: '#4a6baf',
    fontWeight: '600',
    fontSize: 14,
  },
  shopSelector: {
    backgroundColor: '#e3f2fd',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4a6baf',
  },
  shopSelectorText: {
    color: '#4a6baf',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#4a6baf',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  balanceLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  shopInfo: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
  },
  shopInfoText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a6baf',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  questSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  questCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeStatus: {
    backgroundColor: '#28a745',
  },
  pausedStatus: {
    backgroundColor: '#ffc107',
  },
  completedStatus: {
    backgroundColor: '#6c757d',
  },
  draftStatus: {
    backgroundColor: '#17a2b8',
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  questStats: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  questStat: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  createFirstButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noShopContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  noShopTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  noShopText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  shopItemInfo: {
    flex: 1,
  },
  shopItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  shopItemDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  shopItemStatus: {
    fontSize: 11,
    color: '#999',
  },
  selectArrow: {
    fontSize: 18,
    color: '#4a6baf',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ShopDashboard;