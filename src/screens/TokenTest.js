// src/screens/TokenTest.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TokenTest = () => {
  const { user, token } = useAuth();

  const checkStorage = async () => {
    console.log('=== STORAGE CHECK ===');
    const storedToken = await AsyncStorage.getItem('userToken');
    const storedUser = await AsyncStorage.getItem('userData');
    
    console.log('Stored Token:', storedToken);
    console.log('Stored User:', storedUser);
    console.log('Context Token:', token);
    console.log('Context User:', user);
    console.log('====================');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Token Debug</Text>
      
      <Text>User: {user?.email}</Text>
      <Text>Token: {token ? 'Present' : 'Missing'}</Text>
      
      <TouchableOpacity style={styles.button} onPress={checkStorage}>
        <Text style={styles.buttonText}>Check Storage</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4a6baf',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default TokenTest;