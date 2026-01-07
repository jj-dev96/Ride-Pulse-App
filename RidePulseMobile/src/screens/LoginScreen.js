import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const LoginScreen = () => {
    const { login } = useContext(AuthContext);
    const { colorScheme } = useContext(ThemeContext);
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    const toggleMode = () => setIsLogin(!isLogin);

    const handleSubmit = async () => {
        if (isLogin) {
            // Mock login
            await login('user123', email.split('@')[0] || 'Rider', 'rider');
        } else {
            // Mock signup
            if (name && email && password) {
                await login('user123', name, 'rider');
            }
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
        >
            <View className="flex-1 bg-background-light dark:bg-background-dark">
                {/* Background Pattern */}
                <View className="absolute inset-0 opacity-20 dark:opacity-40">
                    <LinearGradient
                        colors={colorScheme === 'dark' ? ['#FFD700', '#000000'] : ['#FFD700', '#FFFFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="w-full h-full"
                    />
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                    {/* Logo */}
                    <View className="items-center mb-10">
                        {/* <Image 
                            source={require('../../assets/logo-main.png')} 
                            className="w-24 h-24 mb-4" 
                            resizeMode="contain"
                        /> */}
                        {/* Fallback Icon if image missing or for testing */}
                        <MaterialIcons name="two-wheeler" size={64} color="#FFD700" />

                        <Text className="text-4xl font-bold text-gray-800 dark:text-white mt-2">
                            Ride<Text className="text-primary">Pulse</Text>
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 mt-1 tracking-widest text-xs uppercase">
                            Join the pack. Ride together.
                        </Text>
                    </View>

                    {/* Form Container */}
                    <View className="bg-white dark:bg-card-dark p-6 rounded-2xl shadow-xl dark:shadow-neon border border-gray-100 dark:border-gray-800">
                        {/* Toggle */}
                        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6 relative overflow-hidden">
                            {/* Animated Background for toggle could go here with Reanimated */}
                            <TouchableOpacity
                                onPress={() => setIsLogin(true)}
                                className={`flex-1 py-2 items-center rounded-md ${isLogin ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                            >
                                <Text className={`font-semibold ${isLogin ? 'text-primary' : 'text-gray-500'}`}>Log In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIsLogin(false)}
                                className={`flex-1 py-2 items-center rounded-md ${!isLogin ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                            >
                                <Text className={`font-semibold ${!isLogin ? 'text-primary' : 'text-gray-500'}`}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Inputs */}
                        <View className="space-y-4">
                            {!isLogin && (
                                <View className="flex-row items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                                    <MaterialIcons name="person" size={20} color="#9CA3AF" />
                                    <TextInput
                                        placeholder="Full Name"
                                        placeholderTextColor="#9CA3AF"
                                        className="flex-1 ml-3 text-gray-800 dark:text-white"
                                        value={name}
                                        onChangeText={setName}
                                    />
                                </View>
                            )}

                            <View className="flex-row items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                                <MaterialIcons name="email" size={20} color="#9CA3AF" />
                                <TextInput
                                    placeholder="Email"
                                    placeholderTextColor="#9CA3AF"
                                    className="flex-1 ml-3 text-gray-800 dark:text-white"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>

                            {!isLogin && (
                                <View className="flex-row items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                                    <MaterialIcons name="phone" size={20} color="#9CA3AF" />
                                    <TextInput
                                        placeholder="Phone Number"
                                        placeholderTextColor="#9CA3AF"
                                        className="flex-1 ml-3 text-gray-800 dark:text-white"
                                        keyboardType="phone-pad"
                                        value={phone}
                                        onChangeText={setPhone}
                                    />
                                </View>
                            )}

                            <View className="flex-row items-center bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                                <MaterialIcons name="lock" size={20} color="#9CA3AF" />
                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor="#9CA3AF"
                                    className="flex-1 ml-3 text-gray-800 dark:text-white"
                                    secureTextEntry
                                    value={password}
                                    onChangeText={setPassword}
                                />
                            </View>

                            <TouchableOpacity className="items-end">
                                <Text className="text-xs font-semibold text-primary">Forgot Password?</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSubmit}
                                className="bg-primary rounded-xl py-4 flex-row justify-center items-center shadow-lg shadow-primary/30 mt-4 active:opacity-90"
                            >
                                <Text className="text-black font-bold tracking-wide mr-2">
                                    {isLogin ? 'LOG IN' : 'SIGN UP'}
                                </Text>
                                <MaterialIcons name="arrow-forward" size={18} color="black" />
                            </TouchableOpacity>
                        </View>

                        {/* Social Login */}
                        <View className="mt-8 items-center">
                            <Text className="text-gray-400 text-xs mb-4">Or continue with</Text>
                            <View className="flex-row gap-4">
                                <TouchableOpacity className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center border border-gray-200 dark:border-gray-700">
                                    <Image source={require('../../assets/googleLogo.png')} className="w-6 h-6" resizeMode="contain" />
                                </TouchableOpacity>
                                <TouchableOpacity className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center border border-gray-200 dark:border-gray-700">
                                    <Image source={require('../../assets/appleLogo.png')} className="w-6 h-6" resizeMode="contain" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

export default LoginScreen;
