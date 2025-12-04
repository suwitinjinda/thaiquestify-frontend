// src/screens/ShopRegister.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const ShopRegister = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    shopType: '',
    location: '',
    address: '',
    phone: '',
    description: '',
    businessHours: '',
  });

  const shopTypes = [
    'Restaurant/Cafe',
    'Retail Store',
    'Service Business',
    'Hotel/Accommodation',
    'Tour Operator',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.shopName.trim()) {
      Alert.alert('Error', 'Please enter shop name');
      return false;
    }
    if (!formData.shopType) {
      Alert.alert('Error', 'Please select shop type');
      return false;
    }
    if (!formData.location.trim()) {
      Alert.alert('Error', 'Please enter location');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Success!',
        `Shop "${formData.shopName}" has been registered successfully and is pending approval.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PartnerDashboard')
          }
        ]
      );
    }, 2000);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register New Shop</Text>
        <Text style={styles.headerSubtitle}>
          Partner Code: {user?.partnerCode || 'N/A'}
        </Text>
      </View>

      {/* Registration Form */}
      <View style={styles.formContainer}>
        {/* Shop Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter shop name"
            value={formData.shopName}
            onChangeText={(value) => handleInputChange('shopName', value)}
          />
        </View>

        {/* Shop Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Type *</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.shopTypeContainer}
          >
            {shopTypes.map((type, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.shopTypeButton,
                  formData.shopType === type && styles.shopTypeButtonSelected
                ]}
                onPress={() => handleInputChange('shopType', type)}
              >
                <Text style={[
                  styles.shopTypeText,
                  formData.shopType === type && styles.shopTypeTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Location/City *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., Chiang Mai, Bangkok"
            value={formData.location}
            onChangeText={(value) => handleInputChange('location', value)}
          />
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Address</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter full address"
            multiline
            numberOfLines={3}
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
          />
        </View>

        {/* Phone */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 081-234-5678"
            keyboardType="phone-pad"
            value={formData.phone}
            onChangeText={(value) => handleInputChange('phone', value)}
          />
        </View>

        {/* Business Hours */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Hours</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 08:00 - 20:00"
            value={formData.businessHours}
            onChangeText={(value) => handleInputChange('businessHours', value)}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe your shop, products, or services..."
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Register Shop</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Registration Process</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            Your shop will be reviewed and activated within 24-48 hours
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            You'll receive commission based on our partner agreement
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            You can track approval status in your dashboard
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#4a6baf',
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  shopTypeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  shopTypeButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  shopTypeButtonSelected: {
    backgroundColor: '#4a6baf',
    borderColor: '#4a6baf',
  },
  shopTypeText: {
    color: '#666',
    fontSize: 14,
  },
  shopTypeTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: 'white',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a6baf',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  infoBullet: {
    color: '#4a6baf',
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ShopRegister;