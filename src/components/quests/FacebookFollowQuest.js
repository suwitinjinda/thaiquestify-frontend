// src/components/quests/FacebookFollowQuest.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FacebookService } from '../../services/facebookService';
import api from '../../services/api';

const FacebookFollowQuest = ({ quest, onQuestComplete, userId }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [verificationStep, setVerificationStep] = useState('idle'); // idle, authenticating, verifying, completed

  const { 
    targetPageId, 
    targetPageName, 
    targetPageUrl,
    rewardAmount,
    rewardPoints 
  } = quest.verificationData;

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setVerificationStep('authenticating');

      // Step 1: Login to Facebook
      const facebookData = await FacebookService.loginWithFacebook();
      setVerificationStep('verifying');

      // Step 2: Check if user follows the target page
      const isFollowing = await FacebookService.checkPageLikeStatus(
        facebookData.accessToken, 
        targetPageId
      );

      if (isFollowing) {
        // Step 3: Mark quest as completed
        await completeQuest(facebookData.accessToken);
      } else {
        Alert.alert(
          'ยังไม่ได้กดไลค์เพจ',
          `กรุณากดไลค์เพจ ${targetPageName} ก่อน แล้วลองใหม่อีกครั้ง`,
          [
            { 
              text: 'เปิดเพจใน Facebook', 
              onPress: () => Linking.openURL(targetPageUrl || `https://facebook.com/${targetPageId}`) 
            },
            { text: 'ปิด', style: 'cancel' }
          ]
        );
      }

    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถตรวจสอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsVerifying(false);
      setVerificationStep('idle');
    }
  };

  const completeQuest = async (accessToken) => {
    try {
      // Call your API to mark quest as completed
      const response = await api.post(`/quests/${quest._id}/complete`, {
        userId: userId,
        verificationData: {
          facebookAccessToken: accessToken,
          verifiedAt: new Date().toISOString(),
          targetPageId: targetPageId
        }
      });

      if (response.data.success) {
        setIsCompleted(true);
        Alert.alert('สำเร็จ!', `คุณได้รับ ${rewardAmount} บาท และ ${rewardPoints} คะแนน`);
        onQuestComplete?.(response.data.data);
      }
    } catch (error) {
      console.error('Complete quest error:', error);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกผลได้ในขณะนี้');
    }
  };

  const getVerificationText = () => {
    switch (verificationStep) {
      case 'authenticating':
        return 'กำลังเชื่อมต่อ Facebook...';
      case 'verifying':
        return 'กำลังตรวจสอบการกดไลค์เพจ...';
      default:
        return 'กดปุ่มด้านล่างเพื่อตรวจสอบ';
    }
  };

  if (isCompleted) {
    return (
      <View style={[styles.container, styles.completedContainer]}>
        <Icon name="check-circle" size={40} color="#28a745" />
        <Text style={styles.completedText}>ทำเควสนี้สำเร็จแล้ว!</Text>
        <Text style={styles.rewardText}>
          คุณได้รับ {rewardAmount} บาท และ {rewardPoints} คะแนน
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.questInfo}>
        <Text style={styles.title}>กดไลค์และติดตามเพจ Facebook</Text>
        <Text style={styles.pageName}>เพจ: {targetPageName}</Text>
        
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>ขั้นตอน:</Text>
          <Text style={styles.instruction}>1. กดไลค์เพจ {targetPageName}</Text>
          <Text style={styles.instruction}>2. กดปุ่ม "ตรวจสอบตอนนี้" ด้านล่าง</Text>
          <Text style={styles.instruction}>3. ระบบจะตรวจสอบการกดไลค์อัตโนมัติ</Text>
        </View>

        <TouchableOpacity 
          style={styles.facebookButton}
          onPress={() => Linking.openURL(targetPageUrl || `https://facebook.com/${targetPageId}`)}
        >
          <Icon name="facebook" size={20} color="white" />
          <Text style={styles.facebookButtonText}>เปิดเพจใน Facebook</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.verificationSection}>
        <Text style={styles.verificationText}>{getVerificationText()}</Text>
        
        <TouchableOpacity 
          style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon name="verified" size={20} color="white" />
              <Text style={styles.verifyButtonText}>ตรวจสอบตอนนี้</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.rewardSection}>
        <Text style={styles.rewardTitle}>รางวัลเมื่อทำสำเร็จ:</Text>
        <View style={styles.rewardRow}>
          <View style={styles.rewardItem}>
            <Icon name="attach-money" size={16} color="#28a745" />
            <Text style={styles.rewardAmount}>{rewardAmount} บาท</Text>
          </View>
          <View style={styles.rewardItem}>
            <Icon name="star" size={16} color="#ffc107" />
            <Text style={styles.rewardPoints}>{rewardPoints} คะแนน</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  completedContainer: {
    alignItems: 'center',
    backgroundColor: '#f8fff9',
    borderColor: '#28a745',
    borderWidth: 1,
  },
  questInfo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pageName: {
    fontSize: 16,
    color: '#4a6baf',
    fontWeight: '500',
    marginBottom: 12,
  },
  instructions: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
  },
  instruction: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877f2',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  facebookButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  verificationSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
    alignItems: 'center',
  },
  verificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    minWidth: 160,
  },
  verifyButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rewardSection: {
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 16,
    marginTop: 16,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardAmount: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
  rewardPoints: {
    fontSize: 14,
    color: '#ffc107',
    fontWeight: '500',
  },
  completedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 8,
    marginBottom: 4,
  },
  rewardText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default FacebookFollowQuest;