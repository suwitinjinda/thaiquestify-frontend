// src/screens/FacebookDebugScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { FacebookService } from '../services/facebookService';

const FacebookDebugScreen = () => {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const [userPages, setUserPages] = useState([]);

  const testFacebookLogin = async () => {
    try {
      setLoading(true);
      setDebugInfo('Logging in to Facebook...');
      
      const result = await FacebookService.login();
      
      setDebugInfo(JSON.stringify(result, null, 2));
      Alert.alert('Success', 'Facebook login successful!');
      
      // Get user's liked pages
      const pages = await FacebookService.getUserLikedPages(result.accessToken);
      setUserPages(pages.data || []);
      
    } catch (error) {
      setDebugInfo(`Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const testPageCheck = async () => {
    const pageId = prompt('Enter Facebook Page ID to check:');
    if (!pageId) return;
    
    try {
      setLoading(true);
      setDebugInfo(`Checking page ${pageId}...`);
      
      const loginResult = await FacebookService.login();
      const isFollowing = await FacebookService.checkPageLike(loginResult.accessToken, pageId);
      
      setDebugInfo(`User ${isFollowing ? 'FOLLOWS' : 'DOES NOT FOLLOW'} page ${pageId}`);
      Alert.alert('Result', `User ${isFollowing ? 'follows' : 'does not follow'} this page`);
      
    } catch (error) {
      setDebugInfo(`Error: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const logoutFacebook = async () => {
    await FacebookService.logout();
    setDebugInfo('Logged out from Facebook');
    setUserPages([]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Facebook API Debug</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={testFacebookLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Test Facebook Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={testPageCheck}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Test Page Like Check</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.warningButton]}
        onPress={logoutFacebook}
      >
        <Text style={styles.buttonText}>Logout Facebook</Text>
      </TouchableOpacity>
      
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1877f2" />
          <Text style={styles.loadingText}>Connecting to Facebook...</Text>
        </View>
      )}
      
      {debugInfo && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{debugInfo}</Text>
        </View>
      )}
      
      {userPages.length > 0 && (
        <View style={styles.pagesContainer}>
          <Text style={styles.pagesTitle}>Your Liked Pages ({userPages.length}):</Text>
          {userPages.map((page, index) => (
            <View key={index} style={styles.pageItem}>
              <Text style={styles.pageName}>{page.name}</Text>
              <Text style={styles.pageId}>ID: {page.id}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1877f2',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#4a6baf',
  },
  warningButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loading: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  debugContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  pagesContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  pagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  pageItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  pageId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default FacebookDebugScreen;