import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const DailyQuestCard = ({
    quest,
    onPress,
    isLoading = false,
    streakMultiplier = 1.0
}) => {
    const {
        _id,
        name,
        description,
        points,
        icon = 'assignment',
        requirements,
        isCompleted = false,
        isAvailable = true
    } = quest;

    const pointsWithMultiplier = Math.floor(points * streakMultiplier);

    if (isLoading) {
        return (
            <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#4a6baf" />
                <Text style={styles.loadingText}>กำลังโหลด...</Text>
            </View>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.card,
                isCompleted && styles.completedCard,
                !isAvailable && styles.disabledCard
            ]}
            onPress={() => !isCompleted && isAvailable && onPress?.(quest)}
            disabled={isCompleted || !isAvailable}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <MaterialIcons
                        name={icon}
                        size={24}
                        color={isCompleted ? '#28a745' : '#4a6baf'}
                    />
                    {streakMultiplier > 1 && (
                        <View style={styles.multiplierBadge}>
                            <Text style={styles.multiplierText}>x{streakMultiplier}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.infoContainer}>
                    <Text style={styles.name} numberOfLines={1}>
                        {name}
                    </Text>
                    <Text style={styles.description} numberOfLines={2}>
                        {description}
                    </Text>

                    {requirements && (
                        <Text style={styles.requirements}>
                            📋 {requirements}
                        </Text>
                    )}
                </View>

                <View style={styles.pointsContainer}>
                    <Text style={[
                        styles.points,
                        isCompleted && styles.completedPoints
                    ]}>
                        {pointsWithMultiplier}
                    </Text>
                    <Text style={styles.pointsLabel}>คะแนน</Text>
                </View>
            </View>

            <View style={styles.statusContainer}>
                {isCompleted ? (
                    <View style={styles.completedStatus}>
                        <MaterialIcons name="check-circle" size={14} color="#28a745" />
                        <Text style={styles.completedText}>สำเร็จแล้ว</Text>
                    </View>
                ) : !isAvailable ? (
                    <View style={styles.unavailableStatus}>
                        <MaterialIcons name="schedule" size={14} color="#ffc107" />
                        <Text style={styles.unavailableText}>ยังไม่เปิด</Text>
                    </View>
                ) : (
                    <View style={styles.pendingStatus}>
                        <MaterialIcons name="play-circle-outline" size={14} color="#4a6baf" />
                        <Text style={styles.pendingText}>เริ่มทำ</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    loadingCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666'
    },
    completedCard: {
        backgroundColor: '#f8fff9',
        borderColor: '#d4edda'
    },
    disabledCard: {
        backgroundColor: '#f8f9fa',
        borderColor: '#e9ecef',
        opacity: 0.7
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    iconContainer: {
        position: 'relative',
        marginRight: 12,
        paddingTop: 2
    },
    multiplierBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#ff6b35',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 2,
        minWidth: 20
    },
    multiplierText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    infoContainer: {
        flex: 1,
        marginRight: 12
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    description: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 6
    },
    requirements: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic'
    },
    pointsContainer: {
        alignItems: 'center',
        minWidth: 50
    },
    points: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#28a745',
        marginBottom: 2
    },
    completedPoints: {
        color: '#28a745'
    },
    pointsLabel: {
        fontSize: 11,
        color: '#666'
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    completedStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d4edda',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    completedText: {
        fontSize: 12,
        color: '#155724',
        marginLeft: 4,
        fontWeight: '500'
    },
    unavailableStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3cd',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    unavailableText: {
        fontSize: 12,
        color: '#856404',
        marginLeft: 4,
        fontWeight: '500'
    },
    pendingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e7f3ff',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    pendingText: {
        fontSize: 12,
        color: '#0a58ca',
        marginLeft: 4,
        fontWeight: '500'
    }
});

export default DailyQuestCard;