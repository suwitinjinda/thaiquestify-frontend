// src/screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl,
  Alert 
} from 'react-native';
import { useAuth } from '../store/AuthContext';
import { apiService } from '../services/api';
import QuestCard from '../components/QuestCard';
import Button from '../components/Button';
import { COLORS, SIZES } from '../utils/constants';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getQuests();
      setQuests(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load quests');
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuests();
  };

  const handleQuestPress = (quest) => {
    navigation.navigate('QuestDetail', { quest });
  };

  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading quests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>สวัสดี, {user?.displayName}!</Text>
          <Text style={styles.points}>⚡ {user?.points || 0} points</Text>
        </View>
        <Button 
          title="Logout" 
          variant="outline" 
          onPress={handleLogout}
          style={styles.logoutButton}
        />
      </View>

      {/* Scan QR Button */}
      <Button 
        title="📱 สแกน QR Code" 
        onPress={handleScanQR}
        style={styles.scanButton}
      />

      {/* Quests List */}
      <Text style={styles.sectionTitle}>ภารกิจทั้งหมด</Text>
      
      <FlatList
        data={quests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <QuestCard 
            quest={item} 
            onPress={() => handleQuestPress(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[100],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  greeting: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  points: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scanButton: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.dark,
    margin: 16,
    marginBottom: 8,
  },
});

export default HomeScreen;