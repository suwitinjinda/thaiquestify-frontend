// src/screens/UserQuestsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../services/api';

const UserQuestsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userQuests, setUserQuests] = useState({
    active: [],
    completed: [],
    pending: []
  });

  const fetchUserQuests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${user._id}/quests`);
      
      if (response.data.success) {
        setUserQuests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user quests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserQuests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserQuests();
  };

  const QuestStatusCard = ({ quest, status }) => (
    <TouchableOpacity style={styles.questCard}>
      <View style={styles.questHeader}>
        <Text style={styles.questName} numberOfLines={2}>{quest.name}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: 
            status === 'completed' ? '#28a745' :
            status === 'pending' ? '#ffc107' : '#4a6baf'
          }
        ]}>
          <Text style={styles.statusText}>
            {status === 'completed' ? 'สำเร็จ' :
             status === 'pending' ? 'รอตรวจสอบ' : 'กำลังทำ'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.questDescription} numberOfLines={2}>
        {quest.description}
      </Text>
      
      <View style={styles.questFooter}>
        <Text style={styles.rewardText}>รางวัล: ฿{quest.rewardAmount}</Text>
        <Text style={styles.dateText}>
          {new Date(quest.completedAt || quest.startedAt).toLocaleDateString('th-TH')}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Quests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เควสที่กำลังทำ</Text>
          {userQuests.active.length > 0 ? (
            userQuests.active.map((quest) => (
              <QuestStatusCard key={quest._id} quest={quest} status="active" />
            ))
          ) : (
            <Text style={styles.emptyText}>ไม่มีเควสที่กำลังทำ</Text>
          )}
        </View>

        {/* Pending Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>รอการตรวจสอบ</Text>
          {userQuests.pending.length > 0 ? (
            userQuests.pending.map((quest) => (
              <QuestStatusCard key={quest._id} quest={quest} status="pending" />
            ))
          ) : (
            <Text style={styles.emptyText}>ไม่มีเควสที่รอตรวจสอบ</Text>
          )}
        </View>

        {/* Completed Quests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เควสที่สำเร็จ</Text>
          {userQuests.completed.length > 0 ? (
            userQuests.completed.map((quest) => (
              <QuestStatusCard key={quest._id} quest={quest} status="completed" />
            ))
          ) : (
            <Text style={styles.emptyText}>ยังไม่มีเควสที่สำเร็จ</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  questCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
  questName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#28a745',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default UserQuestsScreen;