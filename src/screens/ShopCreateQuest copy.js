// src/screens/ShopCreateQuest.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal
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
  const [questConfig, setQuestConfig] = useState({
    budget: '',
    maxParticipants: '',
    duration: '7'
  });

  useEffect(() => {
      loadTemplates();
    //   initializeShop();
  }, []);
    
  // In ShopCreateQuest.js - Add this check
const initializeShop = async () => {
  try {
    console.log('🔍 Initializing shop...');
    console.log('👤 Current user:', user);
    
    // Test basic connection first
    await shopAPI.testShopsEndpoint();
    console.log('✅ Shops endpoint connected');
    
    // Test authentication
    try {
      const authResult = await shopAPI.checkShopSetup();
      console.log('✅ Authentication successful:', authResult);
      
      // Get shop profile
      const shopProfile = await shopAPI.getShopProfile();
      setShop(shopProfile.shop);
      console.log('✅ Shop profile found:', shopProfile.shop.shopName);
      
      loadTemplates();
      
    } catch (authError) {
      if (authError.response?.status === 401) {
        console.log('❌ Authentication failed');
        Alert.alert(
          'Authentication Required',
          'Please login again to continue.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
        return;
      }
      throw authError;
    }
    
  } catch (error) {
    console.error('❌ Shop initialization failed:', error);
    Alert.alert('Error', 'Failed to initialize shop. Please try again.');
  } finally {
    setLoading(false);
  }
};

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading templates for shop...');
      
      const data = await questTemplateAPI.getAllTemplates();
      console.log('📦 Received templates:', data.length);
      
      // Filter only active templates
      const activeTemplates = data.filter(template => template.isActive);
      console.log('✅ Active templates:', activeTemplates.length);
      
      setTemplates(activeTemplates);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      Alert.alert('Error', 'Failed to load templates. Please check your connection and try again.');
      setTemplates([]); // Set empty array instead of mock data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTemplates();
  };

  const handleSelectTemplate = (template) => {
    console.log('🎯 Selected template:', template.name);
    setSelectedTemplate(template);
    // Pre-fill budget with template's suggested amount
    setQuestConfig({
      budget: (template.rewardAmount * 10).toString(), // Default to 10x for budget
      maxParticipants: '100',
      duration: '7'
    });
    setShowDeployModal(true);
  };

  const handleDeployQuest = async () => {
    console.log('🚀 Deploying quest...');
    
    if (!questConfig.budget || !questConfig.maxParticipants) {
      Alert.alert('Error', 'Please fill in all required fields');
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
      
      const questData = {
        templateId: selectedTemplate._id,
        budget: budget,
        maxParticipants: maxParticipants,
        duration: parseInt(questConfig.duration)
      };

      console.log('📤 Sending quest data to backend:', questData);
      
      // Use real API only - no mock fallback
      const response = await shopAPI.createQuestFromTemplate(questData);
      console.log('✅ Quest deployed successfully:', response);
      
      setShowDeployModal(false);
      setSelectedTemplate(null);
      
      Alert.alert(
        'Success!', 
        `Quest "${selectedTemplate.name}" deployed successfully!\n\nBudget: ฿${budget}\nParticipants: ${maxParticipants}`,
        [
          {
            text: 'Back to Dashboard',
            onPress: () => navigation.navigate('ShopDashboard')
          },
          {
            text: 'Create Another',
            onPress: () => loadTemplates(),
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error deploying quest:', error);
      
      let errorMessage = 'Failed to deploy quest. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Error', errorMessage);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a6baf" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Create Quest</Text>
          <Text style={styles.subtitle}>Choose a template and deploy to your shop</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
          >
        {/* Status Info */}
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>
            {loading ? 'Loading templates...' : `Found ${templates.length} available templates`}
          </Text>
        </View>
              
        {/* Debug Info */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Templates loaded: {templates.length}</Text>
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
                All templates are currently inactive. Please contact admin.
              </Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadTemplates}
              >
                <Text style={styles.retryButtonText}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            templates.map(template => (
              <TouchableOpacity 
                key={template._id} 
                style={styles.templateCard}
                onPress={() => handleSelectTemplate(template)}
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
              <Text style={styles.modalTitle}>Deploy Quest</Text>
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
                  <Text style={styles.sectionTitle}>Quest Configuration</Text>
                  
                  <Text style={styles.label}>Total Budget (THB) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter total budget"
                    keyboardType="numeric"
                    value={questConfig.budget}
                    onChangeText={(text) => setQuestConfig(prev => ({ ...prev, budget: text }))}
                  />

                  <Text style={styles.label}>Max Participants *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter maximum participants"
                    keyboardType="numeric"
                    value={questConfig.maxParticipants}
                    onChangeText={(text) => setQuestConfig(prev => ({ ...prev, maxParticipants: text }))}
                  />

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
                    <View style={[styles.calculationRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>Total budget:</Text>
                      <Text style={styles.totalValue}>
                        ฿{parseFloat(questConfig.budget || 0).toFixed(2)}
                      </Text>
                    </View>
                  </View>
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
                style={[styles.modalButton, styles.deployButton]}
                onPress={handleDeployQuest}
                disabled={deployLoading}
              >
                {deployLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.deployButtonText}>Deploy Quest</Text>
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
  debugInfo: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
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
});

export default ShopCreateQuest;