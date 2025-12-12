// MinimalApp.js - Ultra simple test
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MinimalApp() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Minimal App Working</Text>
            <Text style={styles.subtext}>If this shows, basic setup is OK</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#4a6baf',
    },
    text: {
        fontSize: 24,
        color: 'white',
        fontWeight: 'bold',
    },
    subtext: {
        fontSize: 16,
        color: 'white',
        marginTop: 10,
    },
});