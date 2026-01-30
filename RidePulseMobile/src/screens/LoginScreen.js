import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Image, ImageBackground } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const LoginScreen = () => {
    const { login, register, loginWithPhone } = useContext(AuthContext); // Added register, loginWithPhone
    const { colorScheme, toggleTheme } = useContext(ThemeContext);
    const [isLogin, setIsLogin] = useState(true);
    const [loginMethod, setLoginMethod] = useState('EMAIL'); // 'EMAIL' or 'PHONE'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationId, setVerificationId] = useState(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const recaptchaVerifier = React.useRef(null); // Ref for Recaptcha functionality if needed

    const handleSubmit = async () => {
        // Validation
        if (loginMethod === 'EMAIL') {
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
        } else {
            if (!phoneNumber && !verificationId) {
                alert('Please enter a phone number');
                return;
            }
            if (verificationId && !verificationCode) {
                alert('Please enter the verification code');
                return;
            }
        }

        setLoading(true);
        let result;

        try {
            if (loginMethod === 'EMAIL') {
                if (isLogin) {
                    result = await login(email, password);
                } else {
                    result = await register(email, password);
                }
            } else {
                // PHONE LOGIC
                if (!verificationId) {
                    // Step 1: Send Code
                    // NOTE: You need a RecaptchaVerifier for Web/JS SDK. 
                    // Pass recaptchaVerifier.current here if you have set it up.
                    // For now, we pass null, which might fail on some platforms without native integration.
                    result = await loginWithPhone(phoneNumber, recaptchaVerifier.current);

                    if (result.success) {
                        setVerificationId(result.result); // Store the confirmationResult object
                        alert('Verification code sent!');
                        setLoading(false);
                        return; // Stop here, wait for code
                    }
                } else {
                    // Step 2: Verify Code
                    try {
                        await verificationId.confirm(verificationCode);
                        result = { success: true };
                    } catch (err) {
                        result = { success: false, error: err.message };
                    }
                }
            }

            if (!result.success) {
                // Better error parsing
                if (result.error && result.error.includes('auth/network-request-failed')) {
                    alert('Connection Failed. Please check your internet or emulator network settings.');
                } else if (result.error && result.error.includes('auth/invalid-email')) {
                    alert('Invalid Email Address.');
                } else if (result.error && result.error.includes('auth/weak-password')) {
                    alert('Password should be at least 6 characters.');
                } else {
                    alert(result.error || "Authentication failed");
                }
            }
        } catch (error) {
            console.error(error);
            alert('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0F111A" />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* Theme Toggle */}
                    <View style={styles.themeToggle}>
                        <TouchableOpacity
                            onPress={toggleTheme}
                            style={styles.iconButton}
                        >
                            <MaterialIcons name={colorScheme === 'dark' ? "light-mode" : "dark-mode"} size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Header Section */}
                    <View style={styles.header}>
                        {/* Static Shield Logo using Map Background */}
                        <ImageBackground
                            source={require('../../assets/dark-map-bg.png')}
                            style={styles.mapBackground}
                            imageStyle={{ opacity: 0.6, borderRadius: 20 }}
                        >
                            <View style={styles.animationGroup}>
                                <Image
                                    source={require('../../assets/ride-pulse-logo-shield.png')}
                                    style={styles.leader}
                                    resizeMode="contain"
                                />
                            </View>
                        </ImageBackground>

                        <Text style={styles.title}>RIDEPULSE</Text>
                        <Text style={styles.subtitle}>Join the pack. Ride together.</Text>
                    </View>

                    {/* Card Container */}
                    <View style={styles.card}>

                        {/* Tabs */}
                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                onPress={() => setIsLogin(true)}
                                style={[styles.tab, isLogin && styles.activeTab]}
                            >
                                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Log In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIsLogin(false)}
                                style={[styles.tab, !isLogin && styles.activeTab]}
                            >
                                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Method Toggle */}
                        <TouchableOpacity
                            style={styles.methodToggle}
                            onPress={() => {
                                setLoginMethod(loginMethod === 'EMAIL' ? 'PHONE' : 'EMAIL');
                                setVerificationId(null);
                                setVerificationCode('');
                            }}
                        >
                            <Text style={styles.methodToggleText}>
                                {loginMethod === 'EMAIL' ? 'Use Phone Number instead' : 'Use Email & Password instead'}
                            </Text>
                        </TouchableOpacity>

                        {/* Form Fields */}
                        <View style={styles.form}>

                            {loginMethod === 'EMAIL' ? (
                                <>
                                    {/* Email Input */}
                                    <View style={styles.inputContainer}>
                                        <MaterialIcons name="email" size={24} color="#9CA3AF" />
                                        <TextInput
                                            placeholder="Email Address"
                                            placeholderTextColor="#6B7280"
                                            style={styles.input}
                                            value={email}
                                            onChangeText={setEmail}
                                            autoCapitalize="none"
                                            keyboardType="email-address"
                                        />
                                    </View>

                                    {/* Password Input */}
                                    <View style={styles.inputContainer}>
                                        <MaterialIcons name="lock" size={24} color="#9CA3AF" />
                                        <TextInput
                                            placeholder="Password"
                                            placeholderTextColor="#6B7280"
                                            style={styles.input}
                                            secureTextEntry={!showPassword}
                                            value={password}
                                            onChangeText={setPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>
                                    {/* Forgot Password */}
                                    <TouchableOpacity style={styles.forgotPassword}>
                                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    {/* Phone Input */}
                                    <View style={styles.inputContainer}>
                                        <MaterialIcons name="phone" size={24} color="#9CA3AF" />
                                        <TextInput
                                            placeholder="Phone (+91 9876543210)"
                                            placeholderTextColor="#6B7280"
                                            style={styles.input}
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            keyboardType="phone-pad"
                                            editable={!verificationId}
                                        />
                                    </View>

                                    {verificationId && (
                                        <View style={styles.inputContainer}>
                                            <MaterialIcons name="lock-clock" size={24} color="#9CA3AF" />
                                            <TextInput
                                                placeholder="Verification Code"
                                                placeholderTextColor="#6B7280"
                                                style={styles.input}
                                                value={verificationCode}
                                                onChangeText={setVerificationCode}
                                                keyboardType="number-pad"
                                            />
                                        </View>
                                    )}
                                </>
                            )}


                            {/* Action Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                style={[styles.actionButton, loading && { opacity: 0.7 }]}
                                disabled={loading}
                            >
                                <Text style={styles.actionButtonText}>
                                    {loading ? 'Please wait...' : (
                                        loginMethod === 'EMAIL'
                                            ? (isLogin ? 'LOG IN' : 'SIGN UP')
                                            : (!verificationId ? 'SEND CODE' : 'VERIFY')
                                    )}
                                </Text>
                                {!loading && <MaterialIcons name="arrow-forward" size={20} color="black" />}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            By continuing, you agree to RidePulse's <Text style={styles.linkText}>Terms</Text> & <Text style={styles.linkText}>Privacy Policy</Text>.
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingTop: 40,
    },
    themeToggle: {
        position: 'absolute',
        top: 20,
        right: 0,
        zIndex: 10,
    },
    iconButton: {
        backgroundColor: '#1F2433',
        padding: 8,
        borderRadius: 50,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        width: '100%',
    },
    // Login Screen Animation Styles
    mapBackground: {
        width: '100%',
        height: 280, // Taller to show path
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
    },
    routeLine: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: 0.7,
        zIndex: 1, // Behind bikes
        transform: [{ scale: 1.5 }] // Make route distinctive
    },
    animationGroup: {
        marginTop: 10,
        width: 300,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    leader: {
        width: 250, // Larger size for single bike
        height: 250,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFD700',
        letterSpacing: 2,
    },
    subtitle: {
        color: '#9CA3AF',
        marginTop: 8,
        fontSize: 14,
    },
    card: {
        backgroundColor: '#161925',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#1F2937',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#1F2433',
        borderRadius: 8,
        padding: 4,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#374151',
    },
    tabText: {
        fontWeight: '600',
        color: '#9CA3AF',
    },
    activeTabText: {
        color: '#FFFFFF',
    },
    methodToggle: {
        marginBottom: 20,
        alignItems: 'center',
    },
    methodToggleText: {
        color: '#FFD700',
        textDecorationLine: 'underline',
        fontWeight: '600',
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2433',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        color: '#FFFFFF',
        fontSize: 16,
    },
    forgotPassword: {
        alignItems: 'flex-end',
        marginTop: 4,
    },
    forgotPasswordText: {
        color: '#FFD700',
        fontWeight: '600',
        fontSize: 12,
    },
    actionButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        // Shadow
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    actionButtonText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
        marginRight: 8,
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    footerText: {
        color: '#6B7280',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 20,
    },
    linkText: {
        textDecorationLine: 'underline',
        color: '#9CA3AF',
    },
});

export default LoginScreen;
