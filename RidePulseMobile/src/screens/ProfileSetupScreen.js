import React, { useState, useContext } from 'react';
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
            ]
        );
    };

    return (
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
                                />
                            </View>
                        </View>

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
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
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
    },
    saveButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
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
    }
});

export default ProfileSetupScreen;
