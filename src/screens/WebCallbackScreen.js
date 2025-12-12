// src/screens/WebCallbackScreen.js
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WebCallbackScreen() {
    const route = useRoute();
    const navigation = useNavigation();

    useEffect(() => {
        const processCallback = async () => {
            try {
                const url = route.params?.url;
                console.log('🌐 Processing callback URL:', url);

                if (!url) {
                    console.log('❌ No URL provided');
                    navigation.goBack();
                    return;
                }

                // Your LoginScreen already handles the OAuth flow
                // This screen just acts as a bridge
                console.log('✅ Facebook callback received, returning to app...');

                // Wait a moment then go back to LoginScreen
                setTimeout(() => {
                    navigation.goBack();
                }, 1000);

            } catch (error) {
                console.error('Callback processing error:', error);
                navigation.goBack();
            }
        };

        processCallback();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#4a6baf" />
            <Text style={styles.text}>กำลังประมวลผลการเข้าสู่ระบบ...</Text>
            <Text style={styles.subtext}>กรุณารอสักครู่</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 20,
        marginBottom: 10,
    },
    subtext: {
        fontSize: 14,
        color: '#666',
    },
});