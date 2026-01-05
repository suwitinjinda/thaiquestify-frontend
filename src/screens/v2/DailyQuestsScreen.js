// ใน DailyQuestsScreen.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import StreakDisplay from '../../components/v2/StreakDisplay';
import { useStreak } from '../../hooks/v2/useStreak';

const DailyQuestsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const {
        dailyQuests,
        streakStats,
        leaderboard,
        loadDailyQuests,
        loadStreakStats,
        loadLeaderboard,
        completeDailyQuest,
        refreshAll,
        isLoading
    } = useStreak();

    const [refreshing, setRefreshing] = useState(false);
    const [recentlyCompletedQuestId, setRecentlyCompletedQuestId] = useState(null);
    const mountedRef = useRef(true);

    // ใช้ useMemo เพื่อ memoize components และป้องกัน re-renders
    const headerComponent = useMemo(() => (
        <HeaderComponent
            user={user}
            streakStats={streakStats}
            navigation={navigation}
            dailyQuests={dailyQuests}
        />
    ), [user, streakStats, dailyQuests.completedCount, dailyQuests.totalCount]);

    const footerComponent = useMemo(() => (
        <FooterComponent
            leaderboard={leaderboard}
            navigation={navigation}
        />
    ), [leaderboard.data]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await refreshAll();
        setRefreshing(false);
    };

    const handleCompleteQuest = async (questId, questName) => {
        if (!mountedRef.current) return;

        Alert.alert(
            'ยืนยันการทำเควส',
            `คุณต้องการทำเควส "${questName}" หรือไม่?`,
            [
                { text: 'ยกเลิก', style: 'cancel' },
                {
                    text: 'ทำเควส',
                    style: 'default',
                    onPress: async () => {
                        setRecentlyCompletedQuestId(questId);
                        const result = await completeDailyQuest(questId, questName);

                        if (result.success) {
                            Alert.alert('สำเร็จ!', result.message || 'ทำเควสสำเร็จแล้ว!');
                        } else {
                            Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถทำเควสได้');
                            setRecentlyCompletedQuestId(null);
                        }
                    }
                }
            ]
        );
    };

    const renderQuestItem = useCallback(({ item }) => {
        const isCompleted = item.isCompleted || item.completed;
        const justCompleted = item._id === recentlyCompletedQuestId;

        return (
            <QuestItem
                item={item}
                isCompleted={isCompleted}
                justCompleted={justCompleted}
                onComplete={handleCompleteQuest}
            />
        );
    }, [recentlyCompletedQuestId]);

    if (isLoading && dailyQuests.quests.length === 0) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#4a6baf" />
                <Text style={styles.loadingText}>กำลังโหลดเควสรายวัน...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={dailyQuests.quests}
                renderItem={renderQuestItem}
                keyExtractor={(item) => item._id || item.id}
                ListHeaderComponent={headerComponent}
                ListFooterComponent={footerComponent}
                ListEmptyComponent={<EmptyQuests />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4a6baf']}
                    />
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                initialNumToRender={5}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                updateCellsBatchingPeriod={50}
            />
        </SafeAreaView>
    );
};

// แยก Header Component ออกมา
const HeaderComponent = React.memo(({ user, streakStats, navigation, dailyQuests }) => (
    <View>
        {/* Header */}
        <View style={styles.header}>
            <Text style={styles.title}>Daily Quests</Text>
            <Text style={styles.subtitle}>
                {user ? `สวัสดี, ${user.name}!` : 'เข้าสู่ระบบเพื่อเริ่มทำเควส'}
            </Text>
        </View>

        {/* Streak Display */}
        <View style={styles.streakContainer}>
            <StreakDisplay
                stats={streakStats}
                onPress={() => navigation.navigate('StreakStats')}
                isLoading={streakStats.isLoading}
                showDetails={true}
            />
        </View>

        {/* Today's Progress */}
        <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>ความคืบหน้าวันนี้</Text>
                <Text style={styles.progressCount}>
                    {dailyQuests.completedCount || 0}/{dailyQuests.totalCount || 0}
                </Text>
            </View>

            <View style={styles.progressBar}>
                <View
                    style={[
                        styles.progressFill,
                        {
                            width: dailyQuests.totalCount > 0
                                ? `${(dailyQuests.completedCount / dailyQuests.totalCount) * 100}%`
                                : '0%'
                        }
                    ]}
                />
            </View>

            <Text style={styles.progressText}>
                {dailyQuests.totalCount - dailyQuests.completedCount} เควสเหลือในวันนี้
            </Text>
        </View>

        {/* Daily Quests Section Title */}
        <View style={styles.questsSectionTitle}>
            <Text style={styles.sectionTitle}>📋 เควสรายวัน</Text>
        </View>
    </View>
));

// แยก Quest Item ออกมา
const QuestItem = React.memo(({ item, isCompleted, justCompleted, onComplete }) => {
    const points = item.points || item.reward || 10;
    const iconName = isCompleted ? 'check-circle' :
        item.icon === 'check_circle' ? 'check-circle-outline' :
            item.icon === 'explore' ? 'explore' :
                item.icon === 'task_alt' ? 'task-alt' : 'assignment';

    return (
        <View style={[
            styles.questCard,
            isCompleted && styles.questCardCompleted,
            justCompleted && styles.questCardJustCompleted
        ]}>
            <View style={styles.questHeader}>
                <MaterialIcons
                    name={iconName}
                    size={32}
                    color={isCompleted ? "#28a745" : "#4a6baf"}
                />
                <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>
                        {item.name || 'เควส'}
                        {justCompleted && ' ✅'}
                    </Text>
                    <Text style={styles.questDescription} numberOfLines={2}>
                        {item.description || 'ไม่มีคำอธิบาย'}
                    </Text>
                    <Text style={styles.questRequirements}>
                        📋 {item.requirements || 'ไม่มีข้อกำหนด'}
                    </Text>
                </View>
            </View>

            <View style={styles.questFooter}>
                <View style={styles.rewardSection}>
                    <MaterialIcons name="monetization-on" size={20} color="#28a745" />
                    <Text style={styles.rewardText}>
                        {points} คะแนน
                    </Text>
                </View>

                {isCompleted ? (
                    <View style={styles.completedBadge}>
                        <MaterialIcons name="check" size={16} color="white" />
                        <Text style={styles.completedText}>สำเร็จแล้ว</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => onComplete(item._id, item.name)}
                    >
                        <Text style={styles.completeButtonText}>ทำเควส</Text>
                    </TouchableOpacity>
                )}
            </View>

            {justCompleted && !isCompleted && (
                <View style={styles.syncingBadge}>
                    <ActivityIndicator size="small" color="#4a6baf" />
                    <Text style={styles.syncingText}>กำลังอัพเดท...</Text>
                </View>
            )}
        </View>
    );
});

// แยก Footer Component ออกมา
const FooterComponent = React.memo(({ leaderboard, navigation }) => (
    <View>
        {/* Leaderboard Preview */}
        {leaderboard.data.length > 0 && (
            <View style={styles.leaderboardSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🏆 อันดับสูงสุด</Text>
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => navigation.navigate('StreakStats')}
                    >
                        <Text style={styles.seeAllText}>ดูทั้งหมด</Text>
                        <MaterialIcons name="chevron-right" size={16} color="#4a6baf" />
                    </TouchableOpacity>
                </View>

                {leaderboard.data.slice(0, 5).map((item, index) => (
                    <LeaderboardItem key={item._id || index} item={item} index={index} />
                ))}
            </View>
        )}

        {/* Streak Info */}
        <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
                <MaterialIcons name="info" size={24} color="#4a6baf" />
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>เกี่ยวกับ Streak</Text>
                <Text style={styles.infoText}>
                    • ทำเควส 1 เควสต่อวันเพื่อรักษา streak{'\n'}
                    • ยิ่ง streak ยาว คะแนนที่ได้ก็ยิ่งเพิ่ม{'\n'}
                    • Streak จะรีเซ็ตทุกวันเวลา 00:00 น.
                </Text>
            </View>
        </View>
    </View>
));

// แยก Leaderboard Item
const LeaderboardItem = React.memo(({ item, index }) => {
    const isTopThree = index < 3;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    return (
        <View style={styles.leaderboardItem}>
            <View style={[styles.rankCircle, isTopThree && { backgroundColor: rankColors[index] }]}>
                <Text style={[styles.rankText, isTopThree && styles.rankTextTop]}>
                    #{item.rank || index + 1}
                </Text>
            </View>

            <View style={styles.leaderboardInfo}>
                <Text style={styles.leaderboardName} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={styles.leaderboardDetails}>
                    🔥 {item.streak} วัน • ⭐ {item.totalPoints} pts
                </Text>
            </View>

            {isTopThree && (
                <MaterialIcons name="emoji-events" size={24} color={rankColors[index]} />
            )}
        </View>
    );
});

// Empty State Component
const EmptyQuests = React.memo(() => (
    <View style={styles.emptyState}>
        <MaterialIcons name="check-circle-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>ไม่มีเควสในวันนี้</Text>
        <Text style={styles.emptySubtext}>รอเควสใหม่พรุ่งนี้!</Text>
    </View>
));

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    listContent: {
        paddingBottom: 32,
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: 'white',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
    },
    streakContainer: {
        paddingHorizontal: 16,
        marginTop: -20,
        marginBottom: 16,
    },
    progressCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 20,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    progressCount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4a6baf',
    },
    progressBar: {
        height: 10,
        backgroundColor: '#e9ecef',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4a6baf',
        borderRadius: 5,
    },
    progressText: {
        fontSize: 12,
        color: '#666',
    },
    questsSectionTitle: {
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    questCard: {
        backgroundColor: '#f8f9fa',
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4a6baf',
    },
    questCardCompleted: {
        backgroundColor: '#f0f8f0',
        borderLeftColor: '#28a745',
        opacity: 0.9,
    },
    questCardJustCompleted: {
        borderWidth: 2,
        borderColor: '#FF6B35',
        backgroundColor: '#FFF3E0',
    },
    questHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    questInfo: {
        flex: 1,
        marginLeft: 12,
    },
    questTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    questDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 4,
    },
    questRequirements: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    questFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rewardSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    rewardText: {
        fontSize: 14,
        color: '#28a745',
        fontWeight: '500',
        marginLeft: 6,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#28a745',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    completedText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 6,
    },
    completeButton: {
        backgroundColor: '#4a6baf',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 16,
    },
    completeButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    syncingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E8F4FD',
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 8,
    },
    syncingText: {
        fontSize: 12,
        color: '#4a6baf',
        marginLeft: 8,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        padding: 32,
        marginHorizontal: 16,
        backgroundColor: 'white',
        borderRadius: 16,
        marginTop: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        marginBottom: 4,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
    },
    leaderboardSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 20,
        marginTop: 20,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 14,
        color: '#4a6baf',
        fontWeight: '500',
        marginRight: 4,
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    rankCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e9ecef',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    rankTextTop: {
        color: 'white',
    },
    leaderboardInfo: {
        flex: 1,
    },
    leaderboardName: {
        fontSize: 16,
        color: '#333',
        marginBottom: 2,
    },
    leaderboardDetails: {
        fontSize: 12,
        color: '#666',
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#E7F3FF',
        margin: 16,
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
    },
    infoIcon: {
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4a6baf',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        lineHeight: 18,
    },
});

export default DailyQuestsScreen;