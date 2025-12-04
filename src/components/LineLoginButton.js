// src/components/LineLoginButton.js
import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { login, logout } from '@xmartlabs/react-native-line';

const LineLoginButton = ({ onLoginSuccess, onLoginError }) => {
  const { loginWithLINE } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRealLineLogin = async () => {
    try {
      // 1. Login with LINE SDK
      const loginResult = await login();
      console.log('LINE Login Result:', loginResult);

      // 2. Send access token to backend
      const result = await loginWithLINE(loginResult.accessToken);
      
      if (result.success) {
        onLoginSuccess?.(result.user);
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Real LINE Login failed:', error);
      
      // Fallback to demo mode
      Alert.alert(
        'LINE Login Failed', 
        'Using demo mode instead. Would you like to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Use Demo', 
            onPress: handleDemoLogin 
          }
        ]
      );
    }
  };

  const handleDemoLogin = async () => {
    const result = await loginWithLINE('demo');
    if (result.success) {
      onLoginSuccess?.(result.user);
    } else {
      Alert.alert('Demo Login Failed', result.error);
    }
  };

  const handlePress = async () => {
    setLoading(true);
    try {
      await handleRealLineLogin();
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
      onLoginError?.(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.buttonText}>Login with LINE</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#06C755',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 200,
  },
  icon: {
    fontSize: 18,
    marginRight: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LineLoginButton;