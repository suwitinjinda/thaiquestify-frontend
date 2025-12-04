// src/screens/ShopRegisterScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import * as Location from 'expo-location';
import { thaiProvinces, provinceGroups } from '../data/thaiProvinces';
import { shopAPI } from '../services/shopService';
import { userAPI } from '../services/userService1'; // ADD THIS

const ShopRegisterScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false); // NEW MODAL
  const [generatedShopNumber, setGeneratedShopNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerEmail, setOwnerEmail] = useState(''); // NEW STATE
  const [ownerData, setOwnerData] = useState(null); // NEW STATE
  const [emailChecking, setEmailChecking] = useState(false); // NEW STATE
  
  const [formData, setFormData] = useState({
    shopName: '',
    shopType: '',
    province: '',
    district: '',
    address: '',
    phone: '',
    description: '',
    businessHours: '',
    taxId: '',
    coordinates: null,
    ownerEmail: '', // ADD THIS
    ownerUserId: null // ADD THIS
  });

  const shopTypes = [
    'Restaurant/Cafe',
    'Retail Store', 
    'Service Business',
    'Hotel/Accommodation',
    'Tour Operator',
    'Other'
  ];

  // Filter provinces based on search
  const filteredProvinces = thaiProvinces.filter(province =>
    province.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group provinces for section list
  const provinceSections = Object.entries(provinceGroups).map(([region, provinces]) => ({
    title: `ภาค${region}`,
    data: provinces.filter(province => 
      province.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.data.length > 0);

  // Generate shop number when component mounts
  useEffect(() => {
    generateShopNumber();
  }, []);

  const generateShopNumber = async () => {
    try {
      const shopNumber = await shopAPI.generateShopNumber();
      setGeneratedShopNumber(shopNumber);
    } catch (error) {
      console.error('Error generating shop number:', error);
      Alert.alert('Error', 'Unable to generate shop number. Please try again.');
    }
  };

  // NEW FUNCTION: ตรวจสอบอีเมลเจ้าของร้าน
  const checkOwnerEmail = async () => {
    if (!ownerEmail.trim()) {
      Alert.alert('Error', 'Please enter owner email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setEmailChecking(true);
    
    try {
      console.log('🔄 Checking owner email:', ownerEmail);
      
      const result = await userAPI.checkExistingEmail(ownerEmail);
      
      if (result.exists) {
        // พบผู้ใช้ที่มีอีเมลนี้อยู่แล้ว
        setOwnerData(result.user);
        Alert.alert(
          'Existing User Found',
          `Found user: ${result.user.name} (${result.user.userType})\n\nDo you want to assign this user as shop owner?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Assign as Owner',
              onPress: () => assignExistingUserAsOwner(result.user)
            }
          ]
        );
      } else {
        // ไม่พบผู้ใช้ ให้สร้างใหม่
        Alert.alert(
          'New User',
          'No existing user found with this email. A new user account will be created as shop owner.',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Create New User',
              onPress: () => createNewUserAsOwner()
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('❌ Error checking email:', error);
      Alert.alert('Error', 'Failed to check email. Please try again.');
    } finally {
      setEmailChecking(false);
      setShowOwnerModal(false);
      setOwnerEmail('');
    }
  };

  // NEW FUNCTION: กำหนดผู้ใช้ที่มีอยู่เป็นเจ้าของร้าน
  const assignExistingUserAsOwner = (userData) => {
    let updateMessage = '';
    
    if (userData.userType === 'customer') {
      updateMessage = 'This user is currently a customer. They will be upgraded to shop owner role.';
    } else if (userData.userType === 'shop') {
      updateMessage = 'This user is already a shop owner. They can manage multiple shops.';
    } else {
      updateMessage = `This user has role: ${userData.userType}. They will be assigned as shop owner.`;
    }

    Alert.alert(
      'Assign Shop Owner',
      `${updateMessage}\n\nUser: ${userData.name}\nEmail: ${userData.email}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm Assignment',
          onPress: async () => {
            try {
              // อัพเดทบทบาทผู้ใช้ถ้าจำเป็น
              if (userData.userType !== 'shop') {
                await userAPI.updateUserRole(userData._id, {
                  userType: 'shop',
                  updatedAt: new Date().toISOString()
                });
              }

              // บันทึกข้อมูลเจ้าของร้านในฟอร์ม
              setFormData(prev => ({
                ...prev,
                ownerEmail: userData.email,
                ownerUserId: userData._id
              }));

              Alert.alert('Success', `Shop owner assigned: ${userData.name}`);
              
            } catch (error) {
              console.error('❌ Error updating user role:', error);
              Alert.alert('Error', 'Failed to assign shop owner. Please try again.');
            }
          }
        }
      ]
    );
  };

  // NEW FUNCTION: สร้างผู้ใช้ใหม่เป็นเจ้าของร้าน
  const createNewUserAsOwner = async () => {
    try {
      // สร้างผู้ใช้ใหม่
      const newUserData = {
        name: `Shop Owner - ${formData.shopName}`,
        email: ownerEmail,
        userType: 'shop',
        phone: formData.phone || '',
        isActive: true,
        password: 'temp123456' // รหัสชั่วคราว
      };

      const result = await userAPI.createUser(newUserData);
      
      if (result.success) {
        // บันทึกข้อมูลเจ้าของร้านในฟอร์ม
        setFormData(prev => ({
          ...prev,
          ownerEmail: ownerEmail,
          ownerUserId: result.data.user._id
        }));

        Alert.alert(
          'Success', 
          `New shop owner account created!\n\nEmail: ${ownerEmail}\nTemporary password: temp123456\n\nPlease ask the owner to change their password.`
        );
      }
      
    } catch (error) {
      console.error('❌ Error creating new user:', error);
      Alert.alert('Error', 'Failed to create shop owner account. Please try again.');
    }
  };

  // NEW FUNCTION: ลบเจ้าของร้าน
  const removeShopOwner = () => {
    setFormData(prev => ({
      ...prev,
      ownerEmail: '',
      ownerUserId: null
    }));
    setOwnerData(null);
  };

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'ต้องการสิทธิ์การเข้าถึงตำแหน่ง',
        'แอปต้องการเข้าถึงตำแหน่งของคุณเพื่อบันทึกพิกัดร้านค้า',
        [{ text: 'OK' }]
      );
      setLocationLoading(false);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // ดึงที่อยู่จากพิกัด
      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      setFormData(prev => ({
        ...prev,
        coordinates: { latitude, longitude },
        address: address ? 
          `${address.name || ''} ${address.street || ''} ${address.district || ''} ${address.city || ''} ${address.region || ''} ${address.postalCode || ''}`.trim()
          : prev.address,
        province: address?.region || prev.province,
        district: address?.district || prev.district
      }));

      Alert.alert('สำเร็จ', 'บันทึกพิกัดร้านค้าเรียบร้อยแล้ว');
      
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถดึงตำแหน่งได้ กรุณาลองใหม่');
    } finally {
      setLocationLoading(false);
      setShowMapModal(false);
    }
  };

  const openMapForLocation = () => {
    setShowMapModal(true);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectProvince = (province) => {
    handleInputChange('province', province);
    setShowProvinceModal(false);
    setSearchQuery('');
  };

  const validateTaxId = (taxId) => {
    const cleanTaxId = taxId.replace(/-/g, '');
    if (cleanTaxId.length !== 13) return false;
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanTaxId.charAt(i)) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    
    return checkDigit === parseInt(cleanTaxId.charAt(12));
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
    if (!formData.province.trim()) {
      Alert.alert('Error', 'Please select province');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return false;
    }
    if (!generatedShopNumber) {
      Alert.alert('Error', 'Shop number not generated. Please try again.');
      return false;
    }
    if (!formData.ownerEmail) { // ADD THIS VALIDATION
      Alert.alert('Error', 'Please assign a shop owner');
      return false;
    }
    
    if (formData.taxId && !validateTaxId(formData.taxId)) {
      Alert.alert('Error', 'Invalid Tax ID format');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const shopData = {
        ...formData,
        shopId: generatedShopNumber,
        partnerId: user?.id,
        partnerCode: user?.partnerCode,
        status: 'pending',
        registeredAt: new Date().toISOString(),
        settings: {
          commissionRate: 10,
          autoApproveQuests: false
        },
        ownerInfo: { // ADD OWNER INFO
          email: formData.ownerEmail,
          userId: formData.ownerUserId
        }
      };

      console.log('Submitting shop data:', shopData);
      
      const result = await shopAPI.registerShop(shopData);
      
      Alert.alert(
        'Success!',
        `Shop "${formData.shopName}" has been registered successfully!\n\nShop ID: ${generatedShopNumber}\nOwner: ${formData.ownerEmail}\nLocation: ${formData.province}\nStatus: Pending Approval`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('PartnerDashboard')
          }
        ]
      );
      
    } catch (error) {
      console.error('Error registering shop:', error);
      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to register shop. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProvinceItem = ({ item }) => (
    <TouchableOpacity
      style={styles.provinceItem}
      onPress={() => selectProvince(item)}
    >
      <Text style={styles.provinceText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register New Shop</Text>
        <Text style={styles.headerSubtitle}>
          Partner Code: {user?.partnerCode || 'N/A'}
        </Text>
      </View>

      {/* Shop Number Display */}
      {generatedShopNumber && (
        <View style={styles.shopNumberSection}>
          <Text style={styles.shopNumberLabel}>Your Shop Number</Text>
          <Text style={styles.shopNumber}>{generatedShopNumber}</Text>
          <Text style={styles.shopNumberHelper}>
            This unique ID will be used to identify your shop
          </Text>
        </View>
      )}

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

        {/* Shop Owner Section - NEW */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Shop Owner *</Text>
          
          {formData.ownerEmail ? (
            <View style={styles.ownerAssigned}>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerEmail}>{formData.ownerEmail}</Text>
                <Text style={styles.ownerStatus}>
                  {ownerData ? `Existing user (${ownerData.userType})` : 'New user'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.removeOwnerButton}
                onPress={removeShopOwner}
              >
                <Text style={styles.removeOwnerText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.assignOwnerButton}
              onPress={() => setShowOwnerModal(true)}
            >
              <Text style={styles.assignOwnerText}>+ Assign Shop Owner</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.helperText}>
            Shop owner will receive login credentials to manage this shop
          </Text>
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

        {/* Province Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Province (จังหวัด) *</Text>
          <TouchableOpacity
            style={styles.provinceSelector}
            onPress={() => setShowProvinceModal(true)}
          >
            <Text style={formData.province ? styles.provinceSelectedText : styles.provincePlaceholder}>
              {formData.province || 'Select Province'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* District */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>District (อำเภอ/เขต)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter district"
            value={formData.district}
            onChangeText={(value) => handleInputChange('district', value)}
          />
        </View>

        {/* Tax ID */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tax ID (เลขผู้เสียภาษี)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g., 0-1234-56789-01-2"
            keyboardType="numeric"
            value={formData.taxId}
            onChangeText={(value) => handleInputChange('taxId', value)}
            maxLength={17}
          />
          <Text style={styles.helperText}>
            Optional - สามารถเพิ่มได้ภายหลังโดยเจ้าของร้าน
          </Text>
        </View>

        {/* Address & GPS */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Address (ที่อยู่เต็ม)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Enter full address (บ้านเลขที่, ถนน, ตำบล/แขวง)"
            multiline
            numberOfLines={3}
            value={formData.address}
            onChangeText={(value) => handleInputChange('address', value)}
          />
          
          <View style={styles.locationButtons}>
            <TouchableOpacity
              style={[styles.gpsButton, locationLoading && styles.gpsButtonDisabled]}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.gpsButtonText}>📍 ใช้ตำแหน่งปัจจุบัน</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.mapButton}
              onPress={openMapForLocation}
            >
              <Text style={styles.mapButtonText}>🗺️ เลือกจากแผนที่</Text>
            </TouchableOpacity>
          </View>
          
          {formData.coordinates && (
            <View style={styles.coordinatesInfo}>
              <Text style={styles.coordinatesText}>
                📍 พิกัด: {formData.coordinates.latitude.toFixed(6)}, {formData.coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          )}
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
          disabled={loading || !generatedShopNumber}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>
              {generatedShopNumber ? 'Register Shop' : 'Generating Shop ID...'}
            </Text>
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

      {/* NEW: Shop Owner Assignment Modal */}
      <Modal
        visible={showOwnerModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Shop Owner</Text>
            
            <Text style={styles.modalText}>
              Enter the email address of the shop owner. We'll check if they already have an account or create a new one.
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="owner@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={ownerEmail}
              onChangeText={setOwnerEmail}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowOwnerModal(false);
                  setOwnerEmail('');
                }}
              >
                <Text style={styles.modalButtonSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, (!ownerEmail.trim() || emailChecking) && styles.modalButtonDisabled]}
                onPress={checkOwnerEmail}
                disabled={!ownerEmail.trim() || emailChecking}
              >
                {emailChecking ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Check Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Province Selection Modal */}
      <Modal
        visible={showProvinceModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เลือกจังหวัด</Text>
            
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="ค้นหาจังหวัด..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Province List */}
            <FlatList
              data={filteredProvinces}
              renderItem={renderProvinceItem}
              keyExtractor={(item, index) => index.toString()}
              style={styles.provinceList}
              showsVerticalScrollIndicator={true}
              ListEmptyComponent={
                <Text style={styles.noResultsText}>ไม่พบจังหวัดที่ค้นหา</Text>
              }
            />

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setShowProvinceModal(false);
                setSearchQuery('');
              }}
            >
              <Text style={styles.modalButtonSecondaryText}>ปิด</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>เลือกตำแหน่งร้านค้า</Text>
            <Text style={styles.modalText}>
              ฟังก์ชันนี้จะเชื่อมต่อกับ Google Maps API ในอนาคต
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={getCurrentLocation}
              >
                <Text style={styles.modalButtonText}>ใช้ตำแหน่งปัจจุบัน</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowMapModal(false)}
              >
                <Text style={styles.modalButtonSecondaryText}>ปิด</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
            Shop ID: {generatedShopNumber || 'Generating...'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            Shop owner will receive login credentials to manage the shop
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoBullet}>•</Text>
          <Text style={styles.infoText}>
            Existing customers will be upgraded to shop owner role
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
  shopNumberSection: {
    backgroundColor: '#e7f3ff',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  shopNumberLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  shopNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 5,
  },
  shopNumberHelper: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Province Selector Styles
  provinceSelector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  provinceSelectedText: {
    fontSize: 16,
    color: '#333',
  },
  provincePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  // Province Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    margin: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  provinceList: {
    maxHeight: 400,
    marginBottom: 15,
  },
  provinceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  provinceText: {
    fontSize: 16,
    color: '#333',
  },
  sectionHeader: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a6baf',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
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
  locationButtons: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  gpsButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  gpsButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  gpsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  mapButton: {
    backgroundColor: '#ffc107',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#212529',
    fontSize: 14,
    fontWeight: '500',
  },
  coordinatesInfo: {
    backgroundColor: '#e7f3ff',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4a6baf',
  },
  coordinatesText: {
    fontSize: 12,
    color: '#4a6baf',
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
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    gap: 10,
  },
  modalButton: {
    backgroundColor: '#4a6baf',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  modalButtonSecondaryText: {
    color: '#6c757d',
    fontSize: 16,
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
  assignOwnerButton: {
    backgroundColor: '#e7f3ff',
    borderWidth: 2,
    borderColor: '#4a6baf',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  assignOwnerText: {
    color: '#4a6baf',
    fontSize: 16,
    fontWeight: '500',
  },
  ownerAssigned: {
    backgroundColor: '#f0f8f0',
    borderWidth: 1,
    borderColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
  },
  ownerEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 2,
  },
  ownerStatus: {
    fontSize: 12,
    color: '#666',
  },
  removeOwnerButton: {
    padding: 8,
  },
  removeOwnerText: {
    color: '#dc3545',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonDisabled: {
    backgroundColor: '#6c757d',
  },
});

export default ShopRegisterScreen;