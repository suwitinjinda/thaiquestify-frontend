// src/screens/LandingPage.js - COMPLETE VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../services/api';
import { provinceGroups } from '../data/thaiProvinces';

const { width } = Dimensions.get('window');

const LandingPage = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [regionStats, setRegionStats] = useState({});
  const [hotQuests, setHotQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    completedQuests: 0,
    totalPoints: 0,
    rewardsClaimed: 0
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
  try {
    setLoading(true);
    console.log('🔄 Loading dashboard data...');
    
    // Use mock data instead of API calls
    setTimeout(() => {
      setRegionStats(getFallbackRegionStats());
      setHotQuests(getFallbackHotQuests());
      setLoading(false);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error loading dashboard data:', error);
    setLoading(false);
  }
};

  // Fetch quest statistics by region
  const fetchRegionStats = async () => {
  try {
    console.log('📊 Fetching REAL region statistics...');
    
    const response = await api.get('/quests/stats/by-region');
    console.log('Real region stats response:', response.data);

    if (response.data.success && response.data.data) {
      setRegionStats(response.data.data);
    } else {
      console.log('⚠️ Region stats API returned unsuccessful');
      // You can choose to show empty state or keep previous data
      setRegionStats({});
    }
  } catch (error) {
    console.error('❌ Error fetching real region stats:', error);
    // Show empty state instead of fallback data
    setRegionStats({});
  }
};


  // Fetch hot quests
  const fetchHotQuests = async () => {
  try {
    console.log('🔥 Fetching hot quests...');
    
    const response = await api.get('/quests/hot');

    if (response.data.success && response.data.data) {
      const quests = response.data.data;
      
      const transformedQuests = quests.map(quest => ({
        _id: quest._id?.$oid || quest._id || Math.random().toString(),
        name: quest.name || 'เควสใหม่',
        description: quest.description || 'คำอธิบายเควส',
        rewardAmount: quest.rewardAmount || 0,
        rewardPoints: quest.rewardPoints || 0,
        province: quest.province || 'กรุงเทพมหานคร',
        shopName: quest.shopName || quest.shop?.shopName || 'ร้านค้า',
        currentParticipants: quest.currentParticipants || 0,
        maxParticipants: quest.maxParticipants || 10,
        category: quest.category || 'general'
      }));

      setHotQuests(transformedQuests);
    } else {
      console.log('⚠️ Using fallback hot quests');
      setHotQuests(getFallbackHotQuests());
    }
  } catch (error) {
    console.error('❌ Error fetching hot quests:', error);
    // Use fallback data
    setHotQuests(getFallbackHotQuests());
  }
};

  // Add fallback data functions
const getFallbackRegionStats = () => {
  return {
    "กลาง": {
      activeQuests: 17,
      popularProvinces: ["กรุงเทพมหานคร", "นนทบุรี", "ปทุมธานี"],
      totalShops: 6,
      trending: "เทรนด์คาเฟ่และร้านอาหารแนวๆ"
    },
    "ตะวันตก": {
      activeQuests: 24,
      popularProvinces: ["กาญจนบุรี", "ราชบุรี", "เพชรบุรี"],
      totalShops: 7,
      trending: "เทรนด์เที่ยวธรรมชาติและประวัติศาสตร์"
    },
    "ตะวันออก": {
      activeQuests: 23,
      popularProvinces: ["ชลบุรี", "ระยอง", "จันทบุรี"],
      totalShops: 6,
      trending: "เทรนด์เที่ยวทะเลและรีสอร์ท"
    },
    "ตะวันออกเฉียงเหนือ": {
      activeQuests: 6,
      popularProvinces: ["ขอนแก่น", "อุบลราชธานี", "นครราชสีมา"],
      totalShops: 15,
      trending: "เทรนด์ร้านอาหารอีสานและตลาดนัดชุมชน"
    },
    "เหนือ": {
      activeQuests: 5,
      popularProvinces: ["เชียงใหม่", "เชียงราย", "ลำปาง"],
      totalShops: 16,
      trending: "เทรนด์เช็คอินร้านกาแฟและสถานที่ท่องเที่ยวธรรมชาติ"
    },
    "ใต้": {
      activeQuests: 13,
      popularProvinces: ["ภูเก็ต", "สงขลา", "นครศรีธรรมราช"],
      totalShops: 11,
      trending: "เทรนด์ทะเลใต้และอาหารทะเลสด"
    }
  };
};

const getFallbackHotQuests = () => {
  return [
    {
      _id: '1',
      name: 'Facebook Check-in at Our Store',
      description: 'Visit our physical store location and check-in on Facebook',
      rewardAmount: 20,
      rewardPoints: 100,
      province: 'กรุงเทพมหานคร',
      shopName: 'ร้านตัวอย่าง 1',
      currentParticipants: 0,
      maxParticipants: 20,
      category: 'social-media'
    },
    {
      _id: '2',
      name: 'รีวิวร้านอาหาร',
      description: 'ทานอาหารที่ร้านและเขียนรีวิวบน Google Maps',
      rewardAmount: 50,
      rewardPoints: 150,
      province: 'เชียงใหม่',
      shopName: 'ร้านอาหารเดอะริเวอร์',
      currentParticipants: 5,
      maxParticipants: 15,
      category: 'review'
    }
  ];
};
  
  // Fetch user statistics
  const fetchUserStats = async () => {
    if (!user) return;
    
    try {
      const response = await api.get(`/users/${user._id}/stats`);
      if (response.data.success) {
        setUserStats(response.data.data);
      }
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      // Keep default stats (0,0,0)
    }
  };

  // Fetch shops by region
const fetchShopsByRegion = async (region) => {
  try {
    console.log(`🔄 Fetching shops for region: ${region}`);
    
    const response = await api.get(`/shop/region/${region}`);
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.data.length} shops in ${region}`);
      return response.data.data;
    } else {
      console.log('❌ No shops found for region:', region);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching shops for ${region}:`, error);
    return [];
  }
};

