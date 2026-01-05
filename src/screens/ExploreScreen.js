//src/screens/ExploreScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';

import api from '../services/api';
import { provinceGroups } from '../data/thaiProvinces';

const { width } = Dimensions.get('window');

const ExploreScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [regionStats, setRegionStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRegionStats();
  }, []);

  const loadRegionStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quests/stats/by-region');
      if (response.data.success && response.data.data) {
        setRegionStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading region stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRegionStats();
    setRefreshing(false);
  };

  const handleRegionPress = (region) => {
    setSelectedRegion(region);
    setSelectedProvince(null);

    // Navigate to RegionQuests
    navigation.navigate('RegionQuests', {
      region: region,
      regionStats: regionStats[region] || {}
    });
  };

  const handleProvincePress = async (province) => {
    setSelectedProvince(province);

    // Fetch shops by province
    try {
      const response = await api.get('/shop/active', {
        params: { province: province }
      });

      if (response.data.success) {
        navigation.navigate('ShopQuests', {
          province: province,
          shops: response.data.data
        });
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const getQuestDensityColor = (questCount) => {
    if (questCount > 15) return '#28a745';
    if (questCount > 8) return '#ffc107';
    if (questCount > 0) return '#fd7e14';
    return '#6c757d';
  };

  const RegionCard = ({ region }) => {
    const stats = regionStats[region] || {
      activeQuests: 0,
      popularProvinces: provinceGroups[region]?.slice(0, 3) || [],
      totalShops: 0,
    };

    const questCount = stats.activeQuests || 0;

    return (
      <TouchableOpacity
        style={styles.regionCard}
        onPress={() => handleRegionPress(region)}
      >
        <View style={styles.regionHeader}>
          <View style={styles.regionInfo}>
            <Text style={styles.regionName}>ภาค{region}</Text>
            <Text style={styles.provinceCount}>
              {provinceGroups[region]?.length || 0} จังหวัด
            </Text>
          </View>
          <View style={[styles.questBadge, { backgroundColor: getQuestDensityColor(questCount) }]}>
            <Text style={styles.questBadgeText}>{questCount} เควส</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((questCount / 25) * 100, 100)}%`,
                  backgroundColor: getQuestDensityColor(questCount)
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {questCount > 0 ? 'มีเควสให้ทำ' : 'รอเควสจากร้านค้า'}
          </Text>
        </View>

        <View style={styles.popularProvinces}>
          <Text style={styles.popularTitle}>จังหวัดที่มีเควส:</Text>
          <View style={styles.provinceTags}>
            {stats.popularProvinces.slice(0, 3).map((province, index) => (
              <View key={index} style={styles.provinceTag}>
                <Text style={styles.provinceTagText}>{province}</Text>
              </View>
            ))}
            {stats.popularProvinces.length > 3 && (
              <View style={styles.moreTag}>
                <Text style={styles.moreTagText}>+{stats.popularProvinces.length - 3}</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => handleRegionPress(region)}
        >
          <Text style={styles.exploreButtonText}>สำรวจภาคนี้</Text>
          <Icon name="arrow-forward" size={16} color="#4a6baf" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ค้นหาเควส</Text>
        <Text style={styles.headerSubtitle}>สำรวจเควสตามพื้นที่ที่คุณสนใจ</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ค้นหาเควส, ร้านค้า, หรือจังหวัด..."
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

        {/* Regions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ค้นหาตามภาค</Text>
          <Text style={styles.sectionDescription}>
            เลือกภาคที่คุณสนใจเพื่อดูเควสที่มีอยู่
          </Text>

          <View style={styles.regionsGrid}>
            {Object.keys(provinceGroups).map((region) => (
              <RegionCard key={region} region={region} />
            ))}
          </View>
        </View>

        {/* Browse by Province */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ค้นหาตามจังหวัด</Text>
          <Text style={styles.sectionDescription}>
            เลือกจังหวัดเพื่อดูร้านค้าและเควส
          </Text>

          <View style={styles.provinceGrid}>
            {Object.entries(provinceGroups).map(([region, provinces]) => (
              <View key={region} style={styles.provinceGroup}>
                <Text style={styles.provinceGroupTitle}>ภาค{region}</Text>
                <View style={styles.provinceRow}>
                  {provinces.slice(0, 4).map((province) => (
                    <TouchableOpacity
                      key={province}
                      style={styles.provinceButton}
                      onPress={() => handleProvincePress(province)}
                    >
                      <Text style={styles.provinceButtonText}>{province}</Text>
                    </TouchableOpacity>
                  ))}
                  {provinces.length > 4 && (
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => handleRegionPress(region)}
                    >
                      <Text style={styles.moreButtonText}>ดูทั้งหมด</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ค้นหาแบบรวดเร็ว</Text>
          <View style={styles.quickLinks}>
            <TouchableOpacity style={styles.quickLinkCard}>
              <View style={[styles.quickLinkIcon, { backgroundColor: '#4a6baf' }]}>
                <Icon name="star" size={24} color="white" />
              </View>
              <Text style={styles.quickLinkTitle}>เควสแนะนำ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkCard}>
              <View style={[styles.quickLinkIcon, { backgroundColor: '#28a745' }]}>
                <Icon name="local-offer" size={24} color="white" />
              </View>
              <Text style={styles.quickLinkTitle}>รางวัลสูง</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkCard}>
              <View style={[styles.quickLinkIcon, { backgroundColor: '#dc3545' }]}>
                <Icon name="whatshot" size={24} color="white" />
              </View>
              <Text style={styles.quickLinkTitle}>มาแรง</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickLinkCard}>
              <View style={[styles.quickLinkIcon, { backgroundColor: '#ffc107' }]}>
                <Icon name="access-time" size={24} color="white" />
              </View>
              <Text style={styles.quickLinkTitle}>ใกล้หมดเวลา</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  regionInfo: {
    flex: 1,
  },
  regionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  provinceCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  questBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
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
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4a6baf',
  },
  provinceTagText: {
    fontSize: 11,
    color: '#4a6baf',
  },
  moreTag: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moreTagText: {
    fontSize: 11,
    color: '#666',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#4a6baf',
    borderRadius: 8,
    gap: 8,
  },
  exploreButtonText: {
    color: '#4a6baf',
    fontWeight: '500',
    fontSize: 14,
  },
  provinceGrid: {
    gap: 16,
  },
  provinceGroup: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  provinceGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  provinceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  provinceButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  provinceButtonText: {
    fontSize: 12,
    color: '#333',
  },
  moreButton: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  moreButtonText: {
    fontSize: 12,
    color: '#4a6baf',
    fontWeight: '500',
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLinkTitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
});

export default ExploreScreen;