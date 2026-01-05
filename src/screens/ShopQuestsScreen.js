// src/screens/ShopQuestsScreen.js - UPDATED VERSION
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
  Alert,
  Modal
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import api from '../services/api';

const { width } = Dimensions.get('window');

const ShopQuestsScreen = ({ route, navigation }) => {
  const { shopId, shop } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quests, setQuests] = useState([]);
  const [shopInfo, setShopInfo] = useState(shop); // Use the shop data from props
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  // Fetch quests for this shop
  const fetchShopQuests = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching quests for shop:', shopId);
      console.log("shopquest:", route.params)

      // Fetch quests for this shop
      const questsResponse = await api.get(`/quests/shop/${shopId}`);
      console.log('📊 Quests response:', questsResponse.data);

      if (questsResponse.data.success) {
        const questsData = questsResponse.data.data || [];

        const transformedQuests = questsData.map(quest => ({
          _id: quest._id,
          name: quest.name,
          description: quest.description,
          instructions: quest.instructions || 'ทำตามขั้นตอนที่ระบุในคำอธิบาย',
          rewardAmount: quest.rewardAmount || 0,
          rewardPoints: quest.rewardPoints || 0,
          category: quest.category || 'general',
          difficulty: quest.difficulty || 'easy',
          status: quest.status || 'active',
          startDate: quest.startDate,
          endDate: quest.endDate,
          currentParticipants: quest.currentParticipants || 0,
          maxParticipants: quest.maxParticipants || 0,
          verificationType: quest.verificationType || 'photo',
          requirements: quest.requirements || []
        }));

        setQuests(transformedQuests);
      } else {
        // If no quests found, set empty array
        setQuests([]);
      }

    } catch (error) {
      console.error('❌ Error fetching shop quests:', error);
      // If API fails, use mock data for demonstration
      setQuests(getMockQuests());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Mock quests data for demonstration
  const getMockQuests = () => {
    return [
      {
        _id: '1',
        name: 'เช็คอินที่ร้าน',
        description: 'เยี่ยมชมร้านค้าและเช็คอินผ่านแอปพลิเคชัน',
        instructions: '1. ไปที่ร้านค้า\n2. เปิดแอป ThaiQuestify\n3. กดปุ่มเช็คอิน\n4. ถ่ายภาพร้านค้า',
        rewardAmount: 20,
        rewardPoints: 50,
        category: 'check-in',
        difficulty: 'easy',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        currentParticipants: 5,
        maxParticipants: 50,
        verificationType: 'photo',
        requirements: [
          'ต้องอยู่ภายในร้านค้า',
          'ถ่ายภาพให้เห็นบรรยากาศร้าน',
          'แสดงวันที่และเวลาปัจจุบัน'
        ]
      },
      {
        _id: '2',
        name: 'รีวิวร้านค้า',
        description: 'เขียนรีวิวร้านค้าบนแพลตฟอร์มโซเชียลมีเดีย',
        instructions: '1. เขียนรีวิวร้านค้า\n2. โพสต์บน Facebook หรือ Instagram\n3. ส่งลิงก์โพสต์作为证据',
        rewardAmount: 50,
        rewardPoints: 100,
        category: 'review',
        difficulty: 'medium',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        currentParticipants: 12,
        maxParticipants: 30,
        verificationType: 'social-media',
        requirements: [
          'รีวิวต้องมีความยาวอย่างน้อย 50 คำ',
          'ต้องแทกร้านค้าในโพสต์',
          'ตั้งค่าโพสต์เป็นสาธารณะ'
        ]
      },
      {
        _id: '3',
        name: 'แชร์โปรโมชั่น',
        description: 'แชร์โปรโมชั่นพิเศษของร้านค้า',
        instructions: '1. แชร์โพสต์โปรโมชั่น\n2. บน Facebook Story หรือ Instagram Story\n3. ส่งสกรีนช็อต作为证据',
        rewardAmount: 30,
        rewardPoints: 70,
        category: 'social-media',
        difficulty: 'easy',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        currentParticipants: 8,
        maxParticipants: 25,
        verificationType: 'photo',
        requirements: [
          'แชร์บนโซเชียลมีเดีย',
          'แสดงวันที่ในสกรีนช็อต',
          'ตั้งค่า Story เป็นสาธารณะ'
        ]
      }
    ];
  };

  useEffect(() => {
    fetchShopQuests();
  }, [shopId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShopQuests();
  };

  const handleQuestPress = (quest) => {
    setSelectedQuest(quest);
    setShowQuestModal(true);
  };

  const startQuest = () => {
    setShowQuestModal(false);
    setShowVerificationModal(true);
    setVerificationStep(1);
  };

  const handleVerification = async (verificationData) => {
    try {
      console.log('🔍 Starting verification for quest:', selectedQuest._id);

      // Simulate verification process
      setVerificationStep(2); // Processing

      // In real implementation, you would upload images/evidence to server
      setTimeout(async () => {
        try {
          // For demo purposes, we'll simulate a successful completion
          // In real app, you would call: await api.post('/quests/complete', {...})

          setVerificationStep(3); // Success

          // Refresh quests to update participation counts
          setTimeout(() => {
            setShowVerificationModal(false);
            setVerificationStep(0);
            fetchShopQuests(); // Refresh to show updated counts
          }, 2000);

        } catch (error) {
          console.error('❌ Error completing quest:', error);
          setVerificationStep(4); // Error
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Verification error:', error);
      setVerificationStep(4); // Error
    }
  };

  const getQuestEmoji = (category) => {
    const emojis = {
      'social-media': '📱',
      'review': '⭐',
      'check-in': '📍',
      'photo': '📸',
      'purchase': '🛒',
      'video': '🎥',
      'survey': '📝',
      'general': '🎯'
    };
    return emojis[category] || '🎯';
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': '#28a745',
      'medium': '#ffc107',
      'hard': '#dc3545'
    };
    return colors[difficulty] || '#666';
  };

  // Ensure shopInfo has all required fields with fallbacks
  const safeShopInfo = {
    shopName: shopInfo?.shopName || 'ร้านค้า',
    shopType: shopInfo?.shopType || 'ร้านค้าทั่วไป',
    province: shopInfo?.province || 'กรุงเทพมหานคร',
    district: shopInfo?.district || '',
    address: shopInfo?.address || '',
    phone: shopInfo?.phone || '',
    businessHours: shopInfo?.businessHours || 'เปิดทุกวัน 10:00-20:00',
    description: shopInfo?.description || '',
    image: shopInfo?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(shopInfo?.shopName || 'ร้านค้า')}&background=4a6baf&color=fff&size=300`,
    status: shopInfo?.status || 'active'
  };

  const QuestCard = ({ quest }) => (
    <TouchableOpacity
      style={styles.questCard}
      onPress={() => handleQuestPress(quest)}
    >
      <View style={styles.questHeader}>
        <View style={styles.questTitle}>
          <Text style={styles.questEmoji}>{getQuestEmoji(quest.category)}</Text>
          <Text style={styles.questName} numberOfLines={2}>{quest.name}</Text>
        </View>
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quest.difficulty) }]}>
          <Text style={styles.difficultyText}>
            {quest.difficulty === 'easy' ? 'ง่าย' : quest.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
          </Text>
        </View>
      </View>

      <Text style={styles.questDescription} numberOfLines={2}>
        {quest.description}
      </Text>

      <View style={styles.rewardSection}>
        <View style={styles.rewardItem}>
          <Icon name="attach-money" size={16} color="#28a745" />
          <Text style={styles.rewardAmount}>฿{quest.rewardAmount}</Text>
        </View>
        <View style={styles.rewardItem}>
          <Icon name="star" size={16} color="#ffc107" />
          <Text style={styles.rewardPoints}>{quest.rewardPoints} Points</Text>
        </View>
      </View>

      <View style={styles.participantInfo}>
        <View style={styles.participantProgress}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((quest.currentParticipants / (quest.maxParticipants || 50)) * 100, 100)}%`,
                  backgroundColor: quest.currentParticipants >= quest.maxParticipants ? '#dc3545' : '#4a6baf'
                }
              ]}
            />
          </View>
          <Text style={styles.participantText}>
            {quest.currentParticipants}/{quest.maxParticipants || 50} คน
          </Text>
        </View>

        <View style={styles.verificationBadge}>
          <Icon
            name={
              quest.verificationType === 'photo' ? 'camera-alt' :
                quest.verificationType === 'location' ? 'location-on' :
                  'check-circle'
            }
            size={14}
            color="#666"
          />
          <Text style={styles.verificationText}>
            {quest.verificationType === 'photo' ? 'ส่งรูปภาพ' :
              quest.verificationType === 'location' ? 'เช็คอิน' :
                'ยืนยันตัวตน'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const VerificationStep = () => {
    switch (verificationStep) {
      case 1: // Instructions
        return (
          <View style={styles.verificationContent}>
            <Icon name="info" size={50} color="#4a6baf" />
            <Text style={styles.verificationTitle}>ขั้นตอนการทำเควส</Text>
            <Text style={styles.verificationDescription}>
              {selectedQuest?.instructions}
            </Text>

            {selectedQuest?.requirements?.map((req, index) => (
              <View key={index} style={styles.requirementItem}>
                <Icon name="check-circle" size={16} color="#28a745" />
                <Text style={styles.requirementText}>{req}</Text>
              </View>
            ))}

            <View style={styles.verificationButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowVerificationModal(false)}
              >
                <Text style={styles.cancelButtonText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => handleVerification({ startedAt: new Date() })}
              >
                <Text style={styles.confirmButtonText}>เริ่มทำเควส</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 2: // Processing
        return (
          <View style={styles.verificationContent}>
            <ActivityIndicator size="large" color="#4a6baf" />
            <Text style={styles.verificationTitle}>กำลังตรวจสอบ...</Text>
            <Text style={styles.verificationDescription}>
              ระบบกำลังตรวจสอบการทำเควสของคุณ
            </Text>
          </View>
        );

      case 3: // Success
        return (
          <View style={styles.verificationContent}>
            <Icon name="check-circle" size={50} color="#28a745" />
            <Text style={styles.verificationTitle}>ทำเควสสำเร็จ!</Text>
            <Text style={styles.verificationDescription}>
              คุณได้รับ {selectedQuest?.rewardAmount} บาท และ {selectedQuest?.rewardPoints} Points
            </Text>
            <Text style={styles.successSubtext}>
              เงินรางวัลจะถูกโอนเข้าบัญชีภายใน 24 ชั่วโมง
            </Text>
          </View>
        );

      case 4: // Error
        return (
          <View style={styles.verificationContent}>
            <Icon name="error" size={50} color="#dc3545" />
            <Text style={styles.verificationTitle}>เกิดข้อผิดพลาด</Text>
            <Text style={styles.verificationDescription}>
              ไม่สามารถทำเควสได้ในขณะนี้ โปรดลองใหม่ในภายหลัง
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => setShowVerificationModal(false)}
            >
              <Text style={styles.retryButtonText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
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
      {/* <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.shopName} numberOfLines={1}>{safeShopInfo.shopName}</Text>
          <Text style={styles.shopLocation}>
            {safeShopInfo.district && `${safeShopInfo.district}, `}{safeShopInfo.province}
          </Text>
        </View>
      </View> */}

      {/* Shop Info Banner */}
      <View style={styles.shopBanner}>
        <Image
          source={{ uri: safeShopInfo.image }}
          style={styles.shopBannerImage}
          defaultSource={{ uri: 'https://via.placeholder.com/300' }}
        />
        <View style={styles.shopBannerOverlay}>
          <Text style={styles.shopType}>{safeShopInfo.shopName}</Text>
          <Text style={styles.shopType}>{safeShopInfo.shopType}</Text>
          <Text style={styles.businessHours}>⏰ {safeShopInfo.businessHours}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Shop Description */}
        {safeShopInfo.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>เกี่ยวกับร้าน</Text>
            <Text style={styles.descriptionText}>{safeShopInfo.description}</Text>
          </View>
        )}

        {/* Contact Info */}
        {/* {(safeShopInfo.phone || safeShopInfo.address) && (
          <View style={styles.contactSection}>
                      <Text style={styles.contactTitle}>ข้อมูลติดต่อ</Text>
            {safeShopInfo.phone && (
              <View style={styles.contactItem}>
                <Icon name="phone" size={16} color="#4a6baf" />
                <Text style={styles.contactText}>{safeShopInfo.phone}</Text>
              </View>
            )}
            {safeShopInfo.address && (
              <View style={styles.contactItem}>
                <Icon name="location-on" size={16} color="#4a6baf" />
                <Text style={styles.contactText}>{safeShopInfo.address}</Text>
              </View>
            )}
          </View>
        )} */}

        {/* Available Quests Section */}
        <View style={styles.questsSection}>
          <Text style={styles.sectionTitle}>เควสที่มี</Text>
          <Text style={styles.sectionSubtitle}>
            เลือกเควสที่คุณต้องการทำและรับรางวัล
          </Text>

          {quests.length > 0 ? (
            <View style={styles.questsList}>
              {quests.map((quest) => (
                <QuestCard key={quest._id} quest={quest} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="assignment" size={50} color="#ccc" />
              <Text style={styles.emptyStateText}>ยังไม่มีเควสในร้านนี้</Text>
              <Text style={styles.emptyStateSubtext}>
                ร้านค้านี้อาจจะกำลังเตรียมเควสใหม่ โปรดลองใหม่ในภายหลัง
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Quest Detail Modal */}
      <Modal
        visible={showQuestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuestModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedQuest?.name}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQuestModal(false)}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.questDetailDescription}>
                {selectedQuest?.description}
              </Text>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>รางวัล</Text>
                <View style={styles.rewardDetails}>
                  <View style={styles.rewardDetailItem}>
                    <Icon name="attach-money" size={20} color="#28a745" />
                    <Text style={styles.rewardDetailText}>
                      {selectedQuest?.rewardAmount} บาท
                    </Text>
                  </View>
                  <View style={styles.rewardDetailItem}>
                    <Icon name="star" size={20} color="#ffc107" />
                    <Text style={styles.rewardDetailText}>
                      {selectedQuest?.rewardPoints} Points
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>วิธีการทำ</Text>
                <Text style={styles.instructionsText}>
                  {selectedQuest?.instructions}
                </Text>
              </View>

              {selectedQuest?.requirements?.length > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>ข้อกำหนด</Text>
                  {selectedQuest.requirements.map((req, index) => (
                    <View key={index} style={styles.requirementDetailItem}>
                      <Icon name="check-circle" size={16} color="#28a745" />
                      <Text style={styles.requirementDetailText}>{req}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>ข้อมูลเพิ่มเติม</Text>
                <View style={styles.questMeta}>
                  <View style={styles.metaItem}>
                    <Icon name="people" size={16} color="#666" />
                    <Text style={styles.metaText}>
                      {selectedQuest?.currentParticipants}/{selectedQuest?.maxParticipants || 50} คน
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon name="schedule" size={16} color="#666" />
                    <Text style={styles.metaText}>
                      หมดเขต {new Date(selectedQuest?.endDate).toLocaleDateString('th-TH')}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.startQuestButton}
                onPress={startQuest}
              >
                <Text style={styles.startQuestButtonText}>เริ่มทำเควส</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Verification Modal */}
      <Modal
        visible={showVerificationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowVerificationModal(false);
          setVerificationStep(0);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.verificationModalContent}>
            <VerificationStep />
          </View>
        </View>
      </Modal>
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
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shopLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  shopBanner: {
    height: 120,
    position: 'relative',
  },
  shopBannerImage: {
    width: '100%',
    height: '100%',
  },
  shopBannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
  },
  shopType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  businessHours: {
    fontSize: 12,
    color: 'white',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  questsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  questsList: {
    gap: 12,
  },
  questCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  questTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  questEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  questName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  rewardSection: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  rewardPoints: {
    fontSize: 14,
    color: '#ffc107',
    fontWeight: '500',
  },
  participantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantProgress: {
    flex: 1,
    marginRight: 12,
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
  participantText: {
    fontSize: 11,
    color: '#666',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verificationText: {
    fontSize: 11,
    color: '#666',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  questDetailDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rewardDetails: {
    gap: 12,
  },
  rewardDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardDetailText: {
    fontSize: 16,
    fontWeight: '500',
  },
  instructionsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  requirementDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  requirementDetailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  questMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  startQuestButton: {
    backgroundColor: '#4a6baf',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startQuestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verificationModalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
    alignSelf: 'stretch',
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  verificationButtons: {
    flexDirection: 'row',
    gap: 12,
    alignSelf: 'stretch',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4a6baf',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4a6baf',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ShopQuestsScreen;