// Fetch shops by province
const fetchShopsByProvince = async (province) => {
  try {
    console.log(`🔄 Fetching shops for province: ${province}`);
    
    const response = await api.get('/shop/active', {
      params: { province: province }
    });
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.data.length} shops in ${province}`);
      return response.data.data;
    } else {
      console.log('❌ No shops found for province:', province);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching shops for ${province}:`, error);
    return [];
  }
};

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleRegionPress = async (region) => {
  try {
    console.log(`📍 Selected region: ${region}`);
    
    // Fetch shops for the selected region
    const shops = await fetchShopsByRegion(region);
    // console.log("shop55:",shops)
    // Navigate to RegionQuests with both region and shops data
    navigation.navigate('RegionQuests', {       
      region: region,
      shops: shops,
      regionStats: regionStats[region] || {}
    });
    
  } catch (error) {
    console.error('❌ Error in handleRegionPress:', error);
    // Navigate with empty shops data as fallback
    navigation.navigate('RegionQuests', { 
      region: region,
      shops: [],
      regionStats: regionStats[region] || {}
    });
  }
};

  const getQuestDensityColor = (questCount) => {
  if (questCount > 15) return '#28a745'; // High - Green
  if (questCount > 8) return '#ffc107';  // Medium - Yellow
  if (questCount > 0) return '#fd7e14';  // Low - Orange
  return '#6c757d'; // None - Gray
};

const getQuestDensityText = (questCount) => {
  if (questCount > 15) return 'เควสเยอะมาก 🎉';
  if (questCount > 8) return 'เควสปานกลาง 👍';
  if (questCount > 0) return 'เควสน้อย 👀';
  return 'ยังไม่มีเควส';
};

  const getQuestEmoji = (category) => {
    switch (category) {
      case 'social-media': return '📱';
      case 'review': return '⭐';
      case 'check-in': return '📍';
      case 'photo': return '📸';
      case 'purchase': return '🛒';
      default: return '🎯';
    }
  };

  // In your LandingPage component - Update the RegionCard component
