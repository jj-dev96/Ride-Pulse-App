import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

const SettingsScreen = ({ navigation }) => {
    const { logout, user } = useContext(AuthContext);
    const [pushEnabled, setPushEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(false);
    const [unit, setUnit] = useState('KM'); // 'KM' or 'MI'

    // Modals
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [supportModalVisible, setSupportModalVisible] = useState(false);
    const [supportContent, setSupportContent] = useState('');

    const handleLogout = () => {
        Alert.alert("Log Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log Out", onPress: logout, style: "destructive" }
        ]);
    };

    const SectionHeader = ({ title }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
    );

    const MenuItem = ({ icon, title, subtitle, showChevron = true, rightElement, color = '#6B7280', onPress }) => (
        <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.menuIconContainer}>
                {icon}
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <View style={styles.menuRight}>
                {rightElement}
                {showChevron && <MaterialIcons name="chevron-right" size={24} color="#4B5563" />}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                <SafeAreaView edges={['top']}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <View style={styles.logoIcon}>
                                <FontAwesome5 name="shield-alt" size={22} color="black" />
                            </View>
                            <View>
                                <Text style={styles.logoText}>RIDEPULSE</Text>
                                <Text style={styles.logoSubText}>SETTINGS</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.iconBtn}>
                            <MaterialIcons name="notifications" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    {/* Garage & Machine */}
                    <SectionHeader title="GARAGE & MACHINE" />
                    <View style={styles.card}>
                        <MenuItem
                            icon={<FontAwesome5 name="motorcycle" size={16} color="#FFD700" />}
                            title="Smart Garage"
                            subtitle="Configure bike specs & rider identity"
                            color="#FFD700"
                            onPress={() => navigation.navigate('SmartGarage')}
                        />
                    </View>

                    {/* Account */}
                    <SectionHeader title="ACCOUNT" />
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={[styles.menuItem, { paddingVertical: 15 }]}
                            onPress={() => setProfileModalVisible(true)}
                        >
                            <View style={styles.avatarContainer}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{user?.name?.substring(0, 2).toUpperCase() || 'AR'}</Text>
                                </View>
                                <View style={styles.userBadge}>
                                    <Text style={styles.userBadgeText}>User</Text>
                                </View>
                            </View>
                            <View style={styles.menuTextContainer}>
                                <Text style={[styles.menuTitle, { fontSize: 16 }]}>{user?.name || 'Alex Rider'}</Text>
                                <Text style={styles.menuSubtitle}>{user?.email || 'alex.rider@ridepulse.com'}</Text>
                            </View>
                            <MaterialIcons name="chevron-right" size={24} color="#4B5563" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <MenuItem
                            icon={<MaterialIcons name="lock" size={18} color="#6B7280" />}
                            title="Password & Security"
                            onPress={() => Alert.alert("Security", "Two-factor authentication is enabled.")}
                        />

                        <View style={styles.divider} />

                        <MenuItem
                            icon={<MaterialIcons name="notifications" size={18} color="#6B7280" />}
                            title="Push Notifications"
                            showChevron={false}
                            rightElement={
                                <Switch
                                    trackColor={{ false: "#374151", true: "#FFD700" }}
                                    thumbColor={pushEnabled ? "#FFFFFF" : "#9CA3AF"}
                                    onValueChange={setPushEnabled}
                                    value={pushEnabled}
                                />
                            }
                        />
                    </View>

                    {/* App Preferences */}
                    <SectionHeader title="APP PREFERENCES" />
                    <View style={styles.card}>
                        <MenuItem
                            icon={<MaterialCommunityIcons name="ruler" size={18} color="#6B7280" />}
                            title="Units"
                            showChevron={false}
                            rightElement={
                                <View style={styles.segmentControl}>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, unit === 'KM' && styles.segmentBtnActive]}
                                        onPress={() => setUnit('KM')}
                                    >
                                        <Text style={[styles.segmentText, unit === 'KM' && styles.segmentTextActive]}>KM</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.segmentBtn, unit === 'MI' && styles.segmentBtnActive]}
                                        onPress={() => setUnit('MI')}
                                    >
                                        <Text style={[styles.segmentText, unit === 'MI' && styles.segmentTextActive]}>MI</Text>
                                    </TouchableOpacity>
                                </View>
                            }
                        />

                        <View style={styles.divider} />

                        <MenuItem
                            icon={<MaterialIcons name="map" size={18} color="#6B7280" />}
                            title="Map Style"
                            showChevron={true}
                            rightElement={
                                <Text style={{ color: '#9CA3AF', marginRight: 10, fontSize: 12 }}>Dark Satellite</Text>
                            }
                            onPress={() => Alert.alert("Map Style", "Currently using Custom Dark Theme (OSM)")}
                        />

                        <View style={styles.divider} />

                        <MenuItem
                            icon={<Ionicons name="eye" size={18} color="#6B7280" />}
                            title="Share Live Location"
                            showChevron={false}
                            rightElement={
                                <Switch
                                    trackColor={{ false: "#374151", true: "#FFD700" }}
                                    thumbColor={locationEnabled ? "#FFFFFF" : "#9CA3AF"}
                                    onValueChange={setLocationEnabled}
                                    value={locationEnabled}
                                />
                            }
                        />
                    </View>

                    {/* Support */}
                    <SectionHeader title="SUPPORT" />
                    <View style={styles.card}>
                        <MenuItem
                            title="Help Center & FAQ"
                            rightElement={<MaterialIcons name="launch" size={16} color="#6B7280" style={{ marginRight: 10 }} />}
                            showChevron={false}
                            onPress={() => {
                                setSupportContent("FAQ:\n\n1. How to join a ride?\nGo to Lobby > Join Ride.\n\n2. Is location real?\nYes, we use GPS now!");
                                setSupportModalVisible(true);
                            }}
                        />
                        <View style={styles.divider} />
                        <MenuItem
                            title="Contact Support"
                            onPress={() => {
                                setSupportContent("Contact Us:\n\nEmail: support@ridepulse.com\nPhone: 1-800-RIDE-NOW");
                                setSupportModalVisible(true);
                            }}
                        />
                        <View style={styles.divider} />
                        <MenuItem
                            title="Report a Bug"
                            rightElement={<MaterialIcons name="bug-report" size={16} color="#6B7280" style={{ marginRight: 10 }} />}
                            showChevron={false}
                            onPress={() => Alert.alert("Report Bug", "Logs have been sent to developer.")}
                        />
                    </View>

                    {/* Log Out */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <MaterialIcons name="logout" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.versionText}>RidePulse v2.5.0 (Build 305)</Text>
                        <View style={styles.footerLinks}>
                            <Text style={styles.linkText}>Privacy Policy</Text>
                            <Text style={styles.linkText}>Terms of Service</Text>
                        </View>
                    </View>

                </SafeAreaView>
            </ScrollView>

            {/* Profile Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={profileModalVisible}
                onRequestClose={() => setProfileModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Edit Profile</Text>
                            <TouchableOpacity onPress={() => setProfileModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Display Name</Text>
                            <TextInput style={styles.input} defaultValue="Alex Rider" placeholderTextColor="#6B7280" />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput style={styles.input} defaultValue="alex@ridepulse.com" placeholderTextColor="#6B7280" editable={false} />
                        </View>

                        <TouchableOpacity style={styles.saveButton} onPress={() => setProfileModalVisible(false)}>
                            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Support Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={supportModalVisible}
                onRequestClose={() => setSupportModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Support</Text>
                            <TouchableOpacity onPress={() => setSupportModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.supportText}>{supportContent}</Text>
                        <TouchableOpacity style={styles.saveButton} onPress={() => setSupportModalVisible(false)}>
                            <Text style={styles.saveButtonText}>CLOSE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoIcon: {
        width: 36,
        height: 36,
        backgroundColor: '#FFD700',
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    logoText: {
        color: '#FFD700',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    logoSubText: {
        color: '#9CA3AF',
        fontSize: 12,
        letterSpacing: 1,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionHeader: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        letterSpacing: 1,
    },
    card: {
        backgroundColor: '#161925',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1F2937',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
    },
    menuIconContainer: {
        width: 32,
        alignItems: 'center', // Center icon if present
        justifyContent: 'center',
        marginRight: 10,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitle: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    menuSubtitle: {
        color: '#6B7280',
        fontSize: 12,
        marginTop: 2,
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: '#1F2937',
        marginLeft: 50, // Indent past icon
    },
    avatarContainer: {
        marginRight: 15,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#374151',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    userBadge: {
        position: 'absolute',
        bottom: -5,
        alignSelf: 'center',
        backgroundColor: '#374151',
        paddingHorizontal: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    userBadgeText: {
        color: '#FFD700',
        fontSize: 8,
        fontWeight: 'bold',
    },
    segmentControl: {
        flexDirection: 'row',
        backgroundColor: '#1F2937',
        borderRadius: 6,
        padding: 2,
    },
    segmentBtn: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    segmentBtnActive: {
        backgroundColor: '#374151',
    },
    segmentText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: 'bold',
    },
    segmentTextActive: {
        color: '#FFD700',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        marginTop: 10,
        marginBottom: 30,
    },
    logoutText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 14,
    },
    footer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    versionText: {
        color: '#4B5563',
        fontSize: 12,
        marginBottom: 5,
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 20,
    },
    linkText: {
        color: '#6B7280',
        fontSize: 12,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#161925',
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 400,
        borderWidth: 1,
        borderColor: '#374151',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        color: '#9CA3AF',
        marginBottom: 5,
        fontSize: 12,
    },
    input: {
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 8,
        padding: 12,
        color: 'white',
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'black',
        fontWeight: 'bold',
    },
    supportText: {
        color: '#D1D5DB',
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 20,
    }
});

export default SettingsScreen;
