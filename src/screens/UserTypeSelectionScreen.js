// src/screens/UserTypeSelectionScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';

const UserTypeSelectionScreen = ({ navigation }) => {
  const { user, setUserType } = useAuth();

  const handleUserTypeSelect = async (selectedUserType) => {
    try {
      // อัพเดท user type
      setUserType(selectedUserType);
      
      // นำทางไปยังหน้าต่างๆ ตามประเภทผู้ใช้
      if (selectedUserType === 'customer') {
        navigation.navigate('CustomerDashboard');
      } else if (selectedUserType === 'partner') {
        navigation.navigate('PartnerRegister');
      } else if (selectedUserType === 'shop') {
        navigation.navigate('ShopRegister');
      }
    } catch (error) {
      console.error('Error selecting user type:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Role</Text>
      <Text style={styles.subtitle}>Welcome {user?.name}! How do you want to use Thaiquestify?</Text>

      {/* Customer Option */}
      <TouchableOpacity 
        style={styles.optionCard}
        onPress={() => handleUserTypeSelect('customer')}
      >
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
          style={styles.optionIcon}
        />
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>Customer</Text>
          <Text style={styles.optionDescription}>
            Browse and book services, make purchases
          </Text>
        </View>
      </TouchableOpacity>

      {/* Partner Option */}
      <TouchableOpacity 
        style={styles.optionCard}
        onPress={() => handleUserTypeSelect('partner')}
      >
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135768.png' }}
          style={styles.optionIcon}
        />
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>Service Partner</Text>
          <Text style={styles.optionDescription}>
            Offer services and manage your business
          </Text>
        </View>
      </TouchableOpacity>

      {/* Shop Option */}
      <TouchableOpacity 
        style={styles.optionCard}
        onPress={() => handleUserTypeSelect('shop')}
      >
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/869/869636.png' }}
          style={styles.optionIcon}
        />
        <View style={styles.optionTextContainer}>
          <Text style={styles.optionTitle}>Shop Owner</Text>
          <Text style={styles.optionDescription}>
            Sell products and manage your shop
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Styles เดิม...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});

export default UserTypeSelectionScreen;