// src/components/QuestVerification.js - UPDATED VERSION
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { MaterialIcons as Icon } from '@expo/vector-icons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { LoginManager, AccessToken, GraphRequest, GraphRequestManager } from 'react-native-fbsdk-next';

const QuestVerification = ({ quest, onVerificationComplete, onCancel, userId }) => {
  const [evidence, setEvidence] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [facebookData, setFacebookData] = useState(null);

  // Check if this is a Facebook verification quest
  const isFacebookVerification = quest.verificationMethod === 'facebook_api' ||
    quest.type === 'facebook_follow';

  // Get Facebook page data from quest
  const getFacebookPageData = () => {
    // Try different ways to get Facebook data from the quest
    return {
      pageId: quest.facebookPageId || quest.requiredData?.facebookPageId || quest.templateConfig?.facebookPageId,
      pageName: quest.facebookPageName || quest.requiredData?.facebookPageName || quest.templateConfig?.facebookPageName,
      pageUrl: quest.facebookPageUrl || quest.requiredData?.facebookPageUrl || quest.templateConfig?.facebookPageUrl
    };
  };

  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        Alert.alert('Error', 'ไม่สามารถเปิดกล้องได้');
      } else {
        setEvidence(response.assets[0]);
        setStep(2);
      }
    });
  };

  const chooseFromLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        Alert.alert('Error', 'ไม่สามารถเลือกรูปภาพได้');
      } else {
        setEvidence(response.assets[0]);
        setStep(2);
      }
    });
  };

  // FACEBOOK API VERIFICATION FUNCTIONS
  const loginWithFacebook = async () => {
    try {
      setLoading(true);
      console.log('🔗 Starting Facebook login...');

      // Logout first to clear any existing sessions
      await LoginManager.logOut();

      // Login with Facebook permissions
      const result = await LoginManager.logInWithPermissions(['public_profile', 'pages_show_list']);

      if (result.isCancelled) {
        console.log('Facebook login cancelled by user');
        Alert.alert('ยกเลิก', 'คุณยกเลิกการเชื่อมต่อกับ Facebook');
        return null;
      }

      if (result.declinedPermissions && result.declinedPermissions.includes('pages_show_list')) {
        Alert.alert('สิทธิ์ไม่ครบ', 'กรุณาอนุญาตสิทธิ์การเข้าถึงเพจ Facebook ของคุณ');
        return null;
      }

      // Get access token
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw new Error('ไม่สามารถดึงข้อมูล Facebook access token ได้');
      }

      console.log('✅ Facebook login successful');
      return data.accessToken;

    } catch (error) {
      console.error('Facebook login error:', error);
      Alert.alert('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อ Facebook ได้: ' + error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkPageLikeStatus = async (accessToken, pageId) => {
    return new Promise((resolve, reject) => {
      console.log(`🔍 Checking like status for page ${pageId}`);

      const request = new GraphRequest(
        `/me/likes/${pageId}`,
        {
          accessToken: accessToken,
          httpMethod: 'GET',
        },
        (error, result) => {
          if (error) {
            console.error('Facebook API error:', error);
            reject(error);
          } else {
            // If result has data, user likes the page
            const isFollowing = !!result.data && result.data.length > 0;
            console.log(`Page like status: ${isFollowing ? 'LIKED' : 'NOT LIKED'}`);
            resolve(isFollowing);
          }
        }
      );

      new GraphRequestManager().addRequest(request).start();
    });
  };

  const getUserFacebookProfile = async (accessToken) => {
    return new Promise((resolve, reject) => {
      const request = new GraphRequest(
        '/me',
        {
          accessToken: accessToken,
          parameters: {
            fields: {
              string: 'id,name,email,picture{url}'
            }
          }
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      new GraphRequestManager().addRequest(request).start();
    });
  };

  const handleFacebookVerification = async () => {
    try {
      setLoading(true);

      const facebookPage = getFacebookPageData();

      if (!facebookPage.pageId) {
        Alert.alert('ข้อผิดพลาด', 'ไม่พบข้อมูลเพจ Facebook สำหรับเควสนี้');
        return;
      }

      console.log(`🔍 Verifying Facebook page follow: ${facebookPage.pageName}`);

      // Step 1: Login with Facebook
      Alert.alert(
        'เชื่อมต่อกับ Facebook',
        'ระบบจะเปิด Facebook เพื่อตรวจสอบว่าคุณกดไลค์เพจแล้วหรือไม่',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ดำเนินการต่อ',
            onPress: async () => {
              try {
                const accessToken = await loginWithFacebook();

                if (!accessToken) {
                  return;
                }

                // Step 2: Get user profile
                const userProfile = await getUserFacebookProfile(accessToken);
                console.log('User Facebook profile:', userProfile);

                // Step 3: Check if user follows the page
                const isFollowing = await checkPageLikeStatus(accessToken, facebookPage.pageId);

                if (isFollowing) {
                  // Success! User follows the page
                  setFacebookData({
                    accessToken,
                    userId: userProfile.id,
                    userName: userProfile.name,
                    verifiedAt: new Date().toISOString()
                  });

                  Alert.alert(
                    'สำเร็จ! 🎉',
                    `ยืนยันแล้วว่าคุณกดไลค์เพจ ${facebookPage.pageName} แล้ว`,
                    [
                      {
                        text: 'ยืนยันการตรวจสอบ',
                        onPress: () => completeFacebookVerification({
                          facebookAccessToken: accessToken,
                          facebookUserId: userProfile.id,
                          facebookUserName: userProfile.name,
                          verifiedAt: new Date().toISOString(),
                          targetPageId: facebookPage.pageId,
                          targetPageName: facebookPage.pageName
                        })
                      }
                    ]
                  );
                } else {
                  // User doesn't follow the page
                  Alert.alert(
                    'ยังไม่ได้กดไลค์เพจ',
                    `เราไม่พบว่าคุณได้กดไลค์เพจ "${facebookPage.pageName}"\n\nกรุณากดไลค์เพจก่อน แล้วลองใหม่อีกครั้ง`,
                    [
                      {
                        text: 'เปิดเพจใน Facebook',
                        onPress: () => {
                          const fbUrl = facebookPage.pageUrl || `https://facebook.com/${facebookPage.pageId}`;
                          Linking.openURL(fbUrl).catch(() => {
                            Alert.alert('ไม่สามารถเปิด Facebook ได้', 'กรุณาติดตั้งแอป Facebook');
                          });
                        }
                      },
                      { text: 'ลองอีกครั้ง', onPress: handleFacebookVerification },
                      { text: 'ยกเลิก', style: 'cancel' }
                    ]
                  );
                }
              } catch (error) {
                console.error('Verification error:', error);
                Alert.alert('ข้อผิดพลาด', 'ไม่สามารถตรวจสอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('Facebook verification error:', error);
      Alert.alert('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการตรวจสอบ');
      setLoading(false);
    }
  };

  const completeFacebookVerification = (verificationData) => {
    const finalVerificationData = {
      type: 'facebook_api',
      facebookData: verificationData,
      timestamp: new Date().toISOString(),
      status: 'verified'
    };

    onVerificationComplete(finalVerificationData);
  };

  const submitEvidence = () => {
    if (evidence) {
      const verificationData = {
        type: quest.verificationMethod || quest.verificationType,
        evidence: evidence,
        timestamp: new Date().toISOString(),
        location: null,
      };

      onVerificationComplete(verificationData);
    }
  };

  // FACEBOOK VERIFICATION UI
  const renderFacebookVerification = () => (
    <View style={styles.verificationContainer}>
      <Icon name="facebook" size={60} color="#1877f2" />
      <Text style={styles.verificationTitle}>ตรวจสอบการกดไลค์เพจ Facebook</Text>

      <View style={styles.facebookPageInfo}>
        <Icon name="thumb-up" size={24} color="#1877f2" />
        <View style={styles.pageInfo}>
          <Text style={styles.pageName}>
            {getFacebookPageData().pageName || 'เพจ Facebook'}
          </Text>
          <Text style={styles.pageUrl}>
            {getFacebookPageData().pageUrl || 'กำลังโหลด...'}
          </Text>
        </View>
      </View>

      <Text style={styles.verificationDescription}>
        ระบบจะตรวจสอบอัตโนมัติว่าคุณได้กดไลค์เพจ Facebook นี้แล้วหรือไม่
      </Text>

      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>ขั้นตอนการตรวจสอบ:</Text>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>1</Text>
          <Text style={styles.stepText}>เชื่อมต่อบัญชี Facebook ของคุณ</Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>2</Text>
          <Text style={styles.stepText}>ระบบตรวจสอบอัตโนมัติ</Text>
        </View>
        <View style={styles.instructionStep}>
          <Text style={styles.stepNumber}>3</Text>
          <Text style={styles.stepText}>รับรางวัลทันทีหลังตรวจสอบสำเร็จ</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.facebookButton}
        onPress={handleFacebookVerification}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Icon name="facebook" size={24} color="white" />
            <Text style={styles.facebookButtonText}>
              ตรวจสอบตอนนี้
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.manualOption}
        onPress={() => setStep(1)}
      >
        <Text style={styles.manualOptionText}>
          หรือส่งหลักฐานด้วยตนเอง
        </Text>
      </TouchableOpacity>

      <View style={styles.privacyNotice}>
        <Icon name="security" size={16} color="#666" />
        <Text style={styles.privacyText}>
          เราจะใช้ข้อมูลเฉพาะเพื่อการตรวจสอบเท่านั้น
        </Text>
      </View>
    </View>
  );

  // PHOTO VERIFICATION UI
  const renderPhotoVerification = () => (
    <View style={styles.verificationContainer}>
      <Icon name="camera-alt" size={50} color="#4a6baf" />
      <Text style={styles.verificationTitle}>ส่งรูปภาพ作为证据</Text>
      <Text style={styles.verificationDescription}>
        {quest.instructions || quest.photoInstructions || 'กรุณาถ่ายภาพตามที่กำหนดในคำอธิบายเควส'}
      </Text>

      <View style={styles.photoButtons}>
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
          <Icon name="photo-camera" size={24} color="#4a6baf" />
          <Text style={styles.photoButtonText}>ถ่ายภาพใหม่</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.photoButton} onPress={chooseFromLibrary}>
          <Icon name="photo-library" size={24} color="#4a6baf" />
          <Text style={styles.photoButtonText}>เลือกรูปจากแกลเลอรี</Text>
        </TouchableOpacity>

        {isFacebookVerification && (
          <TouchableOpacity
            style={[styles.photoButton, styles.facebookOptionButton]}
            onPress={() => setStep(3)}
          >
            <Icon name="facebook" size={24} color="#1877f2" />
            <Text style={styles.facebookOptionText}>ตรวจสอบด้วย Facebook API</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // EVIDENCE PREVIEW UI
  const renderEvidencePreview = () => (
    <View style={styles.verificationContainer}>
      <Text style={styles.verificationTitle}>ตรวจสอบหลักฐาน</Text>

      <Image
        source={{ uri: evidence.uri }}
        style={styles.evidenceImage}
      />

      <View style={styles.evidenceActions}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => setStep(1)}
        >
          <Text style={styles.retakeButtonText}>ถ่ายใหม่</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitEvidence}
        >
          <Text style={styles.submitButtonText}>ส่งหลักฐาน</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step === 1 && styles.stepDotActive]}>
          <Text style={styles.stepNumber}>1</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step === 2 && styles.stepDotActive]}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        {isFacebookVerification && (
          <>
            <View style={styles.stepLine} />
            <View style={[styles.stepDot, step === 3 && styles.stepDotActive]}>
              <Icon name="facebook" size={12} color="white" />
            </View>
          </>
        )}
      </View>

      {/* Step Labels */}
      <View style={styles.stepLabels}>
        <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>
          วิธีการ
        </Text>
        <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>
          หลักฐาน
        </Text>
        {isFacebookVerification && (
          <Text style={[styles.stepLabel, step === 3 && styles.stepLabelActive]}>
            Facebook
          </Text>
        )}
      </View>

      {/* Content based on step */}
      {step === 1 && renderPhotoVerification()}
      {step === 2 && renderEvidencePreview()}
      {step === 3 && renderFacebookVerification()}

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
      >
        <Text style={styles.cancelButtonText}>ยกเลิก</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  verificationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  verificationDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#4a6baf',
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#ddd',
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
  },
  stepLabelActive: {
    color: '#4a6baf',
    fontWeight: 'bold',
  },
  // Photo Verification
  photoButtons: {
    gap: 12,
    width: '100%',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  photoButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  facebookOptionButton: {
    borderColor: '#1877f2',
    backgroundColor: '#f0f8ff',
  },
  facebookOptionText: {
    fontSize: 16,
    color: '#1877f2',
    fontWeight: '500',
  },
  // Evidence Preview
  evidenceImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  evidenceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retakeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#4a6baf',
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Facebook Verification
  facebookPageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  pageInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pageName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1877f2',
  },
  pageUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  instructionsBox: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  instructionStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4a6baf',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: 'bold',
    marginRight: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  facebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877f2',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    gap: 12,
  },
  facebookButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  manualOption: {
    marginTop: 16,
    padding: 12,
  },
  manualOptionText: {
    color: '#4a6baf',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    gap: 8,
  },
  privacyText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  // Cancel Button
  cancelButton: {
    marginTop: 20,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default QuestVerification;