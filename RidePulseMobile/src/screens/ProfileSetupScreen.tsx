import React, { useState, useContext, useEffect } from 'react';
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
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { db } from '../config/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { RootStackParamList } from '../types';

type ProfileSetupNav = NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'>;

const ProfileSetupScreen: React.FC = () => {
    const navigation = useNavigation<ProfileSetupNav>();
    const { user, setUser } = useContext(AuthContext);
    const [loading, setLoading] = useState<boolean>(false);

    // Form State
    const [fullName, setFullName] = useState<string>('');
    const [age, setAge] = useState<string>('');
    const [dob, setDob] = useState<string>('');
    const [licenseNumber, setLicenseNumber] = useState<string>('');
    const [vehicleNumber, setVehicleNumber] = useState<string>('');
    const [vehicleName, setVehicleName] = useState<string>('');
    const [vehicleModel, setVehicleModel] = useState<string>('');
    const [bloodType, setBloodType] = useState<string>('');
    const [isEditMode, setIsEditMode] = useState<boolean>(false);

    // Populate form if user profile already exists
    useEffect(() => {
        if (user?.profile) {
            if (user.profile.fullName) setFullName(user.profile.fullName);
            if (user.profile.age) setAge(user.profile.age.toString());
            if (user.profile.dob) setDob(user.profile.dob);
            if (user.profile.licenseNumber) setLicenseNumber(user.profile.licenseNumber);
            if (user.profile.vehicleNumber) setVehicleNumber(user.profile.vehicleNumber);
            if (user.profile.vehicleName) setVehicleName(user.profile.vehicleName);
            if (user.profile.vehicleModel) setVehicleModel(user.profile.vehicleModel);
            if (user.profile.bloodType) setBloodType(user.profile.bloodType);

            if (user.profile.profileCompleted) {
                setIsEditMode(true);
            }
        }
    }, [user]);

    // Helper validation functions
    const isNumeric = (val: string) => /^\d+$/.test(val);
    const isValidLicense = (val: string) => /^[A-Z0-9\-]+$/.test(val); // Simple alphanumeric + dash
    const isValidVehicleNumber = (val: string) => /^[A-Z0-9\-]+$/.test(val); // Simple alphanumeric + dash

    const handleSaveProfile = async (): Promise<void> => {
        if (!fullName || !age || !licenseNumber || !vehicleNumber || !vehicleModel) {
            Alert.alert("Profile Incomplete", "Please fill all required fields: Full Name, Age, License Number, Vehicle Model and Vehicle Number.");
            return;
        }
        if (!isNumeric(age) || parseInt(age) < 16 || parseInt(age) > 100) {
            Alert.alert("Invalid Age", "Please enter a valid age between 16 and 100.");
            return;
        }
        if (dob && !/^\d{2}-\d{2}-\d{4}$/.test(dob)) {
            Alert.alert("Invalid DOB", "Date of Birth must be in DD-MM-YYYY format.");
            return;
        }
        if (!isValidLicense(licenseNumber)) {
            Alert.alert("Invalid License Number", "License number should be alphanumeric (A-Z, 0-9, -).");
            return;
        }
        if (!isValidVehicleNumber(vehicleNumber)) {
            Alert.alert("Invalid Vehicle Number", "Vehicle number should be alphanumeric (A-Z, 0-9, -).");
            return;
        }
        if (!user?.id) return;

        setLoading(true);
        try {
            const updatedProfile = {
                fullName,
                age,
                dob,
                licenseNumber,
                vehicleNumber,
                vehicleName,
                vehicleModel,
                bloodType,
                profileCompleted: true,
            };

            const profileData = {
                profile: updatedProfile,
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', user.id), profileData, { merge: true });

            // Update AuthContext state so AppNavigator re-evaluates
            // and renders the Main route instead of ProfileSetup
            setUser({
                ...user,
                profile: { ...user.profile, ...updatedProfile },
            });

            Alert.alert("Success", "Profile saved successfully", [
                {
                    text: "OK",
                    onPress: () => {
                        // Hard reset prevents going back to setup screen
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Main' }],
                        });
                    },
                },
            ]);
        } catch (error) {
            console.error("Profile Setup Error:", error);
            Alert.alert("Error", "Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = (): void => {
        Alert.alert(
            "Skip Setup?",
            "You won't be able to participate in active rides until your profile is complete.",
            [
                { text: "Complete Now", style: "cancel" },
                {
                    text: "Do it later",
                    onPress: async () => {
                        // Persist skip flag both in local state AND Firestore
                        // so the navigator doesn't loop back even after app restart
                        if (user) {
                            setUser({ ...user, skipProfileSetup: true });
                            try {
                                await setDoc(
                                    doc(db, 'users', user.id),
                                    { skipProfileSetup: true },
                                    { merge: true }
                                );
                            } catch (err) {
                                console.error('Error persisting skip flag:', err);
                            }
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0F111A" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <FontAwesome5 name="id-card" size={48} color="#FFD700" style={styles.headerIcon} />
                        <Text style={styles.title}>Profile Setup</Text>
                        <Text style={styles.subtitle}>Complete your profile to start riding</Text>
                    </View>

                    <View style={styles.formCard}>
                        {/* Personal Info */}
                        <Text style={styles.sectionTitle}>Personal Information</Text>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="person" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name *"
                                placeholderTextColor="#6B7280"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.flex1, { marginRight: 8 }]}>
                                <MaterialIcons name="cake" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Age *"
                                    placeholderTextColor="#6B7280"
                                    keyboardType="numeric"
                                    value={age}
                                    onChangeText={setAge}
                                />
                            </View>
                            <View style={[styles.inputContainer, styles.flex1, { marginLeft: 8 }]}>
                                <MaterialIcons name="date-range" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="DOB (DD-MM-YYYY)"
                                    placeholderTextColor="#6B7280"
                                    value={dob}
                                    onChangeText={setDob}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <FontAwesome5 name="id-badge" size={18} color="#9CA3AF" />
                            <TextInput
                                style={styles.input}
                                placeholder="Driving License Number *"
                                placeholderTextColor="#6B7280"
                                value={licenseNumber}
                                onChangeText={setLicenseNumber}
                                autoCapitalize="characters"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <MaterialIcons name="invert-colors" size={20} color="#9CA3AF" />
                            <TextInput
                                style={styles.input}
                                placeholder="Blood Type (e.g., A+)"
                                placeholderTextColor="#6B7280"
                                value={bloodType}
                                onChangeText={setBloodType}
                                autoCapitalize="characters"
                            />
                        </View>

                        {/* Vehicle Info */}
                        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Vehicle Details</Text>

                        <View style={styles.inputContainer}>
                            <FontAwesome5 name="motorcycle" size={18} color="#9CA3AF" />
                            <TextInput
                                style={styles.input}
                                placeholder="Vehicle Name (e.g., Royal Enfield Himalayan)"
                                placeholderTextColor="#6B7280"
                                value={vehicleName}
                                onChangeText={setVehicleName}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputContainer, styles.flex1, { marginRight: 8 }]}>
                                <MaterialIcons name="confirmation-number" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Vehicle No. *"
                                    placeholderTextColor="#6B7280"
                                    value={vehicleNumber}
                                    onChangeText={setVehicleNumber}
                                    autoCapitalize="characters"
                                />
                            </View>
                            <View style={[styles.inputContainer, styles.flex1, { marginLeft: 8 }]}>
                                <MaterialIcons name="settings" size={20} color="#9CA3AF" />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Model *"
                                    placeholderTextColor="#6B7280"
                                    value={vehicleModel}
                                    onChangeText={setVehicleModel}
                                />
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, loading && { opacity: 0.7 }]}
                        onPress={handleSaveProfile}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <>
                                <Text style={styles.saveButtonText}>{isEditMode ? 'SAVE CHANGES' : 'SAVE & CONTINUE'}</Text>
                                <MaterialIcons name="arrow-forward" size={20} color="black" />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipButton} onPress={handleSkip} disabled={loading}>
                        <Text style={styles.skipButtonText}>Do it later</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F111A' },
    scrollContent: { flexGrow: 1, padding: 24, paddingTop: 40, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 30 },
    headerIcon: { marginBottom: 16 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
    subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
    formCard: {
        backgroundColor: '#161925',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    sectionTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        marginLeft: 4,
    },
    row: { flexDirection: 'row', marginBottom: 0 },
    flex1: { flex: 1 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2433',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        marginLeft: 10,
        color: '#FFFFFF',
        fontSize: 15,
    },
    saveButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 10,
    },
    saveButtonText: {
        color: '#000000',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    skipButton: { alignItems: 'center', marginTop: 20, padding: 10 },
    skipButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
        textDecorationLine: 'underline',
    },
});

export default ProfileSetupScreen;
