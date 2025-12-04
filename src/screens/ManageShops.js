// src/screens/ManageShops.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { shopAPI } from '../services/shopService';

const ManageShops = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shops, setShops] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0
  });

  // Fetch shops data
  const fetchShops = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching partner shops...');
      
      const response = await shopAPI.getPartnerShops();
      console.log('✅ Partner shops:', response);
      
      if (response.success) {
        const { shops: shopsData, statistics: stats } = response.data;
        
        setShops(shopsData);
        setStatistics({
          total: stats.totalShops,
          active: stats.activeShops,
          pending: stats.pendingShops,
          rejected: stats.totalShops - stats.activeShops - stats.pendingShops
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching shops:', error);
      Alert.alert('Error', 'Failed to load shops data');
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
    fetchShops();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH');
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

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
        return 'Rejected';
      case 'suspended':
        return 'Suspended';
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Shops</Text>
          <Text style={styles.headerSubtitle}>Partner: {user?.partnerCode}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading shops...</Text>
        </View>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Manage Shops</Text>
          <Text style={styles.headerSubtitle}>Partner: {user?.partnerCode}</Text>
        </View>
        <TouchableOpacity 
          style={styles.newShopButton}
          onPress={() => navigation.navigate('ShopRegister')}
        >
          <Text style={styles.newShopButtonText}>+ New Shop</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statistics.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.activeNumber]}>{statistics.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.pendingNumber]}>{statistics.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, styles.rejectedNumber]}>{statistics.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Shops List */}
      <View style={styles.shopsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            My Shops ({shops.length})
          </Text>
          <TouchableOpacity onPress={fetchShops}>
            <Text style={styles.seeAllText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {shops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No shops registered yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start by registering your first shop to earn commissions
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('ShopRegister')}
            >
              <Text style={styles.emptyStateButtonText}>Register First Shop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          shops.map(shop => (
            <View key={shop.shopId} style={styles.shopCard}>
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shop.shopName}</Text>
                <Text style={styles.shopDetail}>ID: {shop.shopId}</Text>
                <Text style={styles.shopDetail}>
                  {shop.province} {shop.district ? `• ${shop.district}` : ''}
                </Text>
                <Text style={styles.shopDetail}>Type: {shop.shopType}</Text>
                <Text style={styles.shopDetail}>Phone: {shop.phone}</Text>
                <Text style={styles.shopDetail}>
                  Registered: {formatDate(shop.registeredAt)}
                </Text>
                {shop.approvedAt && (
                  <Text style={styles.shopDetail}>
                    Approved: {formatDate(shop.approvedAt)}
                  </Text>
                )}
                {shop.rejectionReason && (
                  <Text style={styles.rejectionReason}>
                    Rejection Reason: {shop.rejectionReason}
                  </Text>
                )}
              </View>
              
              <View style={[styles.statusBadge, getStatusStyle(shop.status)]}>
                <Text style={styles.statusText}>
                  {getStatusText(shop.status)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('ShopRegister')}
        >
          <Text style={styles.primaryButtonText}>Register New Shop</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('PartnerDashboard')}
        >
          <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  newShopButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  newShopButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
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
  activeNumber: {
    color: '#28a745',
  },
  pendingNumber: {
    color: '#ffc107',
  },
  rejectedNumber: {
    color: '#dc3545',
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
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  shopCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  rejectionReason: {
    fontSize: 12,
    color: '#dc3545',
    fontStyle: 'italic',
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
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
  actionsSection: {
    padding: 15,
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ManageShops;