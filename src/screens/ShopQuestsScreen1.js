// src/screens/ShopQuestsScreen.js - Updated to handle params
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ShopQuestsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get shopId from route params or user data
  const shopId = route.params?.shopId || user?.shopId || '';
  const shopName = route.params?.shopName || user?.shopName || 'My Shop';

  useEffect(() => {
    if (shopId) {
      loadQuests();
    } else {
      Alert.alert('Error', 'Shop information not found. Please go back and select a shop.');
      navigation.goBack();
    }
  }, [shopId]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading quests for shop:', shopId);
      
      const response = await api.get(`/quests/shop/${shopId}`);
      
      if (response.data.success) {
        setQuests(response.data.data || []);
        console.log(`✅ Found ${response.data.data?.length || 0} quests`);
      } else {
        console.log('⚠️ No quests found for shop:', shopId);
        setQuests([]);
      }
    } catch (error) {
      console.error('❌ Error loading shop quests:', error);
      Alert.alert('Error', 'Failed to load quests. Please try again.');
      setQuests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuests();
  };

  const handleCreateQuest = () => {
    navigation.navigate('ShopCreateQuest', { 
      shId: shopId,
      shName: shopName 
    });
  };

  const handleQuestPress = (quest) => {
    navigation.navigate('QuestDetails', { 
      questId: quest._id,
      questName: quest.name 
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'pending': return '#ffc107';
      case 'completed': return '#17a2b8';
      case 'expired': return '#6c757d';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>Loading quests for {shopName}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.shopName}>{shopName}</Text>
          <Text style={styles.shopId}>ID: {shopId}</Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{quests.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {quests.filter(q => q.status === 'active').length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {quests.filter(q => q.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateQuest}
      >
        <Text style={styles.createButtonText}>+ Create New Quest</Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {quests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Quests Yet</Text>
            <Text style={styles.emptyStateText}>
              You haven't created any quests for {shopName} yet.
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={handleCreateQuest}
            >
              <Text style={styles.emptyStateButtonText}>Create Your First Quest</Text>
            </TouchableOpacity>
          </View>
        ) : (
          quests.map((quest) => (
            <TouchableOpacity 
              key={quest._id}
              style={styles.questCard}
              onPress={() => handleQuestPress(quest)}
            >
              <View style={styles.questHeader}>
                <Text style={styles.questName}>{quest.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(quest.status) }]}>
                  <Text style={styles.statusText}>{quest.status}</Text>
                </View>
              </View>
              
              <Text style={styles.questDescription} numberOfLines={2}>
                {quest.description}
              </Text>
              
              {/* Show Facebook icon if it's a Facebook quest */}
              {quest.type === 'facebook_follow' && (
                <View style={styles.facebookTag}>
                  <Text style={styles.facebookTagText}>📘 Facebook Follow</Text>
                </View>
              )}
              
              <View style={styles.questDetails}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Reward</Text>
                  <Text style={styles.detailValue}>฿{quest.rewardAmount}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Participants</Text>
                  <Text style={styles.detailValue}>
                    {quest.currentParticipants}/{quest.maxParticipants}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Ends</Text>
                  <Text style={styles.detailValue}>{formatDate(quest.endDate)}</Text>
                </View>
              </View>
              
              <View style={styles.questFooter}>
                <Text style={styles.createdDate}>
                  Created: {formatDate(quest.createdAt)}
                </Text>
                <Text style={styles.viewDetails}>View Details →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
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
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4a6baf',
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shopId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a6baf',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  createButton: {
    backgroundColor: '#4a6baf',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  questCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  facebookTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1877f2',
  },
  facebookTagText: {
    fontSize: 12,
    color: '#1877f2',
    fontWeight: '500',
  },
  questDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdDate: {
    fontSize: 12,
    color: '#999',
  },
  viewDetails: {
    fontSize: 14,
    color: '#4a6baf',
    fontWeight: '500',
  },
});

export default ShopQuestsScreen;