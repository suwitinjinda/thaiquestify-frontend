// src/screens/CustomerDashboard.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  RefreshControl,
  Image
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const CustomerDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('quests');

  const [userStats, setUserStats] = useState({
    points: 1250,
    completedQuests: 8,
    currentStreak: 5,
    level: 'Explorer'
  });

  const [quests, setQuests] = useState([
    {
      id: 1,
      title: 'เยือนร้านกาแฟท้องถิ่น',
      description: 'แวะดื่มกาแฟที่ร้านในเครือข่ายและเช็คอิน',
      points: 100,
      category: 'food',
      difficulty: 'easy',
      completed: false,
      shop: 'ร้านน่านฟ้า คาเฟ่'
    },
    {
      id: 2,
      title: 'ชิมของหวาน signature',
      description: 'ลิ้มรสเมนูเด็ดของร้านขนมไทย',
      points: 150,
      category: 'dessert',
      difficulty: 'medium',
      completed: true,
      shop: 'ร้านหวานเย็น'
    },
    {
      id: 3,
      title: 'ช้อปของฝาก Handmade',
      description: 'ซื้อของที่ระลึกจากร้านคราฟต์ท้องถิ่น',
      points: 200,
      category: 'shopping',
      difficulty: 'medium',
      completed: false,
      shop: 'ร้านคราฟต์วิลเลจ'
    }
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      food: '🍽️',
      dessert: '🍰',
      shopping: '🛍️',
      adventure: '🏔️',
      culture: '🎎'
    };
    return icons[category] || '🎯';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: '#28a745',
      medium: '#ffc107',
      hard: '#dc3545'
    };
    return colors[difficulty] || '#6c757d';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
  <View>
    <Text style={styles.welcome}>Welcome, {user?.displayName}</Text>
    <Text style={styles.partnerCode}>{user?.partnerCode ? `Partner Code: ${user.partnerCode}` : ''}</Text>
  </View>
  <TouchableOpacity 
    style={styles.profileButton}
    onPress={() => navigation.navigate('Profile')}
  >
    <Text style={styles.profileText}>Profile</Text>
  </TouchableOpacity>
</View>

      {/* Stats Overview */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.completedQuests}</Text>
            <Text style={styles.statLabel}>Quests</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{userStats.level}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'quests' && styles.activeTab]}
            onPress={() => setActiveTab('quests')}
          >
            <Text style={[styles.tabText, activeTab === 'quests' && styles.activeTabText]}>
              Available Quests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
            onPress={() => setActiveTab('rewards')}
          >
            <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
              Rewards
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quests List */}
        {activeTab === 'quests' && (
          <View style={styles.questsSection}>
            <Text style={styles.sectionTitle}>Available Quests</Text>
            {quests.filter(q => !q.completed).map(quest => (
              <TouchableOpacity key={quest.id} style={styles.questCard}>
                <View style={styles.questHeader}>
                  <View style={styles.questIcon}>
                    <Text style={styles.iconText}>
                      {getCategoryIcon(quest.category)}
                    </Text>
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <Text style={styles.questShop}>{quest.shop}</Text>
                  </View>
                  <View style={styles.pointsContainer}>
                    <Text style={styles.points}>{quest.points} pts</Text>
                  </View>
                </View>
                <Text style={styles.questDescription}>{quest.description}</Text>
                <View style={styles.questFooter}>
                  <View style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(quest.difficulty) }
                  ]}>
                    <Text style={styles.difficultyText}>
                      {quest.difficulty.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.startButtonText}>Start Quest</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Completed Quests */}
        {activeTab === 'completed' && (
          <View style={styles.questsSection}>
            <Text style={styles.sectionTitle}>Completed Quests</Text>
            {quests.filter(q => q.completed).map(quest => (
              <View key={quest.id} style={[styles.questCard, styles.completedCard]}>
                <View style={styles.questHeader}>
                  <View style={styles.questIcon}>
                    <Text style={styles.iconText}>
                      {getCategoryIcon(quest.category)}
                    </Text>
                  </View>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <Text style={styles.questShop}>{quest.shop}</Text>
                  </View>
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✓</Text>
                  </View>
                </View>
                <Text style={styles.questDescription}>{quest.description}</Text>
                <View style={styles.questFooter}>
                  <Text style={styles.earnedPoints}>+{quest.points} points earned</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Rewards */}
        {activeTab === 'rewards' && (
          <View style={styles.rewardsSection}>
            <Text style={styles.sectionTitle}>Available Rewards</Text>
            
            <View style={styles.rewardCard}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>Discount Coupon 10%</Text>
                <Text style={styles.rewardDescription}>
                  ส่วนลด 10% ทุกร้านในเครือข่าย
                </Text>
                <Text style={styles.rewardCost}>500 points</Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.redeemButton,
                  userStats.points < 500 && styles.redeemButtonDisabled
                ]}
                disabled={userStats.points < 500}
              >
                <Text style={styles.redeemButtonText}>Redeem</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.rewardCard}>
              <View style={styles.rewardInfo}>
                <Text style={styles.rewardTitle}>Free Drink</Text>
                <Text style={styles.rewardDescription}>
                  เครื่องดื่มฟรี 1 แก้วที่ร้านค้าเลือก
                </Text>
                <Text style={styles.rewardCost}>800 points</Text>
              </View>
              <TouchableOpacity 
                style={[
                  styles.redeemButton,
                  userStats.points < 800 && styles.redeemButtonDisabled
                ]}
                disabled={userStats.points < 800}
              >
                <Text style={styles.redeemButtonText}>Redeem</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  userInfo: {
    flex: 1,
  },
  welcome: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  pointsBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  pointsText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#4a6baf',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  questsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  questCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  completedCard: {
    opacity: 0.8,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  questIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  questShop: {
    fontSize: 14,
    color: '#666',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    width: 24,
    height: 24,
    backgroundColor: '#28a745',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  earnedPoints: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '600',
  },
  rewardsSection: {
    padding: 15,
  },
  rewardCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  rewardCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  redeemButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  redeemButtonDisabled: {
    backgroundColor: '#ccc',
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CustomerDashboard;