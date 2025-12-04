// src/screens/RegionQuestsScreen.js - UPDATED VERSION (Real Quest Count)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../services/api';
import { provinceGroups, getRegionByProvince } from '../data/thaiProvinces';

const { width } = Dimensions.get('window');

const RegionQuestsScreen = ({ route, navigation }) => {
  const { region } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [provinceShops, setProvinceShops] = useState({});
  const [provincesWithShops, setProvincesWithShops] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [provinceQuestStats, setProvinceQuestStats] = useState({});

  // Region display names in Thai
  const regionNames = {
    'เหนือ': 'ภาคเหนือ',
    'ตะวันออกเฉียงเหนือ': 'ภาคตะวันออกเฉียงเหนือ', 
    'กลาง': 'ภาคกลาง',
    'ตะวันออก': 'ภาคตะวันออก',
    'ตะวันตก': 'ภาคตะวันตก',
    'ใต้': 'ภาคใต้'
  };

  // Fetch quest counts for shops
  const fetchQuestCountsForShops = async (shops) => {
    try {
      console.log('🔍 Fetching quest counts for', shops.length, 'shops');
      
      const shopsWithQuestCounts = await Promise.all(
        shops.map(async (shop) => {
          try {
            // ใช้ shopId ไป query ใน quest database
            const questsResponse = await api.get(`/quests/shop/${shop.shopId}`);
            
            let activeQuests = 0;
            if (questsResponse.data.success) {
              activeQuests = questsResponse.data.data?.length || 0;
            }
            
            return {
              ...shop,
              activeQuests: activeQuests,
              hasQuests: activeQuests > 0
            };
          } catch (error) {
            console.error(`❌ Error fetching quests for shop ${shop.shopId}:`, error);
            return {
              ...shop,
              activeQuests: 0,
              hasQuests: false
            };
          }
        })
      );
      
      return shopsWithQuestCounts;
    } catch (error) {
      console.error('❌ Error fetching quest counts:', error);
      return shops.map(shop => ({
        ...shop,
        activeQuests: 0,
        hasQuests: false
      }));
    }
  };

  // Fetch all shops for the region and their quest counts
  const fetchRegionShops = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching shops for region:', region);
      
      // Use the correct endpoint: /shop/region/:region
      const response = await api.get(`/shop/region/${region}`);
      
      console.log('📊 Region shops API response:', response.data);

      if (response.data.success) {
        const shopsData = response.data.data || [];
        
        console.log(`✅ Found ${shopsData.length} shops in region ${region}`);
        
        // Transform shop data
        const transformedShops = shopsData.map(shop => {
          const shopData = {
            _id: shop._id?.$oid || shop._id || shop.shopId?.$oid || shop.shopId,
            shopId: shop.shopId || shop._id,
            shopName: shop.shopName || shop.name || 'ร้านค้า',
            shopType: shop.shopType || shop.category || 'ทั่วไป',
            province: shop.province || 'กรุงเทพมหานคร',
            district: shop.district || '',
            address: shop.address || '',
            phone: shop.phone || '',
            businessHours: shop.businessHours || '',
            description: shop.description || '',
            status: shop.status || 'active',
            image: shop.image || shop.images?.[0] || `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.shopName || 'ร้านค้า')}&background=4a6baf&color=fff&size=200`,
            // activeQuests จะถูกเติมหลังจากดึงข้อมูลเควส
            activeQuests: 0,
            hasQuests: false
          };
          
          return shopData;
        });

        // ดึงจำนวนเควสสำหรับแต่ละร้านค้า
        console.log('🔄 Fetching quest counts for all shops...');
        const shopsWithQuestCounts = await fetchQuestCountsForShops(transformedShops);
        
        setAllShops(shopsWithQuestCounts);
        
        // Group shops by province และคำนวณสถิติเควส
        const shopsByProvince = {};
        const provincesWithShopsList = [];
        const questStatsByProvince = {};
        
        shopsWithQuestCounts.forEach(shop => {
          const province = shop.province;
          
          if (!shopsByProvince[province]) {
            shopsByProvince[province] = [];
            provincesWithShopsList.push(province);
            questStatsByProvince[province] = {
              totalShops: 0,
              totalQuests: 0,
              shopsWithQuests: 0,
              shopNames: []
            };
          }
          
          shopsByProvince[province].push(shop);
          questStatsByProvince[province].totalShops++;
          questStatsByProvince[province].totalQuests += shop.activeQuests;
          if (shop.activeQuests > 0) {
            questStatsByProvince[province].shopsWithQuests++;
          }
          questStatsByProvince[province].shopNames.push(shop.shopName);
        });

        setProvinceShops(shopsByProvince);
        setProvincesWithShops(provincesWithShopsList);
        setProvinceQuestStats(questStatsByProvince);
        
        console.log(`✅ Grouped ${shopsWithQuestCounts.length} shops into ${provincesWithShopsList.length} provinces`);
        console.log('📊 Final province quest stats:', questStatsByProvince);

        // แสดงสรุปจำนวนเควส
        const totalQuests = shopsWithQuestCounts.reduce((sum, shop) => sum + shop.activeQuests, 0);
        const shopsWithQuests = shopsWithQuestCounts.filter(shop => shop.activeQuests > 0).length;
        console.log(`🎯 Summary: ${totalQuests} quests in ${shopsWithQuests} shops`);

      } else {
        throw new Error(response.data.message || 'Failed to fetch region shops');
      }

    } catch (error) {
      console.error('❌ Error fetching region shops:', error);
      Alert.alert('Error', 'ไม่สามารถโหลดข้อมูลร้านค้าได้');
      
      // Set empty data on error
      setAllShops([]);
      setProvinceShops({});
      setProvincesWithShops([]);
      setProvinceQuestStats({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRegionShops();
  }, [region]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRegionShops();
  };

  const handleProvincePress = (province) => {
    setSelectedProvince(province);
  };

  const handleShopPress = (shop) => {
    console.log("shopselect:", shop);
    
    // ตรวจสอบว่ามีเควสหรือไม่
    if (shop.activeQuests === 0) {
      Alert.alert(
        'ไม่มีเควส',
        `ร้าน ${shop.shopName} ยังไม่มีเควสในขณะนี้`,
        [{ text: 'ตกลง' }]
      );
      return;
    }
    
    console.log('🏪 Selected shop:', shop.shopName);
    navigation.navigate('ShopQuests', { 
      shopId: shop.shopId,
      shop: shop
    });
  };

  const handleBackToProvinces = () => {
    setSelectedProvince(null);
  };

  const ProvinceCard = ({ province, shopCount }) => {
    const stats = provinceQuestStats[province] || { 
      totalQuests: 0, 
      totalShops: 0, 
      shopsWithQuests: 0,
      shopNames: [] 
    };
    const sampleShops = stats.shopNames.slice(0, 3);
    
    return (
      <TouchableOpacity 
        style={styles.provinceCard}
        onPress={() => handleProvincePress(province)}
      >
        <View style={styles.provinceHeader}>
          <Text style={styles.provinceName}>{province}</Text>
          <View style={styles.questCountBadge}>
            <Text style={styles.questCountText}>{stats.totalQuests} เควส</Text>
          </View>
        </View>
        
        <View style={styles.provinceStats}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>ร้านค้า:</Text>
            <Text style={styles.statValue}>{stats.totalShops} ร้าน</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>ร้านที่มีเควส:</Text>
            <Text style={styles.statValue}>{stats.shopsWithQuests} ร้าน</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>เควสทั้งหมด:</Text>
            <Text style={[styles.statValue, styles.highlightText]}>
              {stats.totalQuests} เควส
            </Text>
          </View>
        </View>
        
        <View style={styles.shopNames}>
          <Text style={styles.shopNamesLabel}>ร้านค้าในจังหวัด:</Text>
          <Text style={styles.shopNamesText} numberOfLines={2}>
            {sampleShops.join(', ')}
            {stats.shopNames.length > 3 && ` และอีก ${stats.shopNames.length - 3} ร้าน`}
          </Text>
        </View>
        
        <View style={styles.provinceFooter}>
          <Text style={styles.viewShopsText}>
            ดูร้านค้า {stats.totalShops} ร้าน
          </Text>
          <Icon name="chevron-right" size={16} color="#4a6baf" />
        </View>
      </TouchableOpacity>
    );
  };

  const ShopCard = ({ shop }) => {
    const hasQuests = shop.activeQuests > 0;
    const estimatedReward = shop.activeQuests * 50; // ประมาณการรางวัล
    
    return (
      <TouchableOpacity 
        style={[
          styles.shopCard,
          !hasQuests && styles.shopCardDisabled
        ]}
        onPress={() => handleShopPress(shop)}
        disabled={!hasQuests}
      >
        <Image 
          source={{ uri: shop.image }} 
          style={styles.shopImage}
          defaultSource={{ uri: 'https://via.placeholder.com/100' }}
        />
        
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={2}>{shop.shopName}</Text>
          <Text style={styles.shopType}>{shop.shopType}</Text>
          
          <View style={styles.shopDetails}>
            <View style={styles.detailItem}>
              <Icon name="location-on" size={12} color="#666" />
              <Text style={styles.detailText}>
                {shop.district ? `${shop.district}, ` : ''}{shop.province}
              </Text>
            </View>
            
            {shop.phone && (
              <View style={styles.detailItem}>
                <Icon name="phone" size={12} color="#666" />
                <Text style={styles.detailText}>{shop.phone}</Text>
              </View>
            )}
          </View>

          {/* แสดงข้อมูลเควสทั้งหมด */}
          <View style={styles.questsInfo}>
            <View style={styles.questsHeader}>
              <Text style={styles.questsTitle}>เควสที่มี:</Text>
              <View style={[
                styles.questsStatus,
                { backgroundColor: hasQuests ? '#e8f5e8' : '#ffebee' }
              ]}>
                <Text style={[
                  styles.questsStatusText,
                  { color: hasQuests ? '#2e7d32' : '#c62828' }
                ]}>
                  {hasQuests ? `${shop.activeQuests} เควส` : 'ไม่มีเควส'}
                </Text>
              </View>
            </View>
            
            {hasQuests ? (
              <View style={styles.questsList}>
                <Text style={styles.questsAvailable}>🎯 พร้อมทำเควสได้ทันที!</Text>
                <Text style={styles.questsCount}>
                  💰 รางวัลรวมประมาณ {estimatedReward} บาท
                </Text>
                <Text style={styles.questsAction}>
                  👉 แตะเพื่อดูเควสทั้งหมด
                </Text>
              </View>
            ) : (
              <View style={styles.noQuests}>
                <Text style={styles.noQuestsText}>
                  ⚠️ ร้านนี้ยังไม่มีเควสในขณะนี้
                </Text>
                <Text style={styles.noQuestsSubtext}>
                  โปรดเลือกร้านค้าอื่นที่มีเควส
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>กำลังโหลดร้านค้าและเควสใน{regionNames[region]}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={selectedProvince ? handleBackToProvinces : () => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.regionName}>
            {selectedProvince ? selectedProvince : regionNames[region]}
          </Text>
          <Text style={styles.subtitle}>
            {selectedProvince 
              ? `${provinceShops[selectedProvince]?.length || 0} ร้านค้า • ${provinceQuestStats[selectedProvince]?.totalQuests || 0} เควส` 
              : `${provincesWithShops.length} จังหวัด • ${allShops.length} ร้านค้า • ${Object.values(provinceQuestStats).reduce((sum, stats) => sum + stats.totalQuests, 0)} เควส`
            }
          </Text>
        </View>
      </View> */}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedProvince ? (
          // Show shops in selected province
          <View style={styles.shopsSection}>
            <View style={styles.provinceSummary}>
              <Text style={styles.summaryTitle}>สรุปร้านค้าใน{selectedProvince}</Text>
              <Text style={styles.summaryText}>
                {provinceShops[selectedProvince]?.length || 0} ร้านค้า • 
                {provinceQuestStats[selectedProvince]?.shopsWithQuests || 0} ร้านที่มีเควส • 
                {provinceQuestStats[selectedProvince]?.totalQuests || 0} เควส
              </Text>
            </View>
            
            {provinceShops[selectedProvince]?.length > 0 ? (
              provinceShops[selectedProvince].map((shop) => (
                <ShopCard key={shop._id} shop={shop} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="store" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>ไม่พบร้านค้าใน{selectedProvince}</Text>
                <Text style={styles.emptyStateSubtext}>ลองเลือกจังหวัดอื่นดูนะคะ</Text>
              </View>
            )}
          </View>
        ) : (
          // Show ONLY provinces that have shops
          <View style={styles.provincesSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>จังหวัดที่มีร้านค้า</Text>
                <Text style={styles.sectionSubtitle}>
                  เลือกจังหวัดที่คุณสนใจเพื่อดูร้านค้าและเควสที่มีอยู่
                </Text>
              </View>
              <View style={styles.totalStats}>
                <Text style={styles.totalShops}>
                  {allShops.length} ร้าน
                </Text>
                <Text style={styles.totalQuests}>
                  {Object.values(provinceQuestStats).reduce((sum, stats) => sum + stats.totalQuests, 0)} เควส
                </Text>
              </View>
            </View>
            
            {provincesWithShops.length > 0 ? (
              <View style={styles.provincesGrid}>
                {provincesWithShops.map((province) => {
                  const shopCount = provinceShops[province]?.length || 0;
                  return (
                    <ProvinceCard 
                      key={province}
                      province={province}
                      shopCount={shopCount}
                    />
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="location-off" size={50} color="#ccc" />
                <Text style={styles.emptyStateText}>ยังไม่มีร้านค้าใน{regionNames[region]}</Text>
                <Text style={styles.emptyStateSubtext}>
                  ร้านค้าอาจจะกำลังสมัครเข้ามาในระบบ โปรดลองใหม่อีกครั้งในภายหลัง
                </Text>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={onRefresh}
                >
                  <Icon name="refresh" size={16} color="#4a6baf" />
                  <Text style={styles.refreshButtonText}>รีเฟรชข้อมูล</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// UPDATED STYLES
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
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
  },
  regionName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  provincesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  totalStats: {
    alignItems: 'flex-end',
  },
  totalShops: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6baf',
  },
  totalProvinces: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  provincesGrid: {
    gap: 12,
  },
  provinceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  provinceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  provinceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  questCountBadge: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questCountText: {
    fontSize: 12,
    color: '#4a6baf',
    fontWeight: '500',
  },
  provinceStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  shopNames: {
    marginBottom: 12,
  },
  shopNamesLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  shopNamesText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 16,
  },
  provinceFooter: {
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewShopsText: {
    fontSize: 12,
    color: '#4a6baf',
    fontWeight: '500',
  },
  shopsSection: {
    gap: 12,
  },
  provinceSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  shopCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shopCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#f8f9fa',
  },
  shopImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  shopType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  shopDetails: {
    marginBottom: 12,
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  questsInfo: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  questsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  questsStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questsStatusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  questsList: {
    // Styles for when there are quests
  },
  questsAvailable: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    marginBottom: 4,
  },
  questsCount: {
    fontSize: 11,
    color: '#666',
  },
  noQuests: {
    // Styles for when no quests
  },
  noQuestsText: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 2,
  },
  noQuestsSubtext: {
    fontSize: 11,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#4a6baf',
    fontWeight: '500',
    },
  highlightText: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  totalQuests: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: 'bold',
    marginTop: 2,
  },
  questsAction: {
    fontSize: 11,
    color: '#4a6baf',
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default RegionQuestsScreen;