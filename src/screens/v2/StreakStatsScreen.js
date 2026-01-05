import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStreak } from '../../hooks/v2/useStreak';

const StreakStatsScreen = ({ navigation }) => {
    const {
        streakStats,
        leaderboard,
        loadLeaderboard,
        refreshAll,
        getStreakMultiplier
    } = useStreak();

    const {
        currentStreak,
        longestStreak,
        dailyCompleted,
        totalPoints,
        nextReset,
        multiplier,
        isLoading,
        error
    } = streakStats;

    const renderStreakAchievements = () => {
        const achievements = [
            { days: 3, name: 'Beginner', icon: 'emoji-events', color: '#cd7f32' },
            { days: 7, name: 'Regular', icon: 'emoji-events', color: '#c0c0c0' },
            { days: 14, name: 'Dedicated', icon: 'emoji-events', color: '#ffd700' },
            { days: 30, name: 'Legend', icon: 'emoji-events', color: '#4a6baf' },
        ];

        return achievements.map((achievement) => {
            const isUnlocked = currentStreak >= achievement.days;
            const progress = Math.min(currentStreak / achievement.days, 1);

            return (
                <View key={achievement.days} style={styles.achievementCard}>
                    <View style={styles.achievementHeader}>
                        <MaterialIcons
                            name={achievement.icon}
                            size={24}
                            color={isUnlocked ? achievement.color : '#ccc'}
                        />
                        <Text style={styles.achievementName}>{achievement.name}</Text>
                    </View>

                    <Text style={styles.achievementTarget}>{achievement.days} วัน</Text>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${progress * 100}%`,
                                        backgroundColor: isUnlocked ? achievement.color : '#e0e0e0'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>
                            {isUnlocked ? '✅ สำเร็จ!' : `${currentStreak}/${achievement.days}`}
                        </Text>
                    </View>
                </View>
            );
        });
    };

    const renderLeaderboard = () => {
        if (leaderboard.isLoading) {
            return (
                <View style={styles.leaderboardLoading}>
                    <ActivityIndicator size="small" color="#4a6baf" />
                    <Text style={styles.leaderboardLoadingText}>กำลังโหลดอันดับ...</Text>
                </View>
            );
        }

        if (leaderboard.error) {
            return (
                <View style={styles.leaderboardError}>
                    <MaterialIcons name="error-outline" size={24} color="#dc3545" />
                    <Text style={styles.leaderboardErrorText}>{leaderboard.error}</Text>
                </View>
            );
        }

        if (leaderboard.data.length === 0) {
            return (
                <View style={styles.leaderboardEmpty}>
                    <Text style={styles.leaderboardEmptyText}>ยังไม่มีอันดับ</Text>
                    <Text style={styles.leaderboardEmptySubtext}>
                        เป็นคนแรกที่เริ่ม streak!
                    </Text>
                </View>
            );
        }

        return (
            <>
                {leaderboard.data.map((item, index) => (
                    <View key={item.rank} style={styles.leaderboardItem}>
                        <View style={styles.rankContainer}>
                            <Text style={[
                                styles.rank,
                                index === 0 && styles.firstRank,
                                index === 1 && styles.secondRank,
                                index === 2 && styles.thirdRank
                            ]}>
                                {item.rank}
                            </Text>
                        </View>

                        <View style={styles.userInfo}>
                            <Text style={styles.userName} numberOfLines={1}>
                                {item.name}
                            </Text>
                            <Text style={styles.userStreak}>
                                {item.streak} วัน • {item.totalPoints} pts
                            </Text>
                        </View>

                        {item.rank <= 3 && (
                            <MaterialIcons
                                name="emoji-events"
                                size={20}
                                color={
                                    index === 0 ? '#ffd700' :
                                        index === 1 ? '#c0c0c0' :
                                            '#cd7f32'
                                }
                            />
                        )}
                    </View>
                ))}
            </>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.fullLoading}>
                <ActivityIndicator size="large" color="#4a6baf" />
                <Text style={styles.fullLoadingText}>กำลังโหลดสถิติ...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.fullError}>
                <MaterialIcons name="error-outline" size={64} color="#dc3545" />
                <Text style={styles.fullErrorText}>เกิดข้อผิดพลาด</Text>
                <Text style={styles.fullErrorSubtext}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={refreshAll}
                >
                    <Text style={styles.retryText}>ลองใหม่</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>สถิติ Streak</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Current Streak Stats */}
            <View style={styles.currentStatsCard}>
                <View style={styles.currentStreakDisplay}>
                    <Text style={styles.currentStreakNumber}>{currentStreak}</Text>
                    <Text style={styles.currentStreakLabel}>วันต่อเนื่อง</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{longestStreak}</Text>
                        <Text style={styles.statLabel}>สถิติสูงสุด</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{dailyCompleted}</Text>
                        <Text style={styles.statLabel}>เควสวันนี้</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{totalPoints}</Text>
                        <Text style={styles.statLabel}>คะแนนทั้งหมด</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>x{multiplier}</Text>
                        <Text style={styles.statLabel}>Multiplier</Text>
                    </View>
                </View>

                <View style={styles.resetInfo}>
                    <MaterialIcons name="access-time" size={16} color="#666" />
                    <Text style={styles.resetText}>
                        รีเซ็ตใหม่ใน {nextReset.time}
                    </Text>
                </View>
            </View>

            {/* Achievements */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🎯 ความสำเร็จ</Text>
                {renderStreakAchievements()}
            </View>

            {/* Leaderboard */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🏆 อันดับสูงสุด</Text>
                    <TouchableOpacity onPress={loadLeaderboard}>
                        <MaterialIcons name="refresh" size={20} color="#4a6baf" />
                    </TouchableOpacity>
                </View>
                {renderLeaderboard()}
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>ℹ️ เกี่ยวกับ Streak</Text>
                <Text style={styles.infoText}>
                    • Streak คือจำนวนวันที่คุณทำเควสติดต่อกัน{'\n'}
                    • Streak จะรีเซ็ตทุกวันเวลา 00:00 น.{'\n'}
                    • ยิ่ง Streak นาน คะแนนที่ได้ก็ยิ่งมากขึ้น{'\n'}
                    • ทำเควสอย่างน้อย 1 เควสต่อวันเพื่อรักษา Streak{'\n'}
                    • หากขาด 1 วัน Streak จะกลับไปเริ่มใหม่
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    fullLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    fullLoadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666'
    },
    fullError: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    fullErrorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#dc3545',
        marginTop: 16,
        marginBottom: 8
    },
    fullErrorSubtext: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24
    },
    retryButton: {
        backgroundColor: '#4a6baf',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8
    },
    retryText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    backButton: {
        padding: 4
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
    },
    currentStatsCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        margin: 16,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        alignItems: 'center'
    },
    currentStreakDisplay: {
        alignItems: 'center',
        marginBottom: 20
    },
    currentStreakNumber: {
        fontSize: 64,
        fontWeight: 'bold',
        color: '#ff6b35',
        lineHeight: 70
    },
    currentStreakLabel: {
        fontSize: 16,
        color: '#666',
        marginTop: -8
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 16
    },
    statItem: {
        width: '48%',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        marginBottom: 8
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        color: '#666'
    },
    resetInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e7f3ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8
    },
    resetText: {
        fontSize: 14,
        color: '#4a6baf',
        marginLeft: 6,
        fontWeight: '500'
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 12
    },
    achievementCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8
    },
    achievementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    achievementName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginLeft: 8,
        flex: 1
    },
    achievementTarget: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#e9ecef',
        borderRadius: 3,
        overflow: 'hidden',
        marginRight: 8
    },
    progressFill: {
        height: '100%',
        borderRadius: 3
    },
    progressText: {
        fontSize: 12,
        color: '#666',
        minWidth: 60
    },
    leaderboardLoading: {
        padding: 20,
        alignItems: 'center'
    },
    leaderboardLoadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666'
    },
    leaderboardError: {
        padding: 20,
        alignItems: 'center'
    },
    leaderboardErrorText: {
        marginTop: 8,
        fontSize: 14,
        color: '#dc3545'
    },
    leaderboardEmpty: {
        padding: 20,
        alignItems: 'center'
    },
    leaderboardEmptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4
    },
    leaderboardEmptySubtext: {
        fontSize: 14,
        color: '#999'
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    rankContainer: {
        width: 32,
        alignItems: 'center'
    },
    rank: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666'
    },
    firstRank: {
        color: '#ffd700',
        fontSize: 18
    },
    secondRank: {
        color: '#c0c0c0',
        fontSize: 18
    },
    thirdRank: {
        color: '#cd7f32',
        fontSize: 18
    },
    userInfo: {
        flex: 1,
        marginLeft: 12
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2
    },
    userStreak: {
        fontSize: 12,
        color: '#666'
    },
    infoSection: {
        backgroundColor: '#e7f3ff',
        borderRadius: 16,
        padding: 16,
        margin: 16,
        marginBottom: 32
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4a6baf',
        marginBottom: 12
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20
    }
});

export default StreakStatsScreen;