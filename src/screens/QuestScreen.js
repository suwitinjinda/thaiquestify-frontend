import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  FlatList, Image
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const { width } = Dimensions.get('window');

const QuestScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quests, setQuests] = useState([]);
  const [filteredQuests, setFilteredQuests] = useState([]);
  const [userQuests, setUserQuests] = useState([]);

  useEffect(() => {
    loadQuests();
  }, []);

  useEffect(() => {
    filterQuests();
  }, [searchQuery, selectedCategory, quests]);

  const loadQuests = async () => {
    try {
      setLoading(true);

      // Load all quests
      const response = await api.get('/quests/active');
      if (response.data.success) {
        setQuests(response.data.data);
      }

      // Load user's quests if logged in
      if (user) {
        const userResponse = await api.get(`/users/${user._id}/quests`);
        if (userResponse.data.success) {
          setUserQuests(userResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuests();
    setRefreshing(false);
  };

  const filterQuests = () => {
    let filtered = [...quests];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(quest =>
        quest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quest.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quest.province.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(quest => quest.category === selectedCategory);
    }

    setFilteredQuests(filtered);
  };

  const categories = [
    { id: 'all', name: 'ทั้งหมด', icon: 'apps' },
    { id: 'social-media', name: 'โซเชียล', icon: 'share' },
    { id: 'review', name: 'รีวิว', icon: 'rate-review' },
    { id: 'check-in', name: 'เช็คอิน', icon: 'location-on' },
    { id: 'photo', name: 'ถ่ายรูป', icon: 'photo-camera' },
    { id: 'purchase', name: 'ซื้อสินค้า', icon: 'shopping-cart' },
  ];

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'social-media': return 'share';
      case 'review': return 'rate-review';
      case 'check-in': return 'location-on';
      case 'photo': return 'photo-camera';
      case 'purchase': return 'shopping-cart';
      default: return 'assignment';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'social-media': return '#3b5998';
      case 'review': return '#ff9800';
      case 'check-in': return '#4caf50';
      case 'photo': return '#9c27b0';
      case 'purchase': return '#f44336';
      default: return '#666';
    }
  };

  const QuestCard = ({ quest }) => {
    const isParticipating = userQuests.some(q => q._id === quest._id);
    const isCompleted = userQuests.some(q => q._id === quest._id && q.status === 'completed');

    return (
      <TouchableOpacity
        style={styles.questCard}
        onPress={() => navigation.navigate('QuestDetails', { questId: quest._id })}
      >
        <View style={styles.questHeader}>
          <View style={styles.questCategory}>
            <Icon
              name={getCategoryIcon(quest.category)}
              size={16}
              color={getCategoryColor(quest.category)}
            />
            <Text style={[styles.categoryText, { color: getCategoryColor(quest.category) }]}>
              {quest.category}
            </Text>
          </View>

          {isParticipating && (
            <View style={[
              styles.statusBadge,
              isCompleted ? styles.completedBadge : styles.participatingBadge
            ]}>
              <Text style={styles.statusBadgeText}>
                {isCompleted ? 'สำเร็จ' : 'กำลังทำ'}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.questTitle} numberOfLines={2}>{quest.name}</Text>
        <Text style={styles.questDescription} numberOfLines={3}>{quest.description}</Text>

        <View style={styles.questInfo}>
          <View style={styles.infoRow}>
            <Icon name="store" size={14} color="#666" />
            <Text style={styles.infoText}>{quest.shopName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="location-on" size={14} color="#666" />
            <Text style={styles.infoText}>{quest.province}</Text>
          </View>
        </View>

        <View style={styles.rewardSection}>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardAmount}>฿{quest.rewardAmount}</Text>
            <Text style={styles.rewardPoints}>{quest.rewardPoints} คะแนน</Text>
          </View>

          <View style={styles.participantInfo}>
            <Icon name="people" size={14} color="#666" />
            <Text style={styles.participantText}>
              {quest.currentParticipants}/{quest.maxParticipants}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            isParticipating ? styles.secondaryButton : styles.primaryButton
          ]}
          onPress={() => navigation.navigate('QuestDetails', { questId: quest._id })}
        >
          <Text style={[
            styles.actionButtonText,
            isParticipating ? styles.secondaryButtonText : styles.primaryButtonText
          ]}>
            {isParticipating ? 'ดูสถานะ' : 'เข้าร่วมเลย'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังโหลดเควส...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>เควสทั้งหมด</Text>
        <Text style={styles.headerSubtitle}>
          {quests.length} เควสที่พร้อมให้คุณเข้าร่วม
        </Text>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาเควส..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Icon
                name={category.icon}
                size={20}
                color={selectedCategory === category.id ? '#4a6baf' : '#666'}
              />
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === category.id && styles.categoryButtonTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Quests List */}
        <FlatList
          data={filteredQuests}
          renderItem={({ item }) => <QuestCard quest={item} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.questsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="search-off" size={48} color="#ccc" />
              <Text style={styles.emptyStateTitle}>ไม่พบเควส</Text>
              <Text style={styles.emptyStateText}>
                ไม่มีเควสที่ตรงกับการค้นหาของคุณ
              </Text>
            </View>
          }
          ListHeaderComponent={
            <View style={styles.questsHeader}>
              <Text style={styles.questsCount}>
                {filteredQuests.length} เควส
              </Text>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => {/* TODO: Implement filter modal */ }}
              >
                <Icon name="filter-list" size={20} color="#666" />
                <Text style={styles.filterButtonText}>ตัวกรอง</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Create Quest Button (for shops) */}
      {user?.userType === 'shop' && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('ShopCreateQuest')}
        >
          <Icon name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>สร้างเควสใหม่</Text>
        </TouchableOpacity>
      )}
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
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoriesScroll: {
    marginHorizontal: 16,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#e7f3ff',
    borderColor: '#4a6baf',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#4a6baf',
    fontWeight: '500',
  },
  questsList: {
    padding: 16,
  },
  questsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
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
    alignItems: 'center',
    marginBottom: 8,
  },
  questCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  participatingBadge: {
    backgroundColor: '#fff3cd',
  },
  completedBadge: {
    backgroundColor: '#d4edda',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  questTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  questInfo: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
  },
  rewardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  rewardInfo: {
    gap: 4,
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  rewardPoints: {
    fontSize: 12,
    color: '#666',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantText: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#4a6baf',
  },
  secondaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#4a6baf',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#4a6baf',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6baf',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default QuestScreen;