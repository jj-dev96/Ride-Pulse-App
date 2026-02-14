import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Image, ImageBackground, Alert } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
    const { login, register, loginAnonymously, loginWithGoogleCredential } = useContext(AuthContext);
    const { colorScheme, toggleTheme } = useContext(ThemeContext);
    const [isLogin, setIsLogin] = useState(true);

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Google Auth Request
    const [request, response, promptAsync] = Google.useAuthRequest({
        // TODO: Get these from Google Cloud Console
        androidClientId: 'YOUR_ANDROID_CLIENT_ID',
        iosClientId: 'YOUR_IOS_CLIENT_ID',
        webClientId: 'YOUR_WEB_CLIENT_ID',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            const idToken = authentication?.idToken || response.params?.id_token;
            if (idToken) {
                handleGoogleSignIn(idToken);
            } else {
                Alert.alert("Error", "No ID Token found in response");
            }
        }
    }, [response]);

    const handleGoogleSignIn = async (token) => {
        setLoading(true);
        try {
            const result = await loginWithGoogleCredential(token);
            if (!result.success) {
                Alert.alert('Google Sign-In Error', result.error);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Google Sign-In failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!email || !password) {
            Alert.alert('Missing Info', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        let result;

        try {
            if (isLogin) {
                result = await login(email, password);
            } else {
                result = await register(email, password);
            }

            if (!result.success) {
                if (result.error && result.error.includes('auth/network-request-failed')) {
                    Alert.alert('Connection Error', 'Please check your internet connection.');
                } else if (result.error && result.error.includes('auth/invalid-email')) {
                    Alert.alert('Invalid Email', 'Please enter a valid email address.');
                } else if (result.error && result.error.includes('auth/weak-password')) {
                    Alert.alert('Weak Password', 'Password should be at least 6 characters.');
                } else {
                    Alert.alert('Error', result.error || "Authentication failed");
                }
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        if (!request) {
            Alert.alert("Error", "Google Sign-In is not ready yet.");
            return;
        }
        promptAsync();
    };

    const handleAppleLogin = async () => {
        Alert.alert(
            "SSO Demo Mode",
            "Real Apple Sign-In requires an Apple Developer Account. Logging in as Guest for now.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Continue as Guest",
                    onPress: async () => {
                        setLoading(true);
                        await loginAnonymously();
                        setLoading(false);
                    }
                }
            ]
        );
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
                                <TouchableOpacity style={styles.forgotPassword}>
                                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* SSO Buttons */}
                        <View style={styles.ssoContainer}>
                            <TouchableOpacity style={styles.ssoButton} onPress={handleGoogleLogin}>
                                <Ionicons name="logo-google" size={24} color="white" />
                                <Text style={styles.ssoText}>Google</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.ssoButton} onPress={handleAppleLogin}>
                                <Ionicons name="logo-apple" size={24} color="white" />
                                <Text style={styles.ssoText}>Apple</Text>
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
        </SafeAreaView>
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
        paddingBottom: 40
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
        height: 280,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        overflow: 'hidden',
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
        width: 250,
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
    // SSO Styles
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#374151',
    },
    dividerText: {
        color: '#6B7280',
        fontSize: 12,
    },
    ssoContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    ssoButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1F2433',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#374151',
        gap: 8,
    },
    ssoText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
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