const RegionCard = ({ region }) => {
  const stats = regionStats[region] || {
    activeQuests: 0,
    popularProvinces: provinceGroups[region]?.slice(0, 3) || [],
    totalShops: 0,
    trending: 'กำลังโหลดข้อมูล...'
  };
  console.log(stats)
  const hasQuests = stats.activeQuests > 0;
  const hasShops = stats.totalShops > 0;

  return (
    <TouchableOpacity 
      style={[styles.regionCard, selectedRegion === region && styles.regionCardSelected]}
      onPress={() => handleRegionPress(region)}
    >
      <View style={styles.regionHeader}>
        <Text style={styles.regionName}>ภาค{region}</Text>
        <View style={styles.statsRow}>
          {/* <View style={[styles.questCountBadge, { 
            backgroundColor: hasQuests ? getQuestDensityColor(stats.activeQuests) : '#6c757d' 
          }]}>
            <Text style={styles.questCountText}>
              {stats.activeQuests} เควส
            </Text>
          </View> */}
          <View style={[styles.shopCountBadge, { 
            backgroundColor: hasShops ? '#28a745' : '#6c757d' 
          }]}>
            <Text style={styles.shopCountText}>
              {stats.totalShops} ร้านค้า
            </Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.questDensityText}>
        {hasQuests ? getQuestDensityText(stats.activeQuests) : 'ยังไม่มีเควส'}
        {hasShops && !hasQuests && ' (มีร้านค้ารอเควส)'}
      </Text>
      
      <Text style={styles.trendingText}>📈 {stats.trending}</Text>
      
      <View style={styles.popularProvinces}>
        <Text style={styles.popularTitle}>
          {hasQuests ? 'จังหวัดที่มีเควส:' : 'จังหวัดในภาค:'}
        </Text>
        <View style={styles.provinceTags}>
          {stats.popularProvinces.map((province, index) => (
            <View key={index} style={[
              styles.provinceTag,
              hasQuests && styles.provinceTagActive
            ]}>
              <Text style={styles.provinceTagText}>{province}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>
          {hasQuests ? 'ความหนาแน่นของเควส' : 'รอเควสจากร้านค้า'}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill,
              { 
                width: hasQuests ? `${Math.min((stats.activeQuests / 25) * 100, 100)}%` : '0%',
                backgroundColor: hasQuests ? getQuestDensityColor(stats.activeQuests) : '#6c757d'
              }
            ]} 
          />
        </View>
        {hasQuests && (
          <Text style={styles.progressText}>
            {stats.activeQuests} ภาค {stats.popularProvinces.length} จังหวัด
          </Text>
        )}
      </View>

      {/* Show call to action if no quests but has shops */}
      {!hasQuests && hasShops && (
        <View style={styles.ctaContainer}>
          <Text style={styles.ctaText}>
            🎯 มี {stats.totalShops} ร้านค้ารอสร้างเควส
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

  const HotQuestsSection = () => (
    <View style={styles.hotQuestsSection}>
      <Text style={styles.sectionTitle}>🔥 เควสฮิตประจำวัน</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.hotQuestsScroll}
      >
        {hotQuests.length > 0 ? (
          hotQuests.map((quest) => (
            <View key={quest._id} style={styles.hotQuestCard}>
              <Text style={styles.hotQuestEmoji}>{getQuestEmoji(quest.category)}</Text>
              <Text style={styles.hotQuestTitle} numberOfLines={2}>{quest.name}</Text>
              <Text style={styles.hotQuestReward}>รางวัล ฿{quest.rewardAmount}</Text>
              <Text style={styles.hotQuestPoints}>{quest.rewardPoints} Points</Text>
              <Text style={styles.hotQuestLocation}>{quest.province}</Text>
              <View style={styles.participantInfo}>
                <Text style={styles.participantText}>
                  {quest.currentParticipants}/{quest.maxParticipants} คน
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>ไม่มีเควสในขณะนี้</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  const UserStats = () => (
    <View style={styles.userStats}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{userStats.completedQuests}</Text>
        <Text style={styles.statLabel}>เควสที่ทำแล้ว</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{userStats.totalPoints}</Text>
        <Text style={styles.statLabel}>คะแนนสะสม</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{userStats.rewardsClaimed}</Text>
        <Text style={styles.statLabel}>รางวัลที่ได้รับ</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>ThaiQuestify</Text>
          <Text style={styles.subtitle}>ค้นหาเควสน่าสนใจใกล้คุณ</Text>
        </View>
        
        <View style={styles.headerRight}>
          {user ? (
            // ถ้าล็อกอินแล้ว - แสดงโปรไฟล์
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0) || 'U'}
                </Text>
              </View>
              <Text style={styles.profileName} numberOfLines={1}>
                {user.name}
              </Text>
            </TouchableOpacity>
          ) : (
            // ถ้ายังไม่ได้ล็อกอิน - แสดงปุ่มเข้าสู่ระบบ
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Icon name="login" size={16} color="white" />
              <Text style={styles.loginButtonText}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            {user ? `ยินดีต้อนรับ, ${user.name}!` : 'ยินดีต้อนรับสู่ ThaiQuestify!'}
          </Text>
          <Text style={styles.welcomeText}>
            {user 
              ? `ค้นหาเควสน่าสนใจในพื้นที่ที่คุณต้องการ พร้อมรับรางวัลมากมาย`
              : 'เข้าสู่ระบบเพื่อค้นหาเควสน่าสนใจในพื้นที่ที่คุณต้องการ พร้อมรับรางวัลมากมาย'
            }
          </Text>
          
          {user && <UserStats />}
        </View>

        {/* Hot Quests */}
        <HotQuestsSection />

        {/* Regions Section */}
        {/* <View style={styles.regionsSection}>
          <Text style={styles.sectionTitle}>🗺️ ค้นหาเควสตามภาค</Text>
          <Text style={styles.sectionSubtitle}>
            เลือกภาคที่คุณสนใจเพื่อดูเควสที่มีอยู่
          </Text>
          
          <View style={styles.regionsGrid}>
            {Object.keys(provinceGroups).map((region) => (
              <RegionCard 
                key={region}
                region={region}
              />
            ))}
          </View>
        </View> */}

        {/* Selected Region Info */}
        {/* {selectedRegion && (
          <View style={styles.selectedRegionInfo}>
            <Text style={styles.selectedRegionTitle}>
              ภาค{selectedRegion} - {regionStats[selectedRegion]?.activeQuests || 0} เควส
            </Text>
            <Text style={styles.selectedRegionText}>
              {regionStats[selectedRegion]?.trending || 'กำลังโหลดข้อมูล...'}
            </Text>
            <TouchableOpacity 
              style={styles.viewQuestsButton}
              onPress={() => handleRegionPress(selectedRegion)}
            >
              <Text style={styles.viewQuestsButtonText}>
                ดูเควสทั้งหมดในภาค{selectedRegion}
              </Text>
            </TouchableOpacity>
          </View>
        )} */}

        {/* Quick Actions */}
<View style={styles.quickActions}>
  <TouchableOpacity 
    style={styles.quickActionCard}
    onPress={() => navigation.navigate('ExploreTab')}
  >
    <Icon name="explore" size={24} color="#4a6baf" />
    <Text style={styles.quickActionText}>สำรวจเควส</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    style={styles.quickActionCard}
    onPress={() => navigation.navigate('QuestTab')}
  >
    <Icon name="assignment" size={24} color="#28a745" />
    <Text style={styles.quickActionText}>เควสทั้งหมด</Text>
  </TouchableOpacity>
</View>

        {/* Quick Profile Access */}
        {/* {user && (
          <TouchableOpacity 
            style={styles.profileQuickAccess}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="person" size={20} color="#4a6baf" />
            <Text style={styles.profileQuickAccessText}>จัดการโปรไฟล์และสถิติ</Text>
            <Icon name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        )} */}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            มีร้านค้ามากกว่า 100 ร้านเข้าร่วมโครงการ
          </Text>
          <Text style={styles.footerVersion}>ThaiQuestify v1.0.0</Text>
        </View>
      </ScrollView>
    </Animated.View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 20,
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4a6baf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  loginButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
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
  hotQuestsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  hotQuestsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  hotQuestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hotQuestEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  hotQuestTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  hotQuestReward: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 2,
  },
  hotQuestPoints: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  hotQuestLocation: {
    fontSize: 11,
    color: '#666',
  },
  participantInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  participantText: {
    fontSize: 10,
    color: '#999',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    marginRight: 12,
    width: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  regionsSection: {
    marginBottom: 20,
  },
  regionsGrid: {
    gap: 12,
  },
  regionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  regionCardSelected: {
    borderWidth: 2,
    borderColor: '#4a6baf',
  },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  regionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  questCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questCountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  questDensityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  trendingText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  popularProvinces: {
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  provinceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  provinceTag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  provinceTagText: {
    fontSize: 10,
    color: '#333',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  selectedRegionInfo: {
    backgroundColor: '#e7f3ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4a6baf',
  },
  selectedRegionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  selectedRegionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  viewQuestsButton: {
    backgroundColor: '#4a6baf',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewQuestsButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  profileQuickAccess: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileQuickAccessText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  footerVersion: {
    fontSize: 11,
    color: '#ccc',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  shopCountBadge: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shopCountText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  provinceTagActive: {
    backgroundColor: '#e7f3ff',
    borderColor: '#4a6baf',
    borderWidth: 1,
  },
  progressText: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  ctaContainer: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  ctaText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 20,
    gap: 8,
    maxWidth: 150,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4a6baf',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flexShrink: 1,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a6baf',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  quickActions: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  marginBottom: 20,
},
quickActionCard: {
  backgroundColor: 'white',
  borderRadius: 12,
  padding: 16,
  alignItems: 'center',
  flex: 1,
  marginHorizontal: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},
quickActionText: {
  marginTop: 8,
  fontSize: 12,
  color: '#333',
  textAlign: 'center',
},
});

export default LandingPage;