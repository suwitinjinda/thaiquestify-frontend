// screens/v2/CreateSocialQuestScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Switch,
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';

const CreateSocialQuestScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'facebook_follow',
        platform: 'facebook',
        target: 10, // จำนวนคนที่ต้องทำ
        rewardPoints: 20, // คะแนนที่ผู้เข้าร่วมจะได้
        creatorReward: 5, // คะแนน engagement ที่เจ้าของได้ต่อคน
        isPublic: true,
        requireVerification: true,
        durationDays: 7,
        maxParticipants: 100
    });

    const API_URL = 'https://thaiquestify.com/api';

    // ประเภทเควสที่ผู้ใช้สร้างได้
    const availableQuestTypes = [
        {
            id: 'facebook_follow',
            label: 'ติดตาม Facebook',
            icon: 'thumb-up',
            description: 'ให้ผู้เข้าร่วมติดตามเพจ/โปรไฟล์ที่กำหนด',
            maxTarget: 50,
            baseReward: 20
        },
        {
            id: 'facebook_like',
            label: 'Like โพสต์',
            icon: 'favorite',
            description: 'ให้ผู้เข้าร่วมกดไลค์โพสต์',
            maxTarget: 100,
            baseReward: 10
        },
        {
            id: 'facebook_share',
            label: 'แชร์โพสต์',
            icon: 'share',
            description: 'ให้ผู้เข้าร่วมแชร์โพสต์',
            maxTarget: 50,
            baseReward: 30
        },
        {
            id: 'instagram_follow',
            label: 'ติดตาม Instagram',
            icon: 'camera-alt',
            description: 'ให้ผู้เข้าร่วมติดตาม Instagram',
            maxTarget: 50,
            baseReward: 25
        },
        {
            id: 'line_add',
            label: 'เพิ่มเพื่อน LINE',
            icon: 'chat',
            description: 'ให้ผู้เข้าร่วมเพิ่มเพื่อน LINE',
            maxTarget: 30,
            baseReward: 40
        }
    ];

    // ดึงข้อมูลประเภทเควสที่เลือก
    const selectedQuestType = availableQuestTypes.find(type => type.id === formData.type);

    const handleCreateQuest = async () => {
        try {
            // Validation
            if (!formData.title.trim()) {
                Alert.alert('กรุณากรอกชื่อเควส');
                return;
            }

            if (!formData.description.trim()) {
                Alert.alert('กรุณากรอกคำอธิบาย');
                return;
            }

            if (formData.target < 1 || formData.target > selectedQuestType.maxTarget) {
                Alert.alert(`จำนวนเป้าหมายต้องอยู่ระหว่าง 1-${selectedQuestType.maxTarget} คน`);
                return;
            }

            setLoading(true);

            const token = await AsyncStorage.getItem('authToken');

            // ข้อมูลที่จะส่งไป backend
            const questPayload = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                platform: formData.platform,
                target: formData.target,
                reward: {
                    participantPoints: formData.rewardPoints, // คะแนนที่ผู้เข้าร่วมได้
                    creatorPoints: formData.creatorReward, // คะแนนที่เจ้าของได้ต่อคน
                },
                settings: {
                    isPublic: formData.isPublic,
                    maxParticipants: formData.maxParticipants,
                    durationDays: formData.durationDays,
                    requireVerification: formData.requireVerification
                },
                creator: {
                    userId: user?._id,
                    name: user?.name,
                    email: user?.email
                },
                status: 'active', // หรือ 'pending' ถ้าต้องการอนุมัติก่อน
                participants: [], // เริ่มต้นว่าง
                statistics: {
                    totalParticipants: 0,
                    completedParticipants: 0,
                    totalEngagement: 0
                }
            };

            console.log('Creating social quest:', questPayload);

            const response = await fetch(`${API_URL}/user-generated-quests/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(questPayload)
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    'สร้างเควสสังคมสำเร็จ! 🎉',
                    `เควส "${formData.title}" ถูกสร้างแล้ว!\n\n• ผู้เข้าร่วมจะได้ ${formData.rewardPoints} คะแนน/คน\n• คุณจะได้ ${formData.creatorReward} คะแนน engagement/คน`,
                    [
                        {
                            text: 'ดูเควสของฉัน',
                            onPress: () => navigation.navigate('MySocialQuests')
                        },
                        {
                            text: 'แชร์ให้เพื่อน',
                            onPress: () => shareQuest(data.data?.questId || data.data?._id)
                        },
                        {
                            text: 'ตกลง',
                            style: 'default'
                        }
                    ]
                );
            } else {
                throw new Error(data.message || 'สร้างเควสไม่สำเร็จ');
            }
        } catch (error) {
            console.error('Create social quest error:', error);
            Alert.alert('ข้อผิดพลาด', error.message);
        } finally {
            setLoading(false);
        }
    };

    const shareQuest = (questId) => {
        // ฟังก์ชันแชร์เควส
        const shareUrl = `thaiquestify://social-quest/${questId}`;
        const message = `มาเข้าร่วมเควส "${formData.title}" ใน ThaiQuestify กัน!\n\n${formData.description}\n\nรับ ${formData.rewardPoints} คะแนนเมื่อทำสำเร็จ!\n\n${shareUrl}`;

        // ใช้ Share API หรือ Linking
        Alert.alert('แชร์เควส', 'คัดลอกลิงค์แชร์แล้ว!');
        // สามารถเพิ่มการแชร์จริงได้ที่นี่
    };

    const updateRewardPoints = (type) => {
        const questType = availableQuestTypes.find(t => t.id === type);
        setFormData({
            ...formData,
            type: type,
            rewardPoints: questType.baseReward,
            creatorReward: Math.floor(questType.baseReward * 0.25) // เจ้าของได้ 25% ของคะแนนผู้เข้าร่วม
        });
    };

    // Calculate total potential engagement
    const calculateTotalEngagement = () => {
        const maxParticipants = Math.min(formData.maxParticipants, 100);
        const potentialEngagement = maxParticipants * formData.creatorReward;
        return potentialEngagement;
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4a6baf" />
                <Text style={styles.loadingText}>กำลังสร้างเควสสังคม...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#4a6baf" barStyle="light-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>สร้างเควสสังคม</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quest Preview Card */}
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>ตัวอย่างเควสของคุณ</Text>
                    <Text style={styles.previewQuestTitle}>{formData.title || '[ชื่อเควส]'}</Text>
                    <Text style={styles.previewDescription}>{formData.description || '[คำอธิบาย]'}</Text>

                    <View style={styles.previewStats}>
                        <View style={styles.statItem}>
                            <Icon name="people" size={16} color="#4a6baf" />
                            <Text style={styles.statText}>เป้าหมาย: {formData.target} คน</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="emoji-events" size={16} color="#28a745" />
                            <Text style={styles.statText}>ให้ผู้เข้าร่วม: {formData.rewardPoints} คะแนน/คน</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Icon name="trending-up" size={16} color="#FF6B35" />
                            <Text style={styles.statText}>คุณจะได้: {formData.creatorReward} คะแนน/คน</Text>
                        </View>
                    </View>

                    <Text style={styles.engagementTotal}>
                        🎯 ศักยภาพ Engagement สูงสุด: {calculateTotalEngagement()} คะแนน
                    </Text>
                </View>

                {/* Basic Info Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 ข้อมูลเควส</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ชื่อเควส *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="เช่น: ชวนติดตามเพจร้านอาหารไทย"
                            value={formData.title}
                            onChangeText={(text) => setFormData({ ...formData, title: text })}
                            maxLength={60}
                        />
                        <Text style={styles.charCount}>{formData.title.length}/60</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>คำอธิบาย *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="อธิบายรายละเอียด เควสนี้เกี่ยวกับอะไร? ทำไมถึงน่าสนใจ?"
                            multiline
                            numberOfLines={4}
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            maxLength={500}
                        />
                        <Text style={styles.charCount}>{formData.description.length}/500</Text>
                    </View>
                </View>

                {/* Quest Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎯 ประเภทเควส</Text>
                    <Text style={styles.sectionSubtitle}>เลือกประเภทเควสที่คุณต้องการสร้าง</Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                        {availableQuestTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeCard,
                                    formData.type === type.id && styles.typeCardActive
                                ]}
                                onPress={() => updateRewardPoints(type.id)}
                            >
                                <Icon
                                    name={type.icon}
                                    size={28}
                                    color={formData.type === type.id ? 'white' : '#4a6baf'}
                                />
                                <Text style={[
                                    styles.typeCardTitle,
                                    formData.type === type.id && styles.typeCardTitleActive
                                ]}>
                                    {type.label}
                                </Text>
                                <Text style={styles.typeCardDesc}>{type.description}</Text>
                                <Text style={styles.typeCardLimit}>สูงสุด {type.maxTarget} คน</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Target Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 กำหนดเป้าหมาย</Text>

                    <View style={styles.targetContainer}>
                        <Text style={styles.targetLabel}>ต้องการให้มีผู้เข้าร่วมกี่คน?</Text>
                        <View style={styles.targetControl}>
                            <TouchableOpacity
                                style={styles.targetButton}
                                onPress={() => setFormData({
                                    ...formData,
                                    target: Math.max(1, formData.target - 1)
                                })}
                            >
                                <Icon name="remove" size={20} color="#666" />
                            </TouchableOpacity>
                            <View style={styles.targetDisplay}>
                                <Text style={styles.targetNumber}>{formData.target}</Text>
                                <Text style={styles.targetUnit}>คน</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.targetButton}
                                onPress={() => setFormData({
                                    ...formData,
                                    target: Math.min(selectedQuestType.maxTarget, formData.target + 1)
                                })}
                            >
                                <Icon name="add" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.targetHint}>สูงสุด {selectedQuestType.maxTarget} คน</Text>
                    </View>

                    <View style={styles.rewardContainer}>
                        <View style={styles.rewardItem}>
                            <Text style={styles.rewardLabel}>คะแนนที่ให้ผู้เข้าร่วม</Text>
                            <View style={styles.rewardInputContainer}>
                                <TextInput
                                    style={styles.rewardInput}
                                    value={formData.rewardPoints.toString()}
                                    onChangeText={(text) => setFormData({
                                        ...formData,
                                        rewardPoints: parseInt(text) || 0
                                    })}
                                    keyboardType="numeric"
                                />
                                <Text style={styles.rewardUnit}>คะแนน/คน</Text>
                            </View>
                        </View>

                        <View style={styles.rewardItem}>
                            <Text style={styles.rewardLabel}>คะแนนที่คุณจะได้ (25%)</Text>
                            <View style={[styles.rewardInputContainer, { backgroundColor: '#E8F5E9' }]}>
                                <Text style={[styles.rewardInput, { color: '#28a745' }]}>
                                    {formData.creatorReward}
                                </Text>
                                <Text style={styles.rewardUnit}>คะแนน/คน</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Advanced Settings */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⚙️ การตั้งค่าขั้นสูง</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>ตั้งค่าเป็นสาธารณะ</Text>
                            <Text style={styles.settingDescription}>แสดงในหน้า Landing Page</Text>
                        </View>
                        <Switch
                            value={formData.isPublic}
                            onValueChange={(value) => setFormData({ ...formData, isPublic: value })}
                            trackColor={{ false: '#ddd', true: '#4a6baf' }}
                        />
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>ต้องการการยืนยัน</Text>
                            <Text style={styles.settingDescription}>ผู้เข้าร่วมต้องส่งหลักฐาน</Text>
                        </View>
                        <Switch
                            value={formData.requireVerification}
                            onValueChange={(value) => setFormData({ ...formData, requireVerification: value })}
                            trackColor={{ false: '#ddd', true: '#4a6baf' }}
                        />
                    </View>

                    <View style={styles.advancedInput}>
                        <Text style={styles.advancedLabel}>จำนวนผู้เข้าร่วมสูงสุด</Text>
                        <TextInput
                            style={styles.advancedInputField}
                            value={formData.maxParticipants.toString()}
                            onChangeText={(text) => setFormData({
                                ...formData,
                                maxParticipants: parseInt(text) || 1
                            })}
                            keyboardType="numeric"
                            placeholder="100"
                        />
                    </View>

                    <View style={styles.advancedInput}>
                        <Text style={styles.advancedLabel}>ระยะเวลา (วัน)</Text>
                        <TextInput
                            style={styles.advancedInputField}
                            value={formData.durationDays.toString()}
                            onChangeText={(text) => setFormData({
                                ...formData,
                                durationDays: parseInt(text) || 1
                            })}
                            keyboardType="numeric"
                            placeholder="7"
                        />
                    </View>
                </View>

                {/* Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>สรุป</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>ผู้เข้าร่วมที่ต้องการ:</Text>
                        <Text style={styles.summaryValue}>{formData.target} คน</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>คะแนนที่ต้องจ่าย:</Text>
                        <Text style={styles.summaryValue}>{formData.target * formData.rewardPoints} คะแนน</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>ศักยภาพ Engagement:</Text>
                        <Text style={[styles.summaryValue, { color: '#FF6B35' }]}>
                            {calculateTotalEngagement()} คะแนน
                        </Text>
                    </View>
                    <Text style={styles.summaryNote}>
                        📌 หมายเหตุ: คะแนน Engagement จะได้รับเมื่อมีผู้เข้าร่วมทำเควสสำเร็จ
                    </Text>
                </View>

                {/* Create Button */}
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={handleCreateQuest}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Icon name="add-task" size={24} color="white" />
                            <Text style={styles.createButtonText}>สร้างเควสสังคม</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.footerSpace} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#4a6baf',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    previewCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    previewTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    previewQuestTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    previewDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 16,
    },
    previewStats: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statText: {
        fontSize: 13,
        color: '#333',
        marginLeft: 8,
    },
    engagementTotal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6B35',
        textAlign: 'center',
        padding: 8,
        backgroundColor: '#FFF3E0',
        borderRadius: 8,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#666',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
    typeScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    typeCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        width: 140,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeCardActive: {
        backgroundColor: '#4a6baf',
        borderColor: '#4a6baf',
    },
    typeCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        textAlign: 'center',
    },
    typeCardTitleActive: {
        color: 'white',
    },
    typeCardDesc: {
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 14,
    },
    typeCardLimit: {
        fontSize: 10,
        color: '#999',
        marginTop: 8,
    },
    targetContainer: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        marginBottom: 16,
    },
    targetLabel: {
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
    },
    targetControl: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    targetButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    targetDisplay: {
        alignItems: 'center',
        marginHorizontal: 20,
    },
    targetNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4a6baf',
    },
    targetUnit: {
        fontSize: 14,
        color: '#666',
    },
    targetHint: {
        fontSize: 12,
        color: '#999',
    },
    rewardContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rewardItem: {
        flex: 1,
        marginHorizontal: 4,
    },
    rewardLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 8,
    },
    rewardInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    rewardInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        paddingVertical: 10,
    },
    rewardUnit: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingTextContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 14,
        color: '#333',
    },
    settingDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    advancedInput: {
        marginTop: 16,
    },
    advancedLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
    },
    advancedInputField: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    summaryCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#E8F4FD',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    summaryNote: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginTop: 8,
        lineHeight: 16,
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4a6baf',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 20,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footerSpace: {
        height: 40,
    },
});

export default CreateSocialQuestScreen;