// screens/CustomerRegisterScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons as Icon } from '@expo/vector-icons';

const CustomerRegisterScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        const { name, email, phone, password, confirmPassword } = formData;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน');
            return;
        }

        if (password.length < 6) {
            Alert.alert('แจ้งเตือน', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }

        setLoading(true);

        try {
            // Call your backend API
            const response = await fetch('http://10.128.0.3:8081/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password,
                    userType: 'customer' // Always customer for registration
                }),
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    'สำเร็จ',
                    'ลงทะเบียนสำเร็จ! คุณสามารถเข้าสู่ระบบได้ทันที',
                    [{ text: 'ตกลง', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('ข้อผิดพลาด', data.message || 'ลงทะเบียนไม่สำเร็จ');
            }

        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('ข้อผิดพลาด', 'ไม่สามารถลงทะเบียนได้ในขณะนี้');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back" size={24} color="#4a6baf" />
                    </TouchableOpacity>

                    <Text style={styles.title}>สมัครสมาชิกลูกค้า</Text>
                    <Text style={styles.subtitle}>กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</Text>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    {/* Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ชื่อ-นามสกุล</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="person" size={20} color="#4a6baf" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="ชื่อของคุณ"
                                value={formData.name}
                                onChangeText={(text) => updateFormData('name', text)}
                            />
                        </View>
                    </View>

                    {/* Email */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>อีเมล</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="email" size={20} color="#4a6baf" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="อีเมลของคุณ"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={formData.email}
                                onChangeText={(text) => updateFormData('email', text)}
                            />
                        </View>
                    </View>

                    {/* Phone (Optional) */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>เบอร์โทรศัพท์ (ไม่บังคับ)</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="phone" size={20} color="#4a6baf" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="08X-XXX-XXXX"
                                keyboardType="phone-pad"
                                value={formData.phone}
                                onChangeText={(text) => updateFormData('phone', text)}
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>รหัสผ่าน</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="lock" size={20} color="#4a6baf" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
                                secureTextEntry
                                value={formData.password}
                                onChangeText={(text) => updateFormData('password', text)}
                            />
                        </View>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>ยืนยันรหัสผ่าน</Text>
                        <View style={styles.inputContainer}>
                            <Icon name="lock-outline" size={20} color="#4a6baf" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="กรอกรหัสผ่านอีกครั้ง"
                                secureTextEntry
                                value={formData.confirmPassword}
                                onChangeText={(text) => updateFormData('confirmPassword', text)}
                            />
                        </View>
                    </View>

                    {/* Register Button */}
                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#4a6baf', '#6b8cce']}
                            style={styles.registerGradient}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Icon name="person-add" size={20} color="#fff" />
                                    <Text style={styles.registerButtonText}>สมัครสมาชิก</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Terms */}
                    <View style={styles.termsContainer}>
                        <Text style={styles.termsText}>
                            การสมัครสมาชิกหมายความว่าคุณยอมรับ{' '}
                            <Text style={styles.termsLink}>เงื่อนไขการใช้งาน</Text> และ{' '}
                            <Text style={styles.termsLink}>นโยบายความเป็นส่วนตัว</Text>
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        marginBottom: 30,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
        textAlign: 'center',
        marginTop: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    formContainer: {
        marginTop: 10,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2c3e50',
        marginBottom: 8,
        marginLeft: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 15,
        height: 55,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    registerButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#4a6baf',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    registerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    termsContainer: {
        paddingHorizontal: 10,
    },
    termsText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
    termsLink: {
        color: '#4a6baf',
        textDecorationLine: 'underline',
    },
});

export default CustomerRegisterScreen;