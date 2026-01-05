// src/screens/QuestDetails.js - UPDATED WITH CUSTOMER PARTICIPATION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
  Linking,
  Image,
  Dimensions
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { shopAPI } from '../services/shopService';
import api from '../services/api';

const { width } = Dimensions.get('window');

const QuestDetails = ({ route, navigation }) => {
  const { questId } = route.params;
  const { user } = useAuth();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isParticipating, setIsParticipating] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    loadQuestDetails();
    checkParticipation();
  }, [questId]);

  const loadQuestDetails = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading quest details:', questId);

      // Try multiple endpoints to get quest data
      let questData = null;

      try {
        // Try shopAPI first
        const response = await api.get(`/quests/${questId}`);
        if (response.data.success) {
          questData = response.data.data;
        }
      } catch (error) {
        console.log('⚠️ First method failed, trying alternative...');
        // Try alternative endpoint
        const altResponse = await api.get(`/shop/quests/${questId}`);
        if (altResponse.data) {
          questData = altResponse.data;
        }
      }

      if (!questData) {
        throw new Error('Quest not found');
      }

      setQuest(questData);
      console.log('✅ Quest loaded:', questData.name);

    } catch (error) {
      console.error('❌ Error loading quest details:', error);
      Alert.alert('Error', 'Failed to load quest details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkParticipation = async () => {
    if (!user) return;

    try {
      // Check if user is already participating in this quest
      const response = await api.get(`/users/${user._id}/quests`);
      const userQuests = response.data.data || [];

      const isParticipant = userQuests.some(userQuest =>
        userQuest.questId === questId || userQuest.quest === questId
      );

      setIsParticipating(isParticipant);

      // Check if already verified
      if (isParticipant) {
        const participation = userQuests.find(q => q.questId === questId || q.quest === questId);
        setIsVerified(participation?.status === 'completed' || participation?.verified === true);
      }
    } catch (error) {
      console.error('Error checking participation:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuestDetails();
    checkParticipation();
  };

  // FACEBOOK VERIFICATION FUNCTIONS
  // In QuestDetails.js - Update the handleFacebookVerification function
  const handleFacebookVerification = async () => {
    if (!quest || quest.type !== 'facebook_follow') {
      Alert.alert('Error', 'This is not a Facebook follow quest');
      return;
    }

    const facebookPage = {
      pageId: quest.facebookPageId || quest.requiredData?.facebookPageId,
      pageName: quest.facebookPageName || quest.requiredData?.facebookPageName,
      pageUrl: quest.facebookPageUrl || quest.requiredData?.facebookPageUrl
    };

    if (!facebookPage.pageId) {
      Alert.alert('Error', 'Facebook page information is not available');
      return;
    }

    setVerificationLoading(true);

    try {
      console.log(`🔍 Starting real Facebook verification for page: ${facebookPage.pageId}`);

      // Show permission explanation
      Alert.alert(
        'Facebook Permission Required',
        'To verify that you follow the Facebook page, we need:\n\n1. Your public profile\n2. List of pages you like\n\nThis is required to check your page likes.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: async () => {
              try {
                // First, mark as participating if not already
                if (!isParticipating) {
                  const participated = await participateInQuest();
                  if (!participated) {
                    setVerificationLoading(false);
                    return;
                  }
                }

                // REAL FACEBOOK VERIFICATION
                const verificationResult = await FacebookService.verifyFacebookFollow(facebookPage.pageId);

                if (verificationResult.success && verificationResult.isFollowing) {
                  // SUCCESS: User follows the page
                  console.log('✅ Facebook verification successful!');

                  // Prepare verification data for backend
                  const verificationData = {
                    ...verificationResult.verificationData,
                    ...verificationResult.userData,
                    pageId: facebookPage.pageId,
                    pageName: facebookPage.pageName,
                    verificationMethod: 'facebook_api',
                    timestamp: new Date().toISOString()
                  };

                  Alert.alert(
                    'Success! 🎉',
                    `Verified! You follow ${facebookPage.pageName}.`,
                    [
                      {
                        text: 'Claim Reward',
                        onPress: () => claimQuestReward(verificationData)
                      }
                    ]
                  );

                } else if (verificationResult.success && !verificationResult.isFollowing) {
                  // User doesn't follow the page
                  Alert.alert(
                    'Not Following Yet',
                    `You need to follow "${facebookPage.pageName}" first.\n\nPlease:\n1. Open the Facebook page\n2. Click "Like" or "Follow"\n3. Try verification again`,
                    [
                      {
                        text: 'Open Facebook Page',
                        onPress: () => Linking.openURL(
                          facebookPage.pageUrl ||
                          `https://facebook.com/${facebookPage.pageId}`
                        ).catch(() => {
                          Alert.alert('Cannot Open Facebook', 'Please install Facebook app');
                        })
                      },
                      {
                        text: 'Try Again',
                        onPress: () => handleFacebookVerification()
                      },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );

                } else {
                  // Verification failed
                  Alert.alert(
                    'Verification Failed',
                    verificationResult.error || 'Facebook verification failed. Please try again.',
                    [{ text: 'OK' }]
                  );
                }

              } catch (error) {
                console.error('Verification error:', error);
                Alert.alert(
                  'Error',
                  error.message || 'Facebook verification failed. Please try again.'
                );
              } finally {
                setVerificationLoading(false);
              }
            }
          }
        ]
      );

    } catch (error) {
      setVerificationLoading(false);
      console.error('Verification setup error:', error);
      Alert.alert('Error', 'Failed to start verification');
    }
  };

  const verifyFacebookFollow = async (facebookPage) => {
    // This is a mock function - you'll need to implement real Facebook SDK
    // For now, we'll simulate verification

    // TODO: Replace with real Facebook SDK implementation
    // const facebookData = await FacebookService.loginAndVerify(facebookPage.pageId);

    // Mock verification (always returns true for testing)
    const mockVerification = {
      success: true,
      data: {
        facebookUserId: 'mock_user_123',
        facebookUserName: user?.name || 'Test User',
        verifiedAt: new Date().toISOString(),
        pageId: facebookPage.pageId,
        pageName: facebookPage.pageName
      }
    };

    return mockVerification;
  };

  const participateInQuest = async () => {
    try {
      const response = await api.post(`/quests/${questId}/participate`, {
        userId: user._id
      });

      if (response.data.success) {
        setIsParticipating(true);
        console.log('✅ Now participating in quest');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error participating in quest:', error);
      Alert.alert('Error', 'Failed to join quest');
      return false;
    }
  };

  const claimQuestReward = async (verificationData) => {
    try {
      const response = await api.post(`/quests/${questId}/complete`, {
        userId: user._id,
        verificationData: verificationData
      });

      if (response.data.success) {
        setIsVerified(true);
        Alert.alert(
          'Reward Claimed! 🎊',
          `You received ฿${quest.rewardAmount} and ${quest.rewardPoints} points!`,
          [{ text: 'Great!', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      Alert.alert('Error', 'Failed to claim reward');
    }
  };

  const handleFollowOnFacebook = () => {
    if (!quest) return;

    const pageUrl = quest.facebookPageUrl ||
      quest.requiredData?.facebookPageUrl ||
      `https://facebook.com/${quest.facebookPageId}`;

    Linking.openURL(pageUrl).catch(() => {
      Alert.alert('Error', 'Could not open Facebook. Please install Facebook app.');
    });
  };

  const handleToggleActive = async () => {
    try {
      setActionLoading(true);
      await shopAPI.toggleQuestActive(questId);
      Alert.alert('Success', `Quest ${!quest.isActive ? 'activated' : 'deactivated'} successfully`);
      loadQuestDetails(); // Refresh data
    } catch (error) {
      console.error('❌ Error toggling quest:', error);
      Alert.alert('Error', 'Failed to update quest status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShareQR = async () => {
    try {
      const shareUrl = `thaiquestify://quest/${quest.qrCode}`;
      await Share.share({
        message: `Join this quest: ${quest.name}\n\n${quest.description}\n\nUse QR Code: ${quest.qrCode}\nOr click: ${shareUrl}`,
        title: quest.name
      });
    } catch (error) {
      console.error('❌ Error sharing:', error);
    }
  };

  const handleViewSubmissions = () => {
    navigation.navigate('QuestSubmissions', { questId: questId });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysLeft = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      active: '#28a745',
      paused: '#ffc107',
      completed: '#17a2b8',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  // RENDER CUSTOMER PARTICIPATION SECTION
  const renderCustomerParticipation = () => {
    if (!user || user.userType === 'shop' || user.userType === 'admin') {
      return null; // Don't show participation for shop owners/admins
    }

    if (quest.type !== 'facebook_follow') {
      return (
        <View style={styles.participationCard}>
          <Text style={styles.participationTitle}>📋 Regular Quest</Text>
          <Text style={styles.participationText}>
            This quest requires manual verification. Please follow the instructions and submit evidence.
          </Text>
          <TouchableOpacity style={styles.participateButton}>
            <Text style={styles.participateButtonText}>Participate in Quest</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // FACEBOOK QUEST PARTICIPATION UI
    const facebookPageName = quest.facebookPageName || quest.requiredData?.facebookPageName || 'Facebook Page';
    const facebookPageUrl = quest.facebookPageUrl || quest.requiredData?.facebookPageUrl;

    return (
      <View style={styles.participationCard}>
        <Text style={styles.participationTitle}>📘 Facebook Follow Quest</Text>

        {/* Facebook Page Info */}
        <View style={styles.facebookInfo}>
          <Icon name="thumb-up" size={24} color="#1877f2" />
          <View style={styles.facebookInfoText}>
            <Text style={styles.facebookPageName}>{facebookPageName}</Text>
            {facebookPageUrl && (
              <Text style={styles.facebookPageUrl}>{facebookPageUrl}</Text>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>How to complete:</Text>
          {quest.instructions?.split('\n').map((step, index) => (
            <View key={index} style={styles.instructionStep}>
              <Text style={styles.stepNumber}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          )) || (
              <>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>1</Text>
                  <Text style={styles.stepText}>Follow the Facebook page above</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>2</Text>
                  <Text style={styles.stepText}>Click "Verify Now" button</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>3</Text>
                  <Text style={styles.stepText}>Login with Facebook</Text>
                </View>
                <View style={styles.instructionStep}>
                  <Text style={styles.stepNumber}>4</Text>
                  <Text style={styles.stepText}>Get rewarded automatically</Text>
                </View>
              </>
            )}
        </View>

        {/* Status Indicators */}
        {isVerified ? (
          <View style={styles.verifiedStatus}>
            <Icon name="verified" size={40} color="#28a745" />
            <Text style={styles.verifiedText}>Quest Completed!</Text>
            <Text style={styles.rewardText}>
              You earned ฿{quest.rewardAmount} + {quest.rewardPoints} points
            </Text>
          </View>
        ) : isParticipating ? (
          <View style={styles.participatingStatus}>
            <Icon name="hourglass-empty" size={40} color="#ffc107" />
            <Text style={styles.participatingText}>Waiting for verification...</Text>
          </View>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isVerified && (
            <>
              <TouchableOpacity
                style={styles.followButton}
                onPress={handleFollowOnFacebook}
              >
                <Icon name="facebook" size={20} color="white" />
                <Text style={styles.followButtonText}>Open Facebook Page</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.verifyButton, verificationLoading && styles.buttonDisabled]}
                onPress={handleFacebookVerification}
                disabled={verificationLoading}
              >
                {verificationLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="verified" size={20} color="white" />
                    <Text style={styles.verifyButtonText}>
                      {isParticipating ? 'Verify Now' : 'Join & Verify'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Reward Info */}
        <View style={styles.rewardInfo}>
          <Text style={styles.rewardTitle}>🎁 Reward</Text>
          <View style={styles.rewardDetails}>
            <View style={styles.rewardItem}>
              <Icon name="attach-money" size={20} color="#28a745" />
              <Text style={styles.rewardAmount}>฿{quest.rewardAmount}</Text>
            </View>
            <View style={styles.rewardItem}>
              <Icon name="star" size={20} color="#ffc107" />
              <Text style={styles.rewardPoints}>{quest.rewardPoints} points</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>Loading quest details...</Text>
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Quest Not Found</Text>
        <Text style={styles.errorText}>The requested quest could not be found.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const daysLeft = calculateDaysLeft(quest.endDate);
  const participationRate = ((quest.currentParticipants / quest.maxParticipants) * 100).toFixed(1);
  const budgetUtilization = ((quest.totalSpent / quest.budget) * 100).toFixed(1);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Quest Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(quest.status) }]}>
          <Text style={styles.statusBannerText}>
            {quest.status.toUpperCase()} • {daysLeft} DAYS LEFT
          </Text>
        </View>

        {/* CUSTOMER PARTICIPATION SECTION - ADD THIS AT THE TOP */}
        {renderCustomerParticipation()}

        {/* Basic Info Card */}
        <View style={styles.card}>
          <Text style={styles.questName}>{quest.name}</Text>
          <Text style={styles.questDescription}>{quest.description}</Text>

          {/* Show Quest Type Badge */}
          {quest.type === 'facebook_follow' && (
            <View style={styles.typeBadge}>
              <Icon name="facebook" size={16} color="white" />
              <Text style={styles.typeBadgeText}>Facebook Follow Quest</Text>
            </View>
          )}

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Quest ID</Text>
              <Text style={styles.metaValue}>{quest._id}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>QR Code</Text>
              <Text style={styles.metaValue}>{quest.qrCode}</Text>
            </View>
          </View>
        </View>

        {/* Statistics Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📊 Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{quest.currentParticipants}</Text>
              <Text style={styles.statLabel}>Current</Text>
              <Text style={styles.statSubtext}>of {quest.maxParticipants}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{participationRate}%</Text>
              <Text style={styles.statLabel}>Filled</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${participationRate}%` }
                  ]}
                />
              </View>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{quest.submissions?.length || 0}</Text>
              <Text style={styles.statLabel}>Submissions</Text>
            </View>
          </View>
        </View>

        {/* Financial Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Financials</Text>
          <View style={styles.financialGrid}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Total Budget</Text>
              <Text style={styles.financialValue}>฿{quest.budget?.toLocaleString() || 0}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Reward per User</Text>
              <Text style={styles.financialValue}>฿{quest.rewardAmount || 0}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Points per User</Text>
              <Text style={styles.financialValue}>{quest.rewardPoints || 0}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Total Spent</Text>
              <Text style={styles.financialValue}>฿{(quest.totalSpent || 0).toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.budgetProgress}>
            <Text style={styles.budgetLabel}>Budget Utilization: {budgetUtilization}%</Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${budgetUtilization}%`, backgroundColor: '#28a745' }
                ]}
              />
            </View>
          </View>
        </View>

        {/* Actions Card (for shop owners) */}
        {user?.userType === 'shop' || user?.userType === 'admin' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⚡ Shop Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={handleShareQR}
              >
                <Text style={styles.actionButtonText}>Share QR Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={handleViewSubmissions}
              >
                <Text style={styles.actionButtonText}>View Submissions ({quest.submissions?.length || 0})</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  quest.isActive ? styles.warningAction : styles.successAction
                ]}
                onPress={handleToggleActive}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {quest.isActive ? 'Pause Quest' : 'Activate Quest'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Quick Actions Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Quest ID: {quest._id} • Last updated: {formatDate(quest.updatedAt)}
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4a6baf',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusBannerText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  questName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a6baf',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 10,
    color: '#888',
  },
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  financialItem: {
    width: '48%',
  },
  financialLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  budgetProgress: {
    marginTop: 8,
  },
  budgetLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e9ecef',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a6baf',
    borderRadius: 3,
  },
  timeline: {
    gap: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  timelineLabel: {
    fontSize: 14,
    color: '#666',
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: '#4a6baf',
  },
  secondaryAction: {
    backgroundColor: '#6c757d',
  },
  successAction: {
    backgroundColor: '#28a745',
  },
  warningAction: {
    backgroundColor: '#ffc107',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  participationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  participationTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  participationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  facebookInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1877f2',
  },
  facebookInfoText: {
    flex: 1,
    marginLeft: 12,
  },
  facebookPageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1877f2',
  },
  facebookPageUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  instructionsBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4a6baf',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  verifiedStatus: {
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#c3e6cb',
  },
  verifiedText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
    marginTop: 8,
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 16,
    color: '#155724',
  },
  participatingStatus: {
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#ffeaa7',
  },
  participatingText: {
    fontSize: 16,
    color: '#856404',
    marginTop: 8,
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877f2',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  followButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  rewardInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  rewardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  rewardPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffc107',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1877f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  participateButton: {
    backgroundColor: '#4a6baf',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  participateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuestDetails;