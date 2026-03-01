import React, { useState, useContext } from 'react';
<<<<<<< HEAD
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const ProfileSetupScreen = () => {
    const { updateProfileStatus, user } = useContext(AuthContext);

    const [form, setForm] = useState({
        fullName: user?.name && user.name !== user.email?.split('@')[0] ? user.name : '',
        age: '',
        dob: '',
        drivingLicense: '',
        vehicleNumber: '',
        vehicleName: '',
        vehicleModel: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (key, value) => setForm({ ...form, [key]: value });

    const handleSave = async () => {
        // Validation
        for (const key in form) {
            if (!form[key]) {
                Alert.alert('Missing Info', 'Please fill all the details or click "Do it later"');
                return;
            }
        }

        setLoading(true);
        const result = await updateProfileStatus({
            ...form,
            profileCompleted: true,
            skipProfileSetup: false
        });
        setLoading(false);

        if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to update profile');
        }
    };

    const handleSkip = async () => {
        Alert.alert(
            'Skip Profile Setup',
            'You won\'t be able to participate in rides until you complete your profile. Continue anyway?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Skip',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        await updateProfileStatus({ skipProfileSetup: true });
                        setLoading(false);
                    }
                }
=======
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';

const ProfileSetupScreen = ({ navigation }) => {
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    // Form State
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [dob, setDob] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleName, setVehicleName] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');

    const handleSaveProfile = async () => {
        if (!fullName || !age || !licenseNumber || !vehicleNumber || !vehicleModel) {
            Alert.alert("Profile Incomplete", "Please fill all required fields: Full Name, Age, License Number, Vehicle Model and Vehicle Number.");
            return;
        }

        setLoading(true);
        try {
            const profileData = {
                profile: {
                    fullName,
                    age,
                    dob,
                    licenseNumber,
                    vehicleNumber,
                    vehicleName,
                    vehicleModel,
                    profileCompleted: true,
                },
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', user.id), profileData, { merge: true });

            // Notification/Success handled by navigation
            Alert.alert("Success", "Profile updated successfully!", [
                { text: "Continue", onPress: () => navigation.replace('Main') }
            ]);
        } catch (error) {
            console.error("Profile Setup Error:", error);
            Alert.alert("Error", "Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        Alert.alert(
            "Skip Setup?",
            "You won't be able to participate in active rides until your profile is complete.",
            [
                { text: "Complete Now", style: "cancel" },
                { text: "Do it later", onPress: () => navigation.replace('Main') }
>>>>>>> feb14-version
            ]
        );
    };

    return (
<<<<<<< HEAD
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0F111A" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    <View style={styles.header}>
                        <FontAwesome5 name="id-card" size={48} color="#FFD700" style={styles.headerIcon} />
                        <Text style={styles.title}>Complete Profile</Text>
                        <Text style={styles.subtitle}>Tell us about yourself and your ride</Text>
                    </View>

                    <View style={styles.formCard}>
                        {/* Personal Info */}
                        <Text style={styles.sectionTitle}>Personal Information</Text>
                        <View style={styles.inputContainer}>
                            <MaterialIcons name="person" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#6B7280"
                                value={form.fullName}
                                onChangeText={(val) => handleChange('fullName', val)}
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.flex1, { marginRight: 8 }]}>
                                <MaterialIcons name="cake" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Age"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="numeric"
                                    value={form.age}
                                    onChangeText={(val) => handleChange('age', val)}
                                />
                            </View>
                            <View style={[styles.inputContainer, styles.flex1, { marginLeft: 8 }]}>
                                <MaterialIcons name="date-range" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Date of Birth (YYYY-MM-DD)"
                                    placeholderTextColor="#6B7280"
                                    value={form.dob}
                                    onChangeText={(val) => handleChange('dob', val)}
=======
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Profile Setup</Text>
                        <Text style={styles.subtitle}>Complete your profile to start riding</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor="#6B7280"
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Age</Text>
                                <TextInput
                                    style={styles.input}
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="e.g. 25"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="numeric"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 2 }]}>
                                <Text style={styles.label}>Date of Birth</Text>
                                <TextInput
                                    style={styles.input}
                                    value={dob}
                                    onChangeText={setDob}
                                    placeholder="DD-MM-YYYY"
                                    placeholderTextColor="#6B7280"
>>>>>>> feb14-version
                                />
                            </View>
                        </View>

<<<<<<< HEAD
                        <View style={styles.inputContainer}>
                            <FontAwesome5 name="id-badge" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.input}
                                placeholder="Driving License Number"
                                placeholderTextColor="#6B7280"
                                value={form.drivingLicense}
                                onChangeText={(val) => handleChange('drivingLicense', val)}
                            />
                        </View>

                        {/* Vehicle Info */}
                        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Vehicle Details</Text>
                        <View style={styles.inputContainer}>
                            <FontAwesome5 name="motorcycle" size={18} color="#9CA3AF" />
                            <TextInput
                                style={styles.input}
                                placeholder="Vehicle Name (e.g., Ninja, Duke)"
                                placeholderTextColor="#6B7280"
                                value={form.vehicleName}
                                onChangeText={(val) => handleChange('vehicleName', val)}
                            />
                        </View>
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.flex1, { marginRight: 8 }]}>
                                <MaterialIcons name="confirmation-number" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Vehicle No."
                                    placeholderTextColor="#6B7280"
                                    value={form.vehicleNumber}
                                    onChangeText={(val) => handleChange('vehicleNumber', val)}
                                />
                            </View>
                            <View style={[styles.inputContainer, styles.flex1, { marginLeft: 8 }]}>
                                <MaterialIcons name="settings" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Model"
                                    placeholderTextColor="#6B7280"
                                    value={form.vehicleModel}
                                    onChangeText={(val) => handleChange('vehicleModel', val)}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, loading && { opacity: 0.7 }]}
                            onPress={handleSave}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>
                                {loading ? 'Saving...' : 'Complete Setup'}
                            </Text>
                            {!loading && <MaterialIcons name="check-circle" size={20} color="black" />}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={loading}>
                            <Text style={styles.skipButtonText}>Do it later</Text>
                        </TouchableOpacity>
                    </View>
=======
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Driving License Number</Text>
                            <TextInput
                                style={styles.input}
                                value={licenseNumber}
                                onChangeText={setLicenseNumber}
                                placeholder="Enter license number"
                                placeholderTextColor="#6B7280"
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.divider}>
                            <Text style={styles.dividerText}>Vehicle Details</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vehicle Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={vehicleName}
                                onChangeText={setVehicleName}
                                placeholder="e.g. Royal Enfield Himalayan"
                                placeholderTextColor="#6B7280"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vehicle Model</Text>
                            <TextInput
                                style={styles.input}
                                value={vehicleModel}
                                onChangeText={setVehicleModel}
                                placeholder="e.g. 2023 Scram 411"
                                placeholderTextColor="#6B7280"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Vehicle Number *</Text>
                            <TextInput
                                style={styles.input}
                                value={vehicleNumber}
                                onChangeText={setVehicleNumber}
                                placeholder="e.g. KA-01-XX-0000"
                                placeholderTextColor="#6B7280"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <>
                                <Text style={styles.saveButtonText}>SAVE & CONTINUE</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="black" />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                        <Text style={styles.skipButtonText}>Do it later</Text>
                    </TouchableOpacity>
>>>>>>> feb14-version
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
<<<<<<< HEAD
    safeArea: {
        flex: 1,
        backgroundColor: '#0F111A'
    },
    flex1: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingTop: 40,
        paddingBottom: 40
    },
    header: {
        alignItems: 'center',
        marginBottom: 30
    },
    headerIcon: {
        marginBottom: 16
=======
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 32,
>>>>>>> feb14-version
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
<<<<<<< HEAD
        color: '#FFFFFF'
=======
        color: 'white',
        marginBottom: 8,
>>>>>>> feb14-version
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
<<<<<<< HEAD
        marginTop: 8
    },
    formCard: {
        backgroundColor: '#161925',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1F2937'
    },
    sectionTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4
    },
    row: {
        flexDirection: 'row',
        marginBottom: 12
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2433',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12
    },
    input: {
        flex: 1,
        marginLeft: 10,
        color: '#FFFFFF',
        fontSize: 15
=======
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    input: {
        backgroundColor: '#161925',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        color: 'white',
        fontSize: 16,
    },
    divider: {
        marginVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
        paddingBottom: 8,
    },
    dividerText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
>>>>>>> feb14-version
    },
    saveButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
<<<<<<< HEAD
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20
    },
    saveButtonText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 16,
        marginRight: 8
    },
    skipButton: {
        alignItems: 'center',
        marginTop: 20,
        padding: 10
    },
    skipButtonText: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline'
=======
        paddingVertical: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        gap: 10,
    },
    saveButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    skipButton: {
        marginTop: 20,
        alignItems: 'center',
        padding: 10,
    },
    skipButtonText: {
        color: '#6B7280',
        fontSize: 14,
        textDecorationLine: 'underline',
>>>>>>> feb14-version
    }
});

export default ProfileSetupScreen;
