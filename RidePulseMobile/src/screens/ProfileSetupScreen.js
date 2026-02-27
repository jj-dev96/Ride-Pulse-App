import React, { useState, useContext } from 'react';
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
            ]
        );
    };

    return (
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
                                />
                            </View>
                        </View>

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
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF'
    },
    subtitle: {
        fontSize: 14,
        color: '#9CA3AF',
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
    },
    saveButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
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
    }
});

export default ProfileSetupScreen;
