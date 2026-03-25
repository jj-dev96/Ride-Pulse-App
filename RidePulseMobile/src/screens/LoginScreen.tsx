import React, { useState, useContext } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
    Platform, ScrollView, StatusBar, StyleSheet, Image, ImageBackground, Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// SSO removed as per request


type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = () => {
    const { login, register, loginAnonymously, resetPassword } = useContext(AuthContext);
    const { colorScheme } = useContext(ThemeContext);
    const [isLogin, setIsLogin] = useState<boolean>(true);

    // Form State
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);

    const handleAuthResult = (result: { success: boolean; error?: string }): void => {
        if (!result.success) {
            if (result.error?.includes('auth/network-request-failed')) {
                Alert.alert('Connection Error', 'Please check your internet connection.');
            } else if (result.error?.includes('auth/invalid-email')) {
                Alert.alert('Invalid Email', 'Please enter a valid email address.');
            } else if (result.error?.includes('auth/weak-password')) {
                Alert.alert('Weak Password', 'Password should be at least 6 characters.');
            } else if (result.error?.includes('auth/email-already-in-use')) {
                Alert.alert('Account Exists', 'An account with this email already exists. Try logging in instead.');
            } else if (result.error?.includes('auth/invalid-credential') || result.error?.includes('auth/wrong-password') || result.error?.includes('auth/user-not-found')) {
                Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
            } else if (result.error?.includes('auth/too-many-requests')) {
                Alert.alert('Too Many Attempts', 'Account temporarily locked due to too many failed attempts. Please try again later or reset your password.');
            } else {
                Alert.alert('Error', result.error || 'Authentication failed');
            }
        }
    };

    // Email format validation - More strict as requested
    const isValidEmail = (email: string): boolean => {
        // Robust regex for email validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) return false;

        // Additional checks for "real" email characteristics
        const [localPart, domainPart] = email.split('@');

        // Ensure local part isn't too short or just numbers (often used in fake patterns)
        if (localPart.length < 2) return false;

        // Ensure domain has at least one dot and a TLD of 2+ chars
        const domainParts = domainPart.split('.');
        if (domainParts.length < 2) return false;
        if (domainParts[domainParts.length - 1].length < 2) return false;

        return true;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!email || !password) {
            Alert.alert('Missing Info', 'Please fill in all fields');
            return;
        }
        if (!isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password should be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const result = isLogin
                ? await login(email, password)
                : await register(email, password);
            handleAuthResult(result);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleForgotPassword = async (): Promise<void> => {
        if (!email) {
            Alert.alert('Email Required', 'Please enter your email address to reset your password.');
            return;
        }
        if (!isValidEmail(email)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            const result = await resetPassword(email);
            if (result.success) {
                Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
            } else {
                if (result.error?.includes('auth/user-not-found')) {
                    Alert.alert('Not Found', 'No account found with this email.');
                } else {
                    Alert.alert('Error', result.error || 'Failed to send reset email.');
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An unexpected error occurred.');
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
                    {/* Header Section */}
                    <View style={styles.header}>
                        <ImageBackground
                            source={require('../../assets/darkmapbg.jpg')}
                            style={styles.mapBackground}
                            imageStyle={{ opacity: 0.6, borderRadius: 20 }}
                        >
                            <View style={styles.animationGroup}>
                                <Image
                                    source={require('../../assets/ridepulselogoshield.png')}
                                    style={styles.leader}
                                    resizeMode="cover"
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

                        {/* Form Fields */}
                        <View style={styles.form}>
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

                            {isLogin && (
                                <TouchableOpacity 
                                    style={styles.forgotPassword}
                                    onPress={handleForgotPassword}
                                    disabled={loading}
                                >
                                    <View style={styles.forgotPasswordContent}>
                                        <MaterialIcons name="help-outline" size={14} color="#FFD700" style={styles.forgotPasswordIcon} />
                                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* Action Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                style={[styles.actionButton, loading && { opacity: 0.7 }]}
                                disabled={loading}
                            >
                                <Text style={styles.actionButtonText}>
                                    {loading ? 'Please wait...' : (isLogin ? 'LOG IN' : 'SIGN UP')}
                                </Text>
                                {!loading && <MaterialIcons name="arrow-forward" size={20} color="black" />}
                            </TouchableOpacity>
                        </View>

                        {/* SSO Buttons Removed */}


                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            By continuing, you agree to RidePulse's <Text style={styles.linkText}>Terms</Text> &amp; <Text style={styles.linkText}>Privacy Policy</Text>.
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0F111A' },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 40, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 32, width: '100%' },
    mapBackground: { width: '100%', height: 280, justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
    animationGroup: { marginTop: 10, width: 200, height: 200, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
    leader: { width: 250, height: 250, borderRadius: 125, borderWidth: 4, borderColor: '#FFD700' },
    title: { fontSize: 30, fontWeight: '800', color: '#FFD700', letterSpacing: 2 },
    subtitle: { color: '#9CA3AF', marginTop: 8, fontSize: 14 },
    card: { backgroundColor: '#161925', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1F2937', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    tabContainer: { flexDirection: 'row', backgroundColor: '#1F2433', borderRadius: 8, padding: 4, marginBottom: 24 },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
    activeTab: { backgroundColor: '#374151' },
    tabText: { fontWeight: '600', color: '#9CA3AF' },
    activeTabText: { color: '#FFFFFF' },
    form: { gap: 16 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2433', borderWidth: 1, borderColor: '#374151', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    input: { flex: 1, marginLeft: 12, color: '#FFFFFF', fontSize: 16 },
    forgotPassword: { alignItems: 'flex-end', marginTop: 4 },
    forgotPasswordContent: { flexDirection: 'row', alignItems: 'center' },
    forgotPasswordIcon: { marginRight: 4 },
    forgotPasswordText: { color: '#FFD700', fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
    actionButton: { backgroundColor: '#FFD700', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
    actionButtonText: { color: '#000000', fontWeight: 'bold', fontSize: 18, letterSpacing: 1, marginRight: 8 },
    footer: { marginTop: 32, alignItems: 'center', paddingHorizontal: 16 },

    footerText: { color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 20 },
    linkText: { textDecorationLine: 'underline', color: '#9CA3AF' },

});

export default LoginScreen;
