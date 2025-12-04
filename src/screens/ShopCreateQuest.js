// src/screens/ShopCreateQuest.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Picker
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { questTemplateAPI } from '../services/questTemplateService';
import { shopAPI } from '../services/shopService';

const ShopCreateQuest = ({ navigation, route }) => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployLoading, setDeployLoading] = useState(false);
  const [userShop, setUserShop] = useState(null);
  const [availableShops, setAvailableShops] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedShop, setSelectedShop] = useState("")
  const [shopDataInfo, setShopDataInfo] = useState({shId: "", shName: "", shopId: ""})
  
  const [questConfig, setQuestConfig] = useState({
    budget: '',
    maxParticipants: '',
    duration: '7',
    selectedShopId: ''
  });

  useEffect(() => {
    // ตรวจสอบบทบาทผู้ใช้ก่อนโหลด templates
    if (user?.userType === 'shop' || user?.userType === 'admin') {
      loadUserShopData();
      console.log("get shopid:", route.params)
      setShopDataInfo(route.params)
    } else {
      Alert.alert(
        'Access Denied',
        'Only shop owners and admins can create quests.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [user], selectedShop);

  const loadUserShopData = async () => {
  try {
    setShopLoading(true);
    
    if (user?.userType === 'shop') {
      // สำหรับ shop owner: โหลดข้อมูลร้านของตัวเองโดยใช้ email
      console.log('🛍️ Loading shop data for user email:', user.email);
      
      let shopData;
      
      // Try the main method first
      try {
        shopData = await shopAPI.getShopByOwnerEmail(user.email);
        // console.log(shopData[0].shopId)
      } catch (error) {
        console.log('🔄 Falling back to alternative method...');
        // If main method fails, try alternative
        shopData = await shopAPI.getShopByOwnerEmailAlternative(user.email);
      }
      console.log("out", shopData)
      // setQuestConfig(prev => ({ 
      //     ...prev, 
      //     selectedShopId: shopData 
      //   }));
      if (shopData && shopData.length > 0) {
        console.log("here",shopData)
        // const userShop = shopData[0]; // ใช้ร้านแรกที่พบ
        // console.log('✅ Found user shop:', userShop.shopName, 'for email:', user.email);
        setUserShop(shopData);
        setQuestConfig(prev => ({ 
          ...prev, 
          selectedShopId: shopData
        }));
      } else {
        console.log('❌ No shop found for user email:', user.email);
        Alert.alert(
          'Shop Not Found',
          `No shop registered for your account (${user.email}). Please register a shop first.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
    } else if (user?.userType === 'admin') {
      // สำหรับ admin: โหลดรายการร้านค้าทั้งหมด
      console.log('👨‍💼 Loading all shops for admin');
      const shopsResponse = await shopAPI.getAllShops();
      const shops = shopsResponse.data || shopsResponse; // Handle both response formats
      const activeShops = shops.filter(shop => shop.isActive && !shop.isDeleted);
      console.log('✅ Available shops:', activeShops.length);
      setAvailableShops(activeShops);
      
      if (activeShops.length > 0) {
        setQuestConfig(prev => ({ 
          ...prev, 
          selectedShopId: activeShops[0]._id 
        }));
      }
    }
    
    // โหลด templates หลังจากโหลดข้อมูลร้านค้าเสร็จ
    await loadTemplates();
    
  } catch (error) {
    console.error('❌ Error loading shop data:', error);
    Alert.alert('Error', 'Failed to load shop information.');
  } finally {
    setShopLoading(false);
  }
};

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading templates for:', user?.userType);
      
      const data = await questTemplateAPI.getAllTemplates();
      console.log('📦 Received templates:', data.length);
      
      // Filter only active templates
      const activeTemplates = data.filter(template => template.isActive);
      console.log('✅ Active templates:', activeTemplates.length);
      
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      Alert.alert('Error', 'Failed to load templates. Please check your connection and try again.');
      setTemplates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserShopData();
  };

  const handleSelectTemplate = (template,email) => {
    console.log('🎯 Selected template:', template.name);
    console.log("email owner:", email)
    console.log("usershop:",questConfig.selectedShopId)
    setSelectedTemplate(template);
    
    // คำนวณ budget เริ่มต้นที่สมเหตุสมผล
    const suggestedBudget = template.rewardAmount * 20; // 20 participants as default
    const suggestedParticipants = Math.max(20, Math.floor(suggestedBudget / template.rewardAmount));
    
    setQuestConfig(prev => ({
      ...prev,
      budget: suggestedBudget.toString(),
      maxParticipants: suggestedParticipants.toString(),
      duration: '7',
      emailOwner: email
    }));
    setShowDeployModal(true);
  };

  // In ShopCreateQuest.js - Update handleDeployQuest function
const handleDeployQuest = async () => {
  console.log('🚀 Deploying quest...');
  
  // Validation
  if (!questConfig.budget || !questConfig.maxParticipants) {
    Alert.alert('Error', 'Please fill in all required fields');
    return;
  }

  if (!questConfig.selectedShopId) {
    Alert.alert('Error', 'Please select a shop');
    return;
  }

  const budget = parseFloat(questConfig.budget);
  const maxParticipants = parseInt(questConfig.maxParticipants);

  if (budget <= 0) {
    Alert.alert('Error', 'Budget must be greater than 0');
    return;
  }

  if (maxParticipants <= 0) {
    Alert.alert('Error', 'Max participants must be greater than 0');
    return;
  }

  try {
    setDeployLoading(true);
    
    // Prepare quest data with Facebook information if applicable
    const questData = {
      templateId: selectedTemplate._id,
      shopId: shopDataInfo.shId,
      budget: budget,
      maxParticipants: maxParticipants,
      duration: parseInt(questConfig.duration)
    };

    console.log('📤 Sending quest data to backend:', questData);
    
    // Make sure you're using the correct API endpoint
    const response = await shopAPI.createQuestFromTemplate(questData);
    console.log('✅ Quest deployed successfully:', response);
    
    // Show Facebook-specific success message
    let successMessage = `Quest "${selectedTemplate.name}" deployed successfully!\n\n`;
    successMessage += `• Shop: ${shopDataInfo.shName}\n`;
    successMessage += `• Budget: ฿${budget.toLocaleString()}\n`;
    successMessage += `• Max Participants: ${maxParticipants}\n`;
    successMessage += `• Reward per User: ฿${(budget/maxParticipants).toFixed(2)}\n`;
    successMessage += `• Duration: ${questConfig.duration} days\n`;
    
    // Add Facebook-specific info if this is a Facebook quest
    if (selectedTemplate.type === 'facebook_follow') {
      successMessage += `\n📘 Facebook Page:\n`;
      successMessage += `• Page: ${selectedTemplate.requiredData?.facebookPageName || 'N/A'}\n`;
      successMessage += `• Verification: Automatic Facebook API\n`;
    }
    
    setShowDeployModal(false);
    setSelectedTemplate(null);
    
    // In ShopCreateQuest.js - Update the success Alert in handleDeployQuest
Alert.alert(
  'Success!', 
  successMessage,
  [
    {
      text: 'View My Quests',
      onPress: () => {
        console.log(shopDataInfo)
        // Navigate to ShopQuests with the shop data
        navigation.navigate('ShopQuests', { 
          shopId: shopDataInfo.shId,
          shopName: shopDataInfo.shName,
          userId: user._id
        });
      }
    },
    {
      text: 'Create Another',
      onPress: () => {
        loadTemplates();
        setQuestConfig(prev => ({ 
          ...prev, 
          budget: '', 
          maxParticipants: '', 
          duration: '7' 
        }));
      },
      style: 'cancel'
    }
  ]
);
    
  } catch (error) {
    console.error('❌ Error deploying quest:', error);
    
    let errorMessage = 'Failed to deploy quest. Please try again.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('Deployment Failed', errorMessage);
  } finally {
    setDeployLoading(false);
  }
};

  const getTypeIcon = (type) => {
    const icons = {
      social_media: '📱',
      website_visit: '🌐',
      content_creation: '📝',
      product_review: '⭐',
      location_checkin: '📍'
    };
    return icons[type] || '📋';
  };

  const getVerificationMethodLabel = (method) => {
    const labels = {
      screenshot: 'Screenshot',
      manual_review: 'Manual Review',
      link_click: 'Link Click',
      location_verification: 'Location Verification'
    };
    return labels[method] || method;
  };

  // ตรวจสอบบทบาทผู้ใช้
  if (user?.userType !== 'shop' && user?.userType !== 'admin') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Create Quest</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            Only shop owners and administrators can create quests.
          </Text>
          <TouchableOpacity 
            style={styles.backToDashboardButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.backToDashboardText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading || shopLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>
          {shopLoading ? 'Loading shop information...' : 'Loading templates...'}
        </Text>
        <Text style={styles.loadingSubtext}>
          {user?.userType === 'admin' 
            ? 'Admin mode: Can create quests for any shop' 
            : 'Shop owner mode: Creating quests for your shop'
          }
        </Text>
      </View>
    );
  }

  // ตรวจสอบว่ามีร้านค้าให้ใช้งานหรือไม่
  if (user?.userType === 'shop' && !userShop) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Create Quest</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Shop Found</Text>
          <Text style={styles.errorText}>
            You need to register a shop before creating quests.
          </Text>
          <TouchableOpacity 
            style={styles.backToDashboardButton}
            onPress={() => navigation.navigate('ShopRegistration')}
          >
            <Text style={styles.backToDashboardText}>Register Shop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (user?.userType === 'admin' && availableShops.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Create Quest</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>No Shops Available</Text>
          <Text style={styles.errorText}>
            There are no active shops available to create quests for.
          </Text>
          <TouchableOpacity 
            style={styles.backToDashboardButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.backToDashboardText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Quest</Text>
          <Text style={styles.subtitle}>
            {user?.userType === 'admin' 
              ? 'Admin: Create quests for any shop' 
              : `Creating quests for: ${userShop?.shopName}`
            }
          </Text>
        </View>
      </View> */}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* User Role Info */}
        <View style={styles.roleInfo}>
  <Text style={styles.roleText}>
    👤 {user?.userType === 'admin' ? 'Administrator Mode' : 'Shop Owner Mode'}
  </Text>
  {user?.userType === 'admin' ? (
    <Text style={styles.roleSubtext}>
      You can create quests for any shop. Select the target shop below.
    </Text>
  ) : (
    <Text style={styles.roleSubtext}>
      Creating quests for: <Text style={styles.shopName}>{userShop?.shopName}</Text>
      {user?.email && (
                  <Text style={styles.emailText}>Shop Name: {shopDataInfo.shName} ID: {shopDataInfo.shId}</Text>
      )}
    </Text>
  )}
</View>

        {/* Status Info */}
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>
            {templates.length} available templates
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{templates.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {templates.filter(t => t.type === 'social_media').length}
            </Text>
            <Text style={styles.statLabel}>Social</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {templates.filter(t => t.type === 'location_checkin').length}
            </Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
        </View>

        {/* Templates Grid */}
        <View style={styles.templatesGrid}>
          {templates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Templates Available</Text>
              <Text style={styles.emptyStateText}>
                All quest templates are currently inactive or under maintenance.
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Please contact the administrator or check back later.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadTemplates}
              >
                <Text style={styles.retryButtonText}>🔄 Refresh Templates</Text>
              </TouchableOpacity>
            </View>
          ) : (
            templates.map(template => (
              <TouchableOpacity 
                key={template._id} 
                style={styles.templateCard}
                onPress={() => handleSelectTemplate(template,user.email)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.typeIcon}>
                    <Text style={styles.typeIconText}>{getTypeIcon(template.type)}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateCategory}>{template.category}</Text>
                  </View>
                </View>
                
                <Text style={styles.templateDescription} numberOfLines={2}>
                  {template.description}
                </Text>

                <View style={styles.rewardSection}>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardLabel}>Points</Text>
                    <Text style={styles.rewardValue}>{template.rewardPoints}</Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardLabel}>Cash</Text>
                    <Text style={styles.rewardValue}>฿{template.rewardAmount}</Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <Text style={styles.rewardLabel}>Time</Text>
                    <Text style={styles.rewardValue}>{template.estimatedTime}m</Text>
                  </View>
                </View>

                <View style={styles.verificationBadge}>
                  <Text style={styles.verificationText}>
                    {getVerificationMethodLabel(template.verificationMethod)}
                  </Text>
                </View>

                <TouchableOpacity style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Select Template</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Deploy Quest Modal */}
      <Modal
  visible={showDeployModal}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setShowDeployModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deploy Quest For: {shopDataInfo.shName}</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => setShowDeployModal(false)}
        >
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      {selectedTemplate && (
        <ScrollView style={styles.modalContent}>
          {/* Template Preview */}
          <View style={styles.templatePreview}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewIcon}>{getTypeIcon(selectedTemplate.type)}</Text>
              <View>
                <Text style={styles.previewName}>{selectedTemplate.name}</Text>
                <Text style={styles.previewCategory}>{selectedTemplate.category}</Text>
              </View>
            </View>
            <Text style={styles.previewDescription}>{selectedTemplate.description}</Text>
          </View>

          {/* Configuration Form */}
          <View style={styles.configSection}>
            {/* <Text style={styles.sectionTitle}>Quest Configuration</Text> */}
            
            {/* Shop Selection */}
            
            {/* Budget and Participants */}
            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={styles.label}>Total Budget (THB) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter total budget"
                  keyboardType="numeric"
                  value={questConfig.budget}
                  onChangeText={(text) => setQuestConfig(prev => ({ ...prev, budget: text }))}
                />
              </View>
              
              <View style={styles.formColumn}>
                <Text style={styles.label}>Max Participants *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter max participants"
                  keyboardType="numeric"
                  value={questConfig.maxParticipants}
                  onChangeText={(text) => setQuestConfig(prev => ({ ...prev, maxParticipants: text }))}
                />
              </View>
            </View>

            <Text style={styles.label}>Duration (Days)</Text>
            <TextInput
              style={styles.input}
              placeholder="7"
              keyboardType="numeric"
              value={questConfig.duration}
              onChangeText={(text) => setQuestConfig(prev => ({ ...prev, duration: text }))}
            />

            {/* Cost Calculation */}
            <View style={styles.calculationBox}>
              <Text style={styles.calculationTitle}>Cost Calculation</Text>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Reward per user:</Text>
                <Text style={styles.calculationValue}>
                  ฿{(parseFloat(questConfig.budget || 0) / parseInt(questConfig.maxParticipants || 1)).toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Max participants:</Text>
                <Text style={styles.calculationValue}>{questConfig.maxParticipants || '0'}</Text>
              </View>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Template reward:</Text>
                <Text style={styles.calculationValue}>฿{selectedTemplate.rewardAmount}</Text>
              </View>
              
              <View style={styles.calculationRow}>
                <Text style={styles.calculationLabel}>Selected shop:</Text>
                <Text style={styles.calculationValue}>
                  {user?.userType === 'admin' 
                    ? availableShops.find(s => s._id === questConfig.selectedShopId)?.shopName || 'Not selected'
                    : userShop?.shopName
                  }
                </Text>
              </View>
              
              <View style={[styles.calculationRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total budget:</Text>
                <Text style={styles.totalValue}>
                  ฿{parseFloat(questConfig.budget || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Validation Messages */}
            {questConfig.budget && questConfig.maxParticipants && (
              <View style={styles.validationBox}>
                <Text style={styles.validationTitle}>Validation</Text>
                
                {/* Reward per user validation */}
                {((parseFloat(questConfig.budget) / parseInt(questConfig.maxParticipants)) < 5) && (
                  <View style={styles.validationWarning}>
                    <Text style={styles.validationWarningText}>⚠️ Reward per user is low (less than ฿5)</Text>
                  </View>
                )}
                
                {/* Budget validation */}
                {(parseFloat(questConfig.budget) < selectedTemplate.rewardAmount) && (
                  <View style={styles.validationError}>
                    <Text style={styles.validationErrorText}>❌ Budget too low for template reward</Text>
                  </View>
                )}
                
                {/* Success validation */}
                {((parseFloat(questConfig.budget) / parseInt(questConfig.maxParticipants)) >= 5 && 
                  parseFloat(questConfig.budget) >= selectedTemplate.rewardAmount) && (
                  <View style={styles.validationSuccess}>
                    <Text style={styles.validationSuccessText}>✅ Configuration looks good!</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <View style={styles.modalActions}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.cancelButton]}
          onPress={() => setShowDeployModal(false)}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.modalButton, 
            styles.deployButton,
            (!questConfig.selectedShopId || !questConfig.budget || !questConfig.maxParticipants) && styles.deployButtonDisabled
          ]}
          onPress={handleDeployQuest}
          disabled={deployLoading || !questConfig.selectedShopId || !questConfig.budget || !questConfig.maxParticipants}
        >
          {deployLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.deployButtonText}>
              {user?.userType === 'admin' ? 'Deploy as Admin' : 'Deploy Quest'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a6baf',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  typeIconText: {
    fontSize: 16,
  },
  cardInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  templateCategory: {
    fontSize: 11,
    color: '#4a6baf',
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
    lineHeight: 16,
  },
  rewardSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
  },
  rewardItem: {
    alignItems: 'center',
  },
  rewardLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 2,
  },
  rewardValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  verificationBadge: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 10,
    color: '#155724',
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#4a6baf',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    width: '100%',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  templatePreview: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  previewCategory: {
    fontSize: 14,
    color: '#4a6baf',
    fontWeight: '600',
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  configSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  picker: {
    height: 50,
  },
  shopDisplay: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  shopDisplayText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  calculationBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  calculationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1877f2',
    marginBottom: 12,
  },
  calculationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: '#666',
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a6baf',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  deployButton: {
    backgroundColor: '#28a745',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  deployButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  statusInfo: {
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#155724',
    fontWeight: '600',
  },
  roleInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  roleSubtext: {
    fontSize: 12,
    color: '#1976d2',
    opacity: 0.8,
  },
  shopName: {
    fontWeight: 'bold',
    color: '#155724',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    lineHeight: 22,
  },
  backToDashboardButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToDashboardText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emailText: {
  fontSize: 11,
  color: '#666',
  fontStyle: 'italic',
  },
  shopSelectionSection: {
  marginBottom: 16,
},
pickerContainer: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  backgroundColor: 'white',
  marginBottom: 8,
},
picker: {
  height: 50,
},
pickerHelpText: {
  fontSize: 12,
  color: '#666',
  fontStyle: 'italic',
  marginTop: 4,
},
noShopsContainer: {
  backgroundColor: '#f8f9fa',
  padding: 16,
  borderRadius: 8,
  alignItems: 'center',
},
noShopsText: {
  color: '#666',
  fontSize: 14,
},
shopDisplay: {
  backgroundColor: '#f8f9fa',
  padding: 12,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#e0e0e0',
},
shopInfo: {
  flexDirection: 'column',
},
shopNameDisplay: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 4,
},
shopDetails: {
  fontSize: 14,
  color: '#666',
  marginBottom: 8,
},
statusBadge: {
  alignSelf: 'flex-start',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4,
},
statusActive: {
  backgroundColor: '#d4edda',
},
statusPending: {
  backgroundColor: '#fff3cd',
},
statusOther: {
  backgroundColor: '#f8d7da',
},
statusText: {
  fontSize: 10,
  fontWeight: 'bold',
  color: '#155724',
},
formRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 16,
},
formColumn: {
  width: '48%',
},
validationBox: {
  backgroundColor: '#f8f9fa',
  borderRadius: 8,
  padding: 12,
  marginTop: 12,
  borderLeftWidth: 4,
  borderLeftColor: '#6c757d',
},
validationTitle: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#333',
  marginBottom: 8,
},
validationWarning: {
  backgroundColor: '#fff3cd',
  padding: 8,
  borderRadius: 4,
  marginBottom: 4,
},
validationWarningText: {
  fontSize: 12,
  color: '#856404',
},
validationError: {
  backgroundColor: '#f8d7da',
  padding: 8,
  borderRadius: 4,
  marginBottom: 4,
},
validationErrorText: {
  fontSize: 12,
  color: '#721c24',
},
validationSuccess: {
  backgroundColor: '#d4edda',
  padding: 8,
  borderRadius: 4,
},
validationSuccessText: {
  fontSize: 12,
  color: '#155724',
},
deployButtonDisabled: {
  backgroundColor: '#6c757d',
  opacity: 0.6,
  },
pickerContainer: {
  marginBottom: 16,
},
sectionLabel: {
  fontSize: 16,
  fontWeight: '600',
  color: '#333',
  marginBottom: 12,
},
optionGroup: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 8,
},
optionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingVertical: 12,
  backgroundColor: '#f8f9fa',
  borderRadius: 8,
  borderWidth: 2,
  borderColor: '#e9ecef',
  minWidth: 80,
},
optionButtonSelected: {
  backgroundColor: '#e7f3ff',
  borderColor: '#4a6baf',
  shadowColor: '#4a6baf',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
},
optionButtonText: {
  fontSize: 16,
  fontWeight: '500',
  color: '#495057',
},
optionButtonTextSelected: {
  color: '#4a6baf',
  fontWeight: '600',
},
optionSelectedIcon: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#4a6baf',
  marginLeft: 8,
},
optionHelpText: {
  fontSize: 12,
  color: '#6c757d',
  fontStyle: 'italic',
  textAlign: 'center',
},
noShopsContainer: {
  backgroundColor: '#f8f9fa',
  padding: 20,
  borderRadius: 8,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#e9ecef',
  borderStyle: 'dashed',
},
noShopsText: {
  fontSize: 14,
  color: '#6c757d',
  textAlign: 'center',
  },
dropdownButton: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  backgroundColor: 'white',
  borderWidth: 2,
  borderColor: '#e0e0e0',
  borderRadius: 8,
  marginBottom: 8,
},
dropdownButtonText: {
  fontSize: 16,
  color: '#333',
  fontWeight: '500',
},
dropdownPlaceholder: {
  color: '#999',
},
dropdownArrow: {
  fontSize: 12,
  color: '#666',
  fontWeight: 'bold',
},
dropdownList: {
  backgroundColor: 'white',
  borderWidth: 1,
  borderColor: '#e0e0e0',
  borderRadius: 8,
  marginBottom: 8,
  maxHeight: 200,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
dropdownItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#f5f5f5',
},
dropdownItemSelected: {
  backgroundColor: '#f0f7ff',
},
dropdownItemText: {
  fontSize: 16,
  color: '#333',
},
dropdownItemTextSelected: {
  color: '#4a6baf',
  fontWeight: '600',
},
dropdownSelectedIcon: {
  fontSize: 14,
  color: '#4a6baf',
  fontWeight: 'bold',
},
selectedShopText: {
  fontSize: 14,
  color: '#666',
  textAlign: 'center',
  marginTop: 8,
},
selectedShopId: {
  fontWeight: 'bold',
  color: '#4a6baf',
},
});

export default ShopCreateQuest;