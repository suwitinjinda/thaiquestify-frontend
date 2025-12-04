// src/screens/PartnerRegisterScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';

const PartnerRegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      idCard: ''
    },
    area: {
      province: '',
      district: '',
      subdistrict: ''
    },
    bankAccount: {
      bankName: '',
      accountNumber: '',
      accountName: ''
    }
  });

  // ใน handleSubmit function
const handleSubmit = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${API_BASE}/partners/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    if (data.success) {
      Alert.alert(
        'Success!',
        `Partner registration submitted!\nYour partner code: ${data.partnerCode}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      Alert.alert('Error', data.message || 'Registration failed');
    }
  } catch (error) {
    Alert.alert('Error', 'Network error. Please try again.');
  } finally {
    setLoading(false);
  }
};
    
  const updateForm = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Partner Registration</Text>
        <Text style={styles.subtitle}>สมัครเป็นพาร์ทเนอร์พื้นที่</Text>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ข้อมูลส่วนตัว</Text>
        
        <TextInput
          style={styles.input}
          placeholder="ชื่อ *"
          value={formData.personalInfo.firstName}
          onChangeText={(text) => updateForm('personalInfo', 'firstName', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="นามสกุล *"
          value={formData.personalInfo.lastName}
          onChangeText={(text) => updateForm('personalInfo', 'lastName', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="เบอร์โทรศัพท์ *"
          value={formData.personalInfo.phone}
          onChangeText={(text) => updateForm('personalInfo', 'phone', text)}
          keyboardType="phone-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="อีเมล"
          value={formData.personalInfo.email}
          onChangeText={(text) => updateForm('personalInfo', 'email', text)}
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="เลขประจำตัวประชาชน"
          value={formData.personalInfo.idCard}
          onChangeText={(text) => updateForm('personalInfo', 'idCard', text)}
        />
      </View>

      {/* Area */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>พื้นที่ทำงาน</Text>
        
        <TextInput
          style={styles.input}
          placeholder="จังหวัด"
          value={formData.area.province}
          onChangeText={(text) => updateForm('area', 'province', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="อำเภอ"
          value={formData.area.district}
          onChangeText={(text) => updateForm('area', 'district', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="ตำบล"
          value={formData.area.subdistrict}
          onChangeText={(text) => updateForm('area', 'subdistrict', text)}
        />
      </View>

      {/* Bank Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ข้อมูลบัญชีธนาคาร</Text>
        
        <TextInput
          style={styles.input}
          placeholder="ชื่อธนาคาร"
          value={formData.bankAccount.bankName}
          onChangeText={(text) => updateForm('bankAccount', 'bankName', text)}
        />
        
        <TextInput
          style={styles.input}
          placeholder="เลขที่บัญชี"
          value={formData.bankAccount.accountNumber}
          onChangeText={(text) => updateForm('bankAccount', 'accountNumber', text)}
          keyboardType="number-pad"
        />
        
        <TextInput
          style={styles.input}
          placeholder="ชื่อบัญชี"
          value={formData.bankAccount.accountName}
          onChangeText={(text) => updateForm('bankAccount', 'accountName', text)}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Registration</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        * หลังจากสมัครแล้ว ทีมงานจะติดต่อกลับเพื่อยืนยันข้อมูลภายใน 24 ชั่วโมง
      </Text>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4a6baf',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#28a745',
    margin: 15,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    margin: 15,
    fontStyle: 'italic',
  },
});

export default PartnerRegisterScreen;