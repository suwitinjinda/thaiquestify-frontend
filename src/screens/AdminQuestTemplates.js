// src/screens/AdminQuestTemplates.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { questTemplateAPI } from '../services/questTemplateService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AdminQuestTemplates = ({ navigation }) => {
  const { user, token } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [formErrors, setFormErrors] = useState({});

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    type: 'social_media',
    instructions: '',
    verificationMethod: 'screenshot',
    rewardPoints: '50',
    rewardAmount: '10',
    category: '',
    estimatedTime: '5',
    tags: '',
    // Location fields
    locationName: '',
    address: '',
    coordinates: '',
    radius: '100',
    // Facebook fields
    facebookPageId: '',
    facebookPageName: '',
    facebookPageUrl: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setConnectionStatus('checking');
      console.log('🔄 Loading templates...');
      
      const data = await questTemplateAPI.getAllTemplates();
      setTemplates(data);
      setConnectionStatus('connected');
      
      console.log('✅ Templates loaded successfully:', data.length);
    } catch (error) {
      console.error('❌ Error loading templates:', error);
      setConnectionStatus('error');
      Alert.alert('Connection Error', 'Cannot connect to server. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTemplates();
  };

  const handleCreateTemplate = async () => {
  console.log('📝 Create template button clicked');
  console.log('📋 Form data:', newTemplate);
  
  // Enhanced validation with specific messages
  if (!newTemplate.name || newTemplate.name.trim() === '') {
    Alert.alert('Error', 'Please enter a template name');
    return;
  }

  if (!newTemplate.description || newTemplate.description.trim() === '') {
    Alert.alert('Error', 'Please enter a description');
    return;
  }

  // Special validation for Facebook follow
  if (newTemplate.type === 'facebook_follow') {
    if (!newTemplate.facebookPageId || newTemplate.facebookPageId.trim() === '') {
      Alert.alert('Error', 'Please enter Facebook Page ID for Facebook follow template');
      return;
    }
    if (!newTemplate.facebookPageName || newTemplate.facebookPageName.trim() === '') {
      Alert.alert('Error', 'Please enter Facebook Page Name for Facebook follow template');
      return;
    }
    if (!newTemplate.facebookPageUrl || newTemplate.facebookPageUrl.trim() === '') {
      Alert.alert('Error', 'Please enter Facebook Page URL for Facebook follow template');
      return;
    }
  }

  try {
    setActionLoading('creating');
    
    // Prepare the data exactly as the API expects
    const templateData = {
      name: newTemplate.name.trim(),
      description: newTemplate.description.trim(),
      type: newTemplate.type,
      instructions: newTemplate.instructions.trim() || 'Follow the instructions provided',
      verificationMethod: newTemplate.verificationMethod,
      rewardPoints: parseInt(newTemplate.rewardPoints) || 50,
      rewardAmount: parseInt(newTemplate.rewardAmount) || 10,
      category: newTemplate.category.trim() || 'General',
      estimatedTime: parseInt(newTemplate.estimatedTime) || 5,
      tags: newTemplate.tags ? 
        newTemplate.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : 
        ['general'],
      requiredData: {},
      templateConfig: {}
    };

    // Add Facebook data for facebook_follow type
    if (newTemplate.type === 'facebook_follow') {
      // Store in both requiredData and templateConfig for flexibility
      templateData.requiredData = {
        facebookPageId: newTemplate.facebookPageId.trim(),
        facebookPageName: newTemplate.facebookPageName.trim(),
        facebookPageUrl: newTemplate.facebookPageUrl.trim()
      };
      templateData.templateConfig = {
        facebookPageId: newTemplate.facebookPageId.trim(),
        facebookPageName: newTemplate.facebookPageName.trim(),
        facebookPageUrl: newTemplate.facebookPageUrl.trim()
      };
    }

    // Add location data for location check-in type
    if (newTemplate.type === 'location_checkin') {
      templateData.requiredData = {
        locationName: newTemplate.locationName.trim(),
        address: newTemplate.address.trim(),
        coordinates: newTemplate.coordinates.trim() || '13.7563,100.5018',
        radius: parseInt(newTemplate.radius) || 100
      };
      templateData.templateConfig = {
        locationName: newTemplate.locationName.trim(),
        address: newTemplate.address.trim(),
        coordinates: newTemplate.coordinates.trim() || '13.7563,100.5018',
        radius: parseInt(newTemplate.radius) || 100
      };
    }

    console.log('🔄 Creating template with data:', JSON.stringify(templateData, null, 2));
    
    try {
      const createdTemplate = await questTemplateAPI.createTemplate(templateData);
      console.log('✅ Template created successfully:', createdTemplate);
      
      setTemplates(prev => [createdTemplate, ...prev]);
      setShowCreateModal(false);
      resetNewTemplateForm();
      
      Alert.alert(
        'Success!',
        `Facebook quest template "${createdTemplate.name}" created successfully!\n\n• Page: ${createdTemplate.requiredData?.facebookPageName || createdTemplate.templateConfig?.facebookPageName}\n• URL: ${createdTemplate.requiredData?.facebookPageUrl || createdTemplate.templateConfig?.facebookPageUrl}\n• Verification: Facebook API`,
        [{ text: 'OK' }]
      );
      
    } catch (apiError) {
      console.error('❌ API Error:', apiError);
      
      // If API fails, create a mock template for testing
      console.log('⚠️ API failed, creating mock template for testing');
      const mockTemplate = {
        _id: Date.now().toString(),
        ...templateData,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setTemplates(prev => [mockTemplate, ...prev]);
      setShowCreateModal(false);
      resetNewTemplateForm();
      
      Alert.alert('Success', 'Facebook quest template created successfully! (Mock data)');
    }
  } catch (error) {
    console.error('❌ Unexpected error creating template:', error);
    Alert.alert('Error', `Failed to create template: ${error.message}`);
  } finally {
    setActionLoading(null);
  }
};

  const resetNewTemplateForm = () => {
  setNewTemplate({
    name: '',
    description: '',
    type: 'social_media',
    instructions: '',
    verificationMethod: 'screenshot',
    rewardPoints: '50',
    rewardAmount: '10',
    category: '',
    estimatedTime: '5',
    tags: '',
    locationName: '',
    address: '',
    coordinates: '',
    radius: '100',
    // SET DEFAULT FACEBOOK VALUES
    facebookPageId: '123456789012345', // Default example ID
    facebookPageName: 'Your Facebook Page',
    facebookPageUrl: 'https://facebook.com/yourpagename'
  });
  setFormErrors({});
};
  const fillSampleData = () => {
    console.log('🎯 Filling sample data');
    setNewTemplate({
      name: 'Follow Our Social Media',
      description: 'Follow our social media accounts to stay updated with latest news and promotions',
      type: 'social_media',
      instructions: '1. Visit our social media page\n2. Click the Follow button\n3. Take a screenshot\n4. Submit for verification',
      verificationMethod: 'screenshot',
      rewardPoints: '50',
      rewardAmount: '10',
      category: 'Social Media',
      estimatedTime: '5',
      tags: 'social,media,follow'
    });
  };

  const fillFacebookCheckinData = () => {
  console.log('📍 Filling Facebook Check-in data');
  setNewTemplate({
    name: 'Facebook Check-in at Our Store',
    description: 'Visit our physical store location and check-in on Facebook to let your friends know about us',
    type: 'location_checkin',
    instructions: '1. Visit our physical store location\n2. Open Facebook app on your phone\n3. Create a check-in post at our location\n4. Take a screenshot of your check-in post\n5. Submit the screenshot for verification',
    verificationMethod: 'location_verification',
    rewardPoints: '100',
    rewardAmount: '20',
    category: 'Location Visit',
    estimatedTime: '15',
    tags: 'facebook,checkin,location,visit',
    locationName: 'Our Main Store',
    address: '123 Shopping Street, Bangkok 10110',
    coordinates: '13.7563,100.5018',
    radius: '100'
  });
};

  // In AdminQuestTemplates.js - Update the fillFacebookFollowData function
  const fillFacebookFollowData = () => {
  console.log('📘 Filling Facebook Follow data');
  setNewTemplate({
    name: 'Follow Facebook ThaiQuestify page',
    description: 'Follow our Facebook page to stay updated with latest promotions and news',
    type: 'facebook_follow',
    instructions: '1. Click the "Verify Now" button\n2. Login with your Facebook account\n3. System will automatically check if you follow our page\n4. Get rewarded instantly upon verification',
    verificationMethod: 'facebook_api',
    rewardPoints: '80',
    rewardAmount: '15',
    category: 'Social Media',
    estimatedTime: '3',
    tags: 'facebook,follow,social,page',
    // PROVIDE ACTUAL VALUES, NOT EMPTY STRINGS
    facebookPageId: '123456789012345', // Example Facebook Page ID
    facebookPageName: 'ThaiQuestify Official', // Example page name
    facebookPageUrl: 'https://facebook.com/thaiquestify' // Example page URL
  });
};

  const handleFieldChange = (fieldName, value) => {
    setNewTemplate(prev => ({ 
      ...prev, 
      [fieldName]: value 
    }));
  };

  const handleCreateButtonPress = () => {
    console.log('🎯 Create button pressed, setting modal to true');
    setShowCreateModal(true);
  };

  const toggleTemplateStatus = async (template) => {
    try {
      setActionLoading(template._id);
      const updatedTemplate = await questTemplateAPI.toggleTemplateStatus(template._id);
      setTemplates(templates.map(t => 
        t._id === template._id ? updatedTemplate : t
      ));
      Alert.alert('Success', `Template ${!template.isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling template status:', error);
      Alert.alert('Error', 'Failed to update template status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditTemplate = (template) => {
    console.log('✏️ Edit template:', template.name);
    setSelectedTemplate(template);
    setNewTemplate({
      name: template.name,
      description: template.description,
      type: template.type,
      instructions: template.instructions,
      verificationMethod: template.verificationMethod,
      rewardPoints: template.rewardPoints.toString(),
      rewardAmount: template.rewardAmount.toString(),
      category: template.category,
      estimatedTime: template.estimatedTime.toString(),
      tags: template.tags?.join(', ') || '',
      locationName: template.requiredData?.locationName || '',
      address: template.requiredData?.address || '',
      coordinates: template.requiredData?.coordinates || '',
      radius: template.requiredData?.radius || '100',
      facebookPageId: template.requiredData?.facebookPageId || '',
      facebookPageName: template.requiredData?.facebookPageName || '',
      facebookPageUrl: template.requiredData?.facebookPageUrl || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateTemplate = async () => {
    console.log('🔄 Update template called');
    
    if (!newTemplate.name || !newTemplate.description) {
      Alert.alert('Error', 'Please fill in name and description');
      return;
    }

    try {
      setActionLoading('updating');
      
      const templateData = {
        name: newTemplate.name,
        description: newTemplate.description,
        type: newTemplate.type,
        instructions: newTemplate.instructions,
        verificationMethod: newTemplate.verificationMethod,
        rewardPoints: parseInt(newTemplate.rewardPoints) || 0,
        rewardAmount: parseInt(newTemplate.rewardAmount) || 0,
        category: newTemplate.category,
        estimatedTime: parseInt(newTemplate.estimatedTime) || 5,
        tags: newTemplate.tags ? newTemplate.tags.split(',').map(tag => tag.trim()) : [],
        requiredData: {}
      };

      // Add location data for location check-in
      if (newTemplate.type === 'location_checkin') {
        templateData.requiredData = {
          locationName: newTemplate.locationName || '',
          address: newTemplate.address || '',
          coordinates: newTemplate.coordinates || '',
          radius: newTemplate.radius || '100'
        };
      }

      // Add Facebook data for facebook_follow
      if (newTemplate.type === 'facebook_follow') {
        templateData.requiredData = {
          facebookPageId: newTemplate.facebookPageId || '',
          facebookPageName: newTemplate.facebookPageName || '',
          facebookPageUrl: newTemplate.facebookPageUrl || ''
        };
      }

      console.log('🔄 Updating template:', selectedTemplate._id, templateData);
      
      const updatedTemplate = await questTemplateAPI.updateTemplate(selectedTemplate._id, templateData);

      setTemplates(templates.map(t => 
        t._id === selectedTemplate._id ? updatedTemplate : t
      ));
      
      setShowEditModal(false);
      setSelectedTemplate(null);
      resetNewTemplateForm();
      
      Alert.alert('Success', 'Quest template updated successfully!');
    } catch (error) {
      console.error('❌ Error updating template:', error);
      Alert.alert('Error', 'Failed to update template');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTemplate = (template) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(`delete-${template._id}`);
              await questTemplateAPI.deleteTemplate(template._id);
              setTemplates(templates.filter(t => t._id !== template._id));
              Alert.alert('Success', 'Template deleted successfully!');
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const getVerificationMethodLabel = (method) => {
    const labels = {
      screenshot: 'Screenshot',
      manual_review: 'Manual Review',
      link_click: 'Link Click',
      location_verification: 'Location Verification',
      facebook_api: 'Facebook API',
      api_verification: 'API Verification'
    };
    return labels[method] || method;
  };

  const getTypeLabel = (type) => {
    const labels = {
      social_media: 'Social Media',
      website_visit: 'Website Visit',
      content_creation: 'Content Creation',
      product_review: 'Product Review',
      location_checkin: 'Location Check-in',
      facebook_follow: 'Facebook Follow'
    };
    return labels[type] || type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      social_media: '📱',
      website_visit: '🌐',
      content_creation: '📝',
      product_review: '⭐',
      location_checkin: '📍',
      facebook_follow: '📘'
    };
    return icons[type] || '📋';
  };

  const renderLocationFields = () => {
    if (newTemplate.type !== 'location_checkin') return null;

    return (
      <View style={styles.locationSection}>
        <Text style={styles.sectionTitle}>📍 Location Details</Text>
        
        <Text style={styles.label}>Location Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Our Main Store, Coffee Shop Branch"
          value={newTemplate.locationName}
          onChangeText={(text) => handleFieldChange('locationName', text)}
        />

        <Text style={styles.label}>Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="Full address of the location"
          value={newTemplate.address}
          onChangeText={(text) => handleFieldChange('address', text)}
        />

        <Text style={styles.label}>Coordinates (Latitude, Longitude)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 13.7563,100.5018"
          value={newTemplate.coordinates}
          onChangeText={(text) => handleFieldChange('coordinates', text)}
        />

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Verification Radius (meters)</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              keyboardType="numeric"
              value={newTemplate.radius}
              onChangeText={(text) => handleFieldChange('radius', text)}
            />
          </View>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            💡 Users will need to be within this radius of the location to complete the check-in verification.
          </Text>
        </View>
      </View>
    );
  };

  // In your renderFacebookFields function in AdminQuestTemplates.js
  const renderFacebookFields = () => {
  if (newTemplate.type !== 'facebook_follow') return null;

  return (
    <View style={styles.facebookSection}>
      <Text style={styles.sectionTitle}>📘 Facebook Page Details</Text>
      
      <Text style={styles.label}>Facebook Page ID *</Text>
      <TextInput
        style={[styles.input, !newTemplate.facebookPageId && styles.inputError]}
        placeholder="e.g., 123456789012345"
        value={newTemplate.facebookPageId}
        onChangeText={(text) => handleFieldChange('facebookPageId', text)}
      />
      <Text style={styles.helpText}>
        Find your Page ID in Facebook Page Settings → Basic Information
      </Text>

      <Text style={styles.label}>Facebook Page Name *</Text>
      <TextInput
        style={[styles.input, !newTemplate.facebookPageName && styles.inputError]}
        placeholder="e.g., ThaiQuestify Official"
        value={newTemplate.facebookPageName}
        onChangeText={(text) => handleFieldChange('facebookPageName', text)}
      />

      <Text style={styles.label}>Facebook Page URL *</Text>
      <TextInput
        style={[styles.input, !newTemplate.facebookPageUrl && styles.inputError]}
        placeholder="e.g., https://facebook.com/thaiquestify"
        value={newTemplate.facebookPageUrl}
        onChangeText={(text) => handleFieldChange('facebookPageUrl', text)}
      />

      {/* Show preview */}
      {newTemplate.facebookPageName && (
        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Preview:</Text>
          <Text style={styles.previewText}>
            Users will verify that they follow:{"\n"}
            <Text style={styles.previewHighlight}>{newTemplate.facebookPageName}</Text>
          </Text>
        </View>
      )}

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          💡 Users will need to login with Facebook and the system will automatically verify if they follow/like your page.
        </Text>
      </View>
    </View>
  );
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
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>Quest Templates</Text>
          <Text style={styles.subtitle}>
            Create and manage quest templates for shops to deploy
          </Text>
          
          {/* CREATE BUTTON */}
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateButtonPress}
          >
            <Text style={styles.createButtonText}>+ Create New Template</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{templates.length}</Text>
            <Text style={styles.statLabel}>Total Templates</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {templates.filter(t => t.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {templates.filter(t => !t.isActive).length}
            </Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        {/* Templates List */}
        <View style={styles.templatesList}>
          {templates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Templates Found</Text>
              <Text style={styles.emptyStateText}>
                Create your first quest template to get started
              </Text>
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={handleCreateButtonPress}
              >
                <Text style={styles.emptyStateButtonText}>Create Template</Text>
              </TouchableOpacity>
            </View>
          ) : (
            templates.map(template => (
              <View key={template._id} style={styles.templateCard}>
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.typeIcon}>
                    <Text style={styles.typeIconText}>{getTypeIcon(template.type)}</Text>
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <View style={styles.cardMeta}>
                      <Text style={styles.templateCategory}>{template.category}</Text>
                      <View style={[
                        styles.statusBadge,
                        template.isActive ? styles.statusActive : styles.statusInactive
                      ]}>
                        <Text style={styles.statusText}>
                          {template.isActive ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.templateDescription}>{template.description}</Text>
                
                {/* Location Info for Check-in Templates */}
                {template.type === 'location_checkin' && template.requiredData && (
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>📍 Location:</Text>
                    <Text style={styles.locationText}>{template.requiredData.locationName}</Text>
                    <Text style={styles.locationAddress}>{template.requiredData.address}</Text>
                  </View>
                )}
                
                {/* Facebook Info for Facebook Follow Templates */}
                {template.type === 'facebook_follow' && template.requiredData && (
                  <View style={styles.facebookInfo}>
                    <Text style={styles.facebookLabel}>📘 Facebook Page:</Text>
                    <Text style={styles.facebookText}>{template.requiredData.facebookPageName}</Text>
                    <Text style={styles.facebookUrl}>{template.requiredData.facebookPageUrl}</Text>
                  </View>
                )}
                
                {/* Details Grid */}
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{getTypeLabel(template.type)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Verification</Text>
                    <Text style={styles.detailValue}>{getVerificationMethodLabel(template.verificationMethod)}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Reward</Text>
                    <Text style={styles.detailValue}>{template.rewardPoints} pts</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Cash</Text>
                    <Text style={styles.detailValue}>฿{template.rewardAmount}</Text>
                  </View>
                </View>

                {/* Tags */}
                {template.tags && template.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {template.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.templateActions}>
                  <TouchableOpacity 
                    style={[
                      styles.actionButton,
                      template.isActive ? styles.deactivateButton : styles.activateButton
                    ]}
                    onPress={() => toggleTemplateStatus(template)}
                    disabled={actionLoading === template._id}
                  >
                    {actionLoading === template._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.actionButtonText}>
                        {template.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleEditTemplate(template)}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteTemplate(template)}
                  >
                    <Text style={styles.actionButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* CREATE TEMPLATE MODAL */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          console.log('Modal close requested');
          setShowCreateModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Quest Template</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* Quick Fill Buttons */}
            <View style={styles.quickFillSection}>
              <Text style={styles.quickFillTitle}>Quick Templates:</Text>
              <View style={styles.quickFillButtons}>
                <TouchableOpacity 
                  style={styles.quickFillButton}
                  onPress={fillSampleData}
                >
                  <Text style={styles.quickFillButtonText}>📱 Social Media</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickFillButton, styles.facebookCheckinButton]}
                  onPress={fillFacebookCheckinData}
                >
                  <Text style={styles.quickFillButtonText}>📍 Facebook Check-in</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickFillButton, styles.facebookFollowButton]}
                  onPress={fillFacebookFollowData}
                >
                  <Text style={styles.quickFillButtonText}>📘 Facebook Follow</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Template Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter template name"
                value={newTemplate.name}
                onChangeText={(text) => handleFieldChange('name', text)}
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
                value={newTemplate.description}
                onChangeText={(text) => handleFieldChange('description', text)}
              />

              <Text style={styles.label}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter step-by-step instructions"
                multiline
                numberOfLines={4}
                value={newTemplate.instructions}
                onChangeText={(text) => handleFieldChange('instructions', text)}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Social Media, Website, Location Visit"
                value={newTemplate.category}
                onChangeText={(text) => handleFieldChange('category', text)}
              />

              {/* Template Type Selection */}
              <Text style={styles.label}>Template Type *</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'social_media', label: '📱 Social Media' },
                  { value: 'website_visit', label: '🌐 Website Visit' },
                  { value: 'content_creation', label: '📝 Content Creation' },
                  { value: 'location_checkin', label: '📍 Location Check-in' },
                  { value: 'facebook_follow', label: '📘 Facebook Page Follow' },
                  { value: 'product_review', label: '⭐ Product Review' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.radioOption}
                    onPress={() => handleFieldChange('type', type.value)}
                  >
                    <View style={styles.radioCircle}>
                      {newTemplate.type === type.value && <View style={styles.selectedRadio} />}
                    </View>
                    <Text style={styles.radioLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Verification Method Selection */}
              <Text style={styles.label}>Verification Method *</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'screenshot', label: '📸 Screenshot' },
                  { value: 'manual_review', label: '👨‍💼 Manual Review' },
                  { value: 'link_click', label: '🔗 Link Click' },
                  { value: 'location_verification', label: '📍 Location Verification' },
                  { value: 'facebook_api', label: '🔗 Facebook API Verification' }
                ].map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    style={styles.radioOption}
                    onPress={() => handleFieldChange('verificationMethod', method.value)}
                  >
                    <View style={styles.radioCircle}>
                      {newTemplate.verificationMethod === method.value && <View style={styles.selectedRadio} />}
                    </View>
                    <Text style={styles.radioLabel}>{method.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Location Fields - Conditionally Rendered */}
              {renderLocationFields()}

              {/* Facebook Fields - Conditionally Rendered */}
              {renderFacebookFields()}

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Reward Points</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="50"
                    keyboardType="numeric"
                    value={newTemplate.rewardPoints}
                    onChangeText={(text) => handleFieldChange('rewardPoints', text)}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Reward Amount (THB)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    keyboardType="numeric"
                    value={newTemplate.rewardAmount}
                    onChangeText={(text) => handleFieldChange('rewardAmount', text)}
                  />
                </View>
              </View>

              <Text style={styles.label}>Estimated Time (minutes)</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                keyboardType="numeric"
                value={newTemplate.estimatedTime}
                onChangeText={(text) => handleFieldChange('estimatedTime', text)}
              />

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., social, facebook, follow"
                value={newTemplate.tags}
                onChangeText={(text) => handleFieldChange('tags', text)}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  resetNewTemplateForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleCreateTemplate}
                disabled={actionLoading === 'creating'}
              >
                {actionLoading === 'creating' ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Template</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT TEMPLATE MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          console.log('Edit modal close requested');
          setShowEditModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Quest Template</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Template Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter template name"
                value={newTemplate.name}
                onChangeText={(text) => handleFieldChange('name', text)}
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
                value={newTemplate.description}
                onChangeText={(text) => handleFieldChange('description', text)}
              />

              <Text style={styles.label}>Instructions</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter step-by-step instructions"
                multiline
                numberOfLines={4}
                value={newTemplate.instructions}
                onChangeText={(text) => handleFieldChange('instructions', text)}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Social Media, Website"
                value={newTemplate.category}
                onChangeText={(text) => handleFieldChange('category', text)}
              />

              {/* Template Type Selection */}
              <Text style={styles.label}>Template Type *</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'social_media', label: '📱 Social Media' },
                  { value: 'website_visit', label: '🌐 Website Visit' },
                  { value: 'content_creation', label: '📝 Content Creation' },
                  { value: 'location_checkin', label: '📍 Location Check-in' },
                  { value: 'facebook_follow', label: '📘 Facebook Page Follow' },
                  { value: 'product_review', label: '⭐ Product Review' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.radioOption}
                    onPress={() => handleFieldChange('type', type.value)}
                  >
                    <View style={styles.radioCircle}>
                      {newTemplate.type === type.value && <View style={styles.selectedRadio} />}
                    </View>
                    <Text style={styles.radioLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Verification Method Selection */}
              <Text style={styles.label}>Verification Method *</Text>
              <View style={styles.radioGroup}>
                {[
                  { value: 'screenshot', label: '📸 Screenshot' },
                  { value: 'manual_review', label: '👨‍💼 Manual Review' },
                  { value: 'link_click', label: '🔗 Link Click' },
                  { value: 'location_verification', label: '📍 Location Verification' },
                  { value: 'facebook_api', label: '🔗 Facebook API Verification' }
                ].map((method) => (
                  <TouchableOpacity
                    key={method.value}
                    style={styles.radioOption}
                    onPress={() => handleFieldChange('verificationMethod', method.value)}
                  >
                    <View style={styles.radioCircle}>
                      {newTemplate.verificationMethod === method.value && <View style={styles.selectedRadio} />}
                    </View>
                    <Text style={styles.radioLabel}>{method.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Location Fields - Conditionally Rendered */}
              {renderLocationFields()}

              {/* Facebook Fields - Conditionally Rendered */}
              {renderFacebookFields()}

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Reward Points</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="50"
                    keyboardType="numeric"
                    value={newTemplate.rewardPoints}
                    onChangeText={(text) => handleFieldChange('rewardPoints', text)}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Reward Amount (THB)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="10"
                    keyboardType="numeric"
                    value={newTemplate.rewardAmount}
                    onChangeText={(text) => handleFieldChange('rewardAmount', text)}
                  />
                </View>
              </View>

              <Text style={styles.label}>Estimated Time (minutes)</Text>
              <TextInput
                style={styles.input}
                placeholder="5"
                keyboardType="numeric"
                value={newTemplate.estimatedTime}
                onChangeText={(text) => handleFieldChange('estimatedTime', text)}
              />

              <Text style={styles.label}>Tags (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., social, facebook, follow"
                value={newTemplate.tags}
                onChangeText={(text) => handleFieldChange('tags', text)}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedTemplate(null);
                  resetNewTemplateForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleUpdateTemplate}
                disabled={actionLoading === 'updating'}
              >
                {actionLoading === 'updating' ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Template</Text>
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
  content: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: '#4a6baf',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4a6baf',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
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
    fontWeight: '500',
  },
  templatesList: {
    marginBottom: 20,
  },

  // CUTE TEMPLATE CARD STYLES
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a6baf',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  typeIconText: {
    fontSize: 18,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  templateCategory: {
    fontSize: 14,
    color: '#4a6baf',
    fontWeight: '600',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#e8f5e8',
  },
  statusInactive: {
    backgroundColor: '#ffeaea',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#155724',
  },
  templateDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  detailItem: {
    width: '48%',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '500',
  },
  templateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
    elevation: 2,
  },
  activateButton: {
    backgroundColor: '#28a745',
  },
  deactivateButton: {
    backgroundColor: '#dc3545',
  },
  editButton: {
    backgroundColor: '#ffc107',
  },
  deleteButton: {
    backgroundColor: '#6c757d',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyStateButton: {
    backgroundColor: '#4a6baf',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
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

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
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
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  quickFillSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 10,
  },
  quickFillTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickFillButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickFillButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  facebookCheckinButton: {
    backgroundColor: '#1877f2', // Facebook blue
  },
  facebookFollowButton: {
    backgroundColor: '#1877f2', // Facebook blue
  },
  quickFillButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
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
  submitButton: {
    backgroundColor: '#4a6baf',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Location Section Styles
  locationSection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1877f2',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1877f2',
    marginBottom: 12,
  },
  noteBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#1976d2',
    fontStyle: 'italic',
  },
  locationInfo: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1877f2',
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1877f2',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  // Facebook Section Styles
  facebookSection: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#1877f2',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  facebookInfo: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#1877f2',
  },
  facebookLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1877f2',
    marginBottom: 4,
  },
  facebookText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  facebookUrl: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },

  // Radio Group Styles
  radioGroup: {
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4a6baf',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4a6baf',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  inputError: {
  borderColor: '#dc3545',
  borderWidth: 2,
},
previewBox: {
  backgroundColor: '#e8f5e8',
  padding: 12,
  borderRadius: 8,
  marginTop: 12,
  marginBottom: 12,
},
previewTitle: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#155724',
  marginBottom: 4,
},
previewText: {
  fontSize: 13,
  color: '#333',
},
previewHighlight: {
  fontWeight: 'bold',
  color: '#1877f2',
},
});

export default AdminQuestTemplates;