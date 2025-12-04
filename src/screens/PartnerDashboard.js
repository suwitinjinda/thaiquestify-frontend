// src/screens/PartnerDashboard.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { shopAPI } from '../services/shopService';

const PartnerDashboard = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState({
    totalShops: 0,
    activeShops: 0,
    totalCommission: 0,
    pendingShops: 0
  });
  
  const [shops, setShops] = useState([]);
  const [commissionData, setCommissionData] = useState({
    thisMonth: 0,
    lastMonth: 0,
    totalEarned: 0
  });

  // Fetch partner data
  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching partner dashboard data...');
      
      // Fetch dashboard statistics
      const dashboardResponse = await shopAPI.getPartnerDashboard();
      console.log('✅ Dashboard data:', dashboardResponse);
      
      if (dashboardResponse.success) {
        const { statistics, recentShops, partnerInfo } = dashboardResponse.data;
        
        setPerformance({
          totalShops: statistics.totalShops,
          activeShops: statistics.activeShops,
          totalCommission: statistics.totalCommission,
          pendingShops: statistics.pendingShops
        });
        
        setShops(recentShops.map(shop => ({
          id: shop.shopId,
          name: shop.shopName,
          status: shop.status,
          location: shop.province,
          registeredAt: shop.registeredAt
        })));

        setCommissionData({
          thisMonth: statistics.totalCommission * 0.3, // Mock calculation
          lastMonth: statistics.totalCommission * 0.7, // Mock calculation
          totalEarned: statistics.totalCommission
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching partner data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch shops list
  const fetchShops = async () => {
    try {
      console.log('🔄 Fetching partner shops...');
      const shopsResponse = await shopAPI.getPartnerShops();
      console.log('✅ Shops data:', shopsResponse);
      
      if (shopsResponse.success) {
        const { shops: shopsData, statistics } = shopsResponse.data;
        
        setShops(shopsData.map(shop => ({
          id: shop.shopId,
          name: shop.shopName,
          status: shop.status,
          location: shop.province,
          phone: shop.phone,
          registeredAt: shop.registeredAt
        })));

        setPerformance({
          totalShops: statistics.totalShops,
          activeShops: statistics.activeShops,
          totalCommission: statistics.totalShops * 1000, // Mock commission
          pendingShops: statistics.pendingShops
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching shops:', error);
      // Fallback to empty data
      setShops([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPartnerData();
  };

  useEffect(() => {
    fetchPartnerData();
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
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
        return 'Pending';
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
          <View>
            <Text style={styles.welcome}>Welcome, {user?.name}</Text>
            <Text style={styles.partnerCode}>{user?.partnerCode ? `Partner Code: ${user.partnerCode}` : ''}</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileText}>Profile</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <Text style={styles.welcome}>Welcome, {user?.name}</Text>
          <Text style={styles.partnerCode}>{user?.partnerCode ? `Partner Code: ${user.partnerCode}` : ''}</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileText}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Performance Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{performance.totalShops}</Text>
          <Text style={styles.statLabel}>Total Shops</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{performance.activeShops}</Text>
          <Text style={styles.statLabel}>Active Shops</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>฿{performance.totalCommission.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Commission</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{performance.pendingShops}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('ShopRegister')}
        >
          <Text style={styles.primaryButtonText}>+ Register New Shop</Text>
        </TouchableOpacity>
        
        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>My Commission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Shop Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Shops */}
      <View style={styles.shopsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Shops</Text>
          <TouchableOpacity onPress={fetchShops}>
            <Text style={styles.seeAllText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {shops.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No shops registered yet</Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('ShopRegister')}
            >
              <Text style={styles.emptyStateButtonText}>Register Your First Shop</Text>
            </TouchableOpacity>
          </View>
        ) : (
          shops.map(shop => (
            <View key={shop.id} style={styles.shopCard}>
              <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.shopLocation}>{shop.location}</Text>
                <Text style={styles.shopDate}>
                  Registered: {formatDate(shop.registeredAt)}
                </Text>
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

      {/* Commission Summary */}
      <View style={styles.commissionSection}>
        <Text style={styles.sectionTitle}>Commission Summary</Text>
        <View style={styles.commissionCard}>
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>This Month</Text>
            <Text style={styles.commissionAmount}>฿{commissionData.thisMonth.toLocaleString()}</Text>
          </View>
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Last Month</Text>
            <Text style={styles.commissionAmount}>฿{commissionData.lastMonth.toLocaleString()}</Text>
          </View>
          <View style={styles.commissionRow}>
            <Text style={styles.commissionLabel}>Total Earned</Text>
            <Text style={[styles.commissionAmount, styles.totalAmount]}>
              ฿{commissionData.totalEarned.toLocaleString()}
            </Text>
          </View>
        </View>
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
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  partnerCode: {
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
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionsSection: {
    padding: 15,
  },
  primaryButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 6,
    flex: 0.48,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 15,
    textAlign: 'center',
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
    alignItems: 'center',
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
    marginBottom: 4,
  },
  shopLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  shopDate: {
    fontSize: 12,
    color: '#999',
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
  commissionSection: {
    padding: 15,
  },
  commissionCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  commissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commissionLabel: {
    fontSize: 14,
    color: '#666',
  },
  commissionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    color: '#28a745',
    fontSize: 18,
  },
});

export default PartnerDashboard;