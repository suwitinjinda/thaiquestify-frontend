import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const StreakDisplay = ({
    stats,
    onPress,
    isLoading = false,
    showDetails = true
}) => {
    const {
        currentStreak = 0,
        longestStreak = 0,
        dailyCompleted = 0,
        multiplier = 1.0,
        nextReset = { time: '', hours: 0, minutes: 0 }
    } = stats;

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#FF6B35" />
                <Text style={styles.loadingText}>กำลังโหลด...</Text>
            </View>
        );
    }

    const renderFlames = () => {
        const flames = [];
        const flameCount = Math.min(currentStreak, 5); // แสดงแค่ 5 ดวง

        for (let i = 0; i < 5; i++) {
            const isActive = i < flameCount;
            flames.push(
                <MaterialIcons
                    key={i}
                    name="whatshot"
                    size={16}
                    color={isActive ? '#FF6B35' : '#E0E0E0'}
                    style={styles.flameIcon}
                />
            );
        }

        return flames;
    };

    const getStreakMessage = () => {
        if (currentStreak === 0) return 'เริ่ม streak วันนี้!';
        if (currentStreak === 1) return 'เก่งมาก!';
        if (currentStreak < 7) return `อีก ${7 - currentStreak} วันเพื่อ bonus`;
        if (currentStreak < 14) return '7-Day Streak!';
        if (currentStreak < 30) return '2-Week Legend!';
        return 'Streak God!';
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={!onPress}
        >
            <View style={styles.content}>
                <View style={styles.streakMain}>
                    <View style={styles.streakNumberContainer}>
                        <Text style={styles.currentStreak}>{currentStreak}</Text>
                        <Text style={styles.streakLabel}>วัน</Text>
                    </View>

                    <View style={styles.flamesContainer}>
                        {renderFlames()}
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.streakMessage}>
                        {getStreakMessage()}
                    </Text>

                    {multiplier > 1 && (
                        <View style={styles.multiplierBadge}>
                            <Text style={styles.multiplierText}>x{multiplier}</Text>
                        </View>
                    )}
                </View>

                {showDetails && (
                    <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <MaterialIcons name="emoji-events" size={12} color="#666" />
                            <Text style={styles.detailText}>{longestStreak}</Text>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailItem}>
                            <MaterialIcons name="check-circle" size={12} color="#666" />
                            <Text style={styles.detailText}>{dailyCompleted}</Text>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailItem}>
                            <MaterialIcons name="access-time" size={12} color="#666" />
                            <Text style={styles.detailText}>{nextReset.hours}h</Text>
                        </View>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingContainer: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 8,
        fontSize: 12,
        color: '#666',
    },
    content: {
        width: '100%',
    },
    streakMain: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    streakNumberContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    currentStreak: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FF6B35',
        lineHeight: 32,
    },
    streakLabel: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    flamesContainer: {
        flexDirection: 'row',
    },
    flameIcon: {
        marginHorizontal: 2,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    streakMessage: {
        fontSize: 12,
        color: '#4a6baf',
        fontWeight: '500',
        flex: 1,
    },
    multiplierBadge: {
        backgroundColor: '#FF6B35',
        borderRadius: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        minWidth: 30,
        alignItems: 'center',
    },
    multiplierText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
        padding: 6,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    detailText: {
        fontSize: 11,
        color: '#666',
        marginLeft: 4,
        fontWeight: '500',
    },
    detailDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#e0e0e0',
    },
});

export default StreakDisplay;