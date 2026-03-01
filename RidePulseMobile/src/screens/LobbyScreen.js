import React, { useState, useRef, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, TextInput, Modal, Alert, ActivityIndicator, Share, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AuthContext } from '../context/AuthContext';
import { GroupService } from '../services/GroupService';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const { width, height } = Dimensions.get('window');

const LobbyScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('JOIN');
    const [joinCode, setJoinCode] = useState(['', '', '', '', '', '']);

    // Local State (UI)
    const [showHostModal, setShowHostModal] = useState(false);

    // Remote State (Logic)
    const [loading, setLoading] = useState(false);
    const [currentGroup, setCurrentGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [toast, setToast] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    const inputRefs = useRef([]);
    const previousMemberCount = useRef(0);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    // Listen to group updates
    useEffect(() => {
        let unsubGroup;
        let unsubMembers;

        if (currentGroup && currentGroup.id) {
            unsubGroup = GroupService.subscribeToGroup(currentGroup.id, (data) => {
                if (data) {
                    setCurrentGroup(data);
                } else {
                    if (currentGroup) {
                        Alert.alert("Ride Closed", "This ride lobby has been closed.");
                        setCurrentGroup(null);
                    }
                }
            });

            unsubMembers = GroupService.subscribeToMembers(currentGroup.id, (memberList) => {
                // Sorting logic: Host first, then online status, then name
                const sorted = [...memberList].sort((a, b) => {
                    if (a.role === 'host') return -1;
                    if (b.role === 'host') return 1;
                    if (a.isOnline && !b.isOnline) return -1;
                    if (!a.isOnline && b.isOnline) return 1;
                    return a.name.localeCompare(b.name);
                });

                // Joined/Left Notification logic
                if (previousMemberCount.current !== 0) {
                    if (memberList.length > previousMemberCount.current) {
                        const newMember = memberList.find(m => !members.some(old => old.id === m.id));
                        if (newMember) {
                            showToast(`${newMember.name} joined the ride`);
                        }
                    } else if (memberList.length < previousMemberCount.current) {
                        const leftMember = members.find(m => !memberList.some(curr => curr.id === m.id));
                        if (leftMember) {
                            showToast(`${leftMember.name} left the ride`);
                        }
                    }
                }

                setMembers(sorted);
                previousMemberCount.current = memberList.length;
            });
        }

        return () => {
            unsubGroup && unsubGroup();
            unsubMembers && unsubMembers();
        };
    }, [currentGroup?.id]);

    const handleSwitchTab = (tab) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
    };

    const handleCodeChange = (text, index) => {
        const newCode = [...joinCode];
        newCode[index] = text.toUpperCase();
        setJoinCode(newCode);

        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyPress = ({ nativeEvent }, index) => {
        if (nativeEvent.key === 'Backspace') {
            if (joinCode[index] === '' && index > 0) {
                const newCode = [...joinCode];
                newCode[index - 1] = '';
                setJoinCode(newCode);
                inputRefs.current[index - 1].focus();
            }
        }
    };

    const handleCreateLobby = async () => {
        setLoading(true);
        try {
            const rideDetails = {
                name: `${user.name}'s Adventure`,
                startLocation: 'Current Position',
                destination: 'TBD',
                rideType: 'Outbound'
            };
            const id = await GroupService.createGroup(user, rideDetails);
            setCurrentGroup({ id, ...rideDetails, hostId: user.id });
        } catch (error) {
            Alert.alert("Error", "Failed to create lobby: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLobby = async () => {
        const code = joinCode.join('');
        if (code.length < 6) {
            Alert.alert("Invalid Code", "Please enter the full 6-character code.");
            return;
        }

        setLoading(true);
        try {
            const group = await GroupService.joinGroup(code, user);
            setCurrentGroup(group);
            handleSwitchTab('HOSTING');
        } catch (error) {
            Alert.alert("Error", "Could not join lobby: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartRide = async () => {
        if (!currentGroup) return;

        const isHost = currentGroup.hostId === user.id;
        if (isHost) {
            await GroupService.updateRideStatus(currentGroup.id, 'active');
        }

        navigation.navigate('Map', {
            startRide: true,
            groupId: currentGroup.id,
            rideName: currentGroup.rideName,
            destination: currentGroup.destination
        });
    };

    const leaveLobby = async () => {
        if (!currentGroup) return;
        setLoading(true);
        try {
            await GroupService.leaveGroup(currentGroup.id, user.id);
            setCurrentGroup(null);
            setMembers([]);
            setJoinCode(['', '', '', '', '', '']);
            handleSwitchTab('JOIN');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const onBarCodeScanned = ({ data }) => {
        setScanning(false);
        if (data && data.length === 6) {
            const chars = data.split('');
            setJoinCode(chars);
            Alert.alert("Code Found", `Join Ride ${data}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Join', onPress: () => joinGroupDirect(data) }
            ]);
        }
    };

    const joinGroupDirect = async (id) => {
        setLoading(true);
        try {
            const group = await GroupService.joinGroup(id, user);
            setCurrentGroup(group);
            handleSwitchTab('HOSTING');
        } catch (error) {
            Alert.alert("Error", "Could not join ride.");
        } finally {
            setLoading(false);
        }
    };

    const startScan = async () => {
        if (!permission?.granted) {
            const { granted } = await requestPermission();
            if (!granted) {
                Alert.alert("Permission Required", "Camera access is needed to scan QR codes.");
                return;
            }
        }
        setScanning(true);
    };

    const handleShare = async () => {
        if (!currentGroup?.id) return;
        try {
            await Share.share({
                message: `Join my RidePulse group! Use code: ${currentGroup.id}`,
            });
        } catch (error) {
            Alert.alert(error.message);
        }
    };

    const isReadOnly = currentGroup?.status === 'completed' || currentGroup?.status === 'cancelled';

    return (
        <LinearGradient
            colors={['#0F111A', '#161925', '#111827']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                {toast && (
                    <View style={styles.toastContainer}>
                        <LinearGradient colors={['#FFD700', '#F59E0B']} style={styles.toastGradient}>
                            <MaterialIcons name="notifications" size={18} color="black" />
                            <Text style={styles.toastText}>{toast}</Text>
                        </LinearGradient>
                    </View>
                )}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    {/* Header Logo */}
                    <View style={styles.header}>
                        <View style={styles.circularLogoContainer}>
                            <Image
                                source={require('../../assets/ride-pulse-logo-shield.png')}
                                style={styles.circularLogo}
                                resizeMode="cover"
                            />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>RIDE<Text style={{ color: '#EF4444' }}>PULSE</Text></Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'JOIN' && styles.activeTab]}
                            onPress={() => handleSwitchTab('JOIN')}
                            disabled={currentGroup !== null && activeTab === 'HOSTING'}
                        >
                            <Text style={[styles.tabText, activeTab === 'JOIN' && styles.activeTabText]}>JOIN RIDE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'HOSTING' && styles.activeTab]}
                            onPress={() => handleSwitchTab('HOSTING')}
                        >
                            <Text style={[styles.tabText, activeTab === 'HOSTING' && styles.activeTabText]}>
                                {currentGroup ? 'CURRENT RIDE' : 'HOST RIDE'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content Area */}
                    <View style={styles.contentArea}>
                        {activeTab === 'JOIN' && (
                            <ScrollView
                                contentContainerStyle={styles.scrollContent}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                <View style={styles.joinCard}>
                                    <Text style={styles.joinTitle}>ENTER ACCESS CODE</Text>
                                    <Text style={styles.joinSubtitle}>Ask the host for the 6-character code</Text>

                                    <LottieView
                                        source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_jcikwtux.json' }}
                                        autoPlay
                                        loop
                                        style={{ width: 100, height: 50, alignSelf: 'center', marginBottom: 10 }}
                                    />

                                    <View style={styles.codeInputContainer}>
                                        {joinCode.map((digit, index) => (
                                            <TextInput
                                                key={index}
                                                ref={(ref) => inputRefs.current[index] = ref}
                                                style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                                                maxLength={1}
                                                value={digit}
                                                onChangeText={(text) => handleCodeChange(text, index)}
                                                onKeyPress={(e) => handleKeyPress(e, index)}
                                                keyboardType="ascii-capable"
                                                autoCapitalize="characters"
                                                selectionColor="#FFD700"
                                            />
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        style={styles.connectButton}
                                        onPress={handleJoinLobby}
                                        disabled={loading}
                                    >
                                        {loading ? <ActivityIndicator color="black" /> : (
                                            <>
                                                <Text style={styles.connectButtonText}>CONNECT TO LOBBY</Text>
                                                <MaterialIcons name="login" size={20} color="black" />
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.scannerContainer}>
                                    <Text style={styles.orText}>OR</Text>
                                    <TouchableOpacity style={styles.scanButton} onPress={startScan}>
                                        <MaterialIcons name="qr-code-scanner" size={24} color="#06B6D4" />
                                        <Text style={styles.scanText}>SCAN QR CODE</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}

                        {activeTab === 'HOSTING' && (
                            <View style={styles.hostingContainer}>
                                {!currentGroup ? (
                                    <View style={styles.createContainer}>
                                        <View style={styles.createIconBg}>
                                            <FontAwesome5 name="road" size={40} color="#FFD700" />
                                        </View>
                                        <Text style={styles.createTitle}>Host a Group Ride</Text>
                                        <Text style={styles.createSubtitle}>Create a ride group to track your pack in real-time.</Text>

                                        <TouchableOpacity
                                            style={styles.createBtn}
                                            onPress={handleCreateLobby}
                                            disabled={loading}
                                        >
                                            {loading ? <ActivityIndicator color="black" /> : (
                                                <Text style={styles.createBtnText}>START NEW LOBBY</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.lobbyContainer}>
                                        {/* Status Banner */}
                                        {currentGroup.status === 'cancelled' && (
                                            <View style={[styles.statusBanner, { backgroundColor: '#EF4444' }]}>
                                                <Text style={styles.statusBannerText}>THIS RIDE HAS BEEN CANCELLED</Text>
                                            </View>
                                        )}
                                        {currentGroup.status === 'completed' && (
                                            <View style={[styles.statusBanner, { backgroundColor: '#10B981' }]}>
                                                <Text style={styles.statusBannerText}>RIDE COMPLETED SUCCESSFULLY</Text>
                                            </View>
                                        )}

                                        <LinearGradient
                                            colors={['#1F2937', '#111827']}
                                            style={styles.accessCard}
                                        >
                                            <View style={styles.accessHeader}>
                                                <View>
                                                    <Text style={styles.accessLabel}>RIDE: {currentGroup.rideName || 'Unnamed'}</Text>
                                                    <Text style={styles.routeText}>{currentGroup.startLocation} → {currentGroup.destination}</Text>
                                                </View>
                                                {!isReadOnly && (
                                                    <TouchableOpacity onPress={handleShare}>
                                                        <MaterialIcons name="share" size={24} color="#FFD700" />
                                                    </TouchableOpacity>
                                                )}
                                            </View>

                                            <View style={styles.codeRow}>
                                                <Text style={styles.accessCode}>{currentGroup.id}</Text>
                                                <View style={styles.qrSmallBox}>
                                                    <QRCode
                                                        value={currentGroup.id}
                                                        size={60}
                                                        backgroundColor="transparent"
                                                        color="white"
                                                    />
                                                </View>
                                            </View>

                                            <View style={styles.statusRow}>
                                                <View style={[styles.statusDot, { backgroundColor: currentGroup.status === 'active' ? '#EF4444' : '#10B981' }]} />
                                                <Text style={styles.statusText}>
                                                    Status: {currentGroup.status?.toUpperCase()} • {members.length} Rider(s)
                                                </Text>
                                            </View>
                                        </LinearGradient>

                                        <View style={styles.listHeader}>
                                            <Text style={styles.listTitle}>LIVE ROSTER</Text>
                                            {!isReadOnly && (
                                                <TouchableOpacity onPress={leaveLobby}>
                                                    <Text style={[styles.manageText, { color: '#EF4444' }]}>Exit Lobby</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <ScrollView
                                            style={styles.ridersList}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={{ paddingBottom: 20 }}
                                        >
                                            {members.length === 0 ? (
                                                <View style={styles.waitingState}>
                                                    <ActivityIndicator color="#FFD700" style={{ marginBottom: 10 }} />
                                                    <Text style={styles.waitingText}>Waiting for members to join...</Text>
                                                </View>
                                            ) : (
                                                members.map((member) => (
                                                    <LinearGradient
                                                        key={member.id}
                                                        colors={['#1F2937', '#161925']}
                                                        style={[styles.riderCard, member.role === 'host' && styles.hostCard]}
                                                    >
                                                        {member.role === 'host' && <View style={styles.hostStripe} />}
                                                        <View style={styles.riderContent}>
                                                            <View style={styles.avatarContainer}>
                                                                <View style={[styles.regularAvatar, member.role === 'host' && styles.hostAvatar]}>
                                                                    {member.profileImage ? (
                                                                        <Image source={{ uri: member.profileImage }} style={styles.avatarImg} />
                                                                    ) : (
                                                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                                                            {member.name?.charAt(0).toUpperCase()}
                                                                        </Text>
                                                                    )}
                                                                </View>
                                                                <View style={[styles.onlineIndicator, { backgroundColor: member.isOnline ? '#10B981' : '#4B5563' }]} />
                                                            </View>

                                                            <View style={styles.riderInfo}>
                                                                <Text style={styles.riderName}>{member.name} {member.id === user.id && '(You)'}</Text>
                                                                <Text style={styles.bikeModel}>{member.vehicle || (member.role === 'host' ? 'Trip Leader' : 'Rider')}</Text>
                                                            </View>

                                                            {member.role === 'host' && (
                                                                <FontAwesome5 name="crown" size={14} color="#FFD700" />
                                                            )}
                                                        </View>
                                                    </LinearGradient>
                                                ))
                                            )}
                                        </ScrollView>

                                        {!isReadOnly && (
                                            <View style={[styles.bottomControls, { marginBottom: insets.bottom + 70 }]}>
                                                <TouchableOpacity
                                                    style={[styles.startButton, currentGroup.status === 'active' && { backgroundColor: '#10B981' }]}
                                                    onPress={handleStartRide}
                                                >
                                                    <MaterialIcons name={currentGroup.status === 'active' ? "directions-bike" : "map"} size={24} color="white" />
                                                    <Text style={styles.startButtonText}>
                                                        {currentGroup.status === 'active' ? "JOIN ACTIVE TRACKING" : "OPEN MISSION MAP"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Removing placeholder FAB and Modal as per clean UI requirement */}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1, paddingHorizontal: 20 },
    header: { alignItems: 'center', marginTop: 10, marginBottom: 20 },
    circularLogoContainer: {
        marginBottom: 15,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFD700',
        padding: 4,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    circularLogo: { width: '100%', height: '100%', borderRadius: 46 },
    headerTextContainer: { flexDirection: 'row' },
    headerTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },

    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#161925',
        borderRadius: 16,
        padding: 6,
        marginBottom: 20,
        marginHorizontal: 0,
        borderWidth: 1,
        borderColor: '#374151',
    },
    tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
    activeTab: { backgroundColor: '#FFD700', shadowColor: '#FFD700', shadowOpacity: 0.3, shadowRadius: 5, elevation: 2 },
    tabText: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 14 },
    activeTabText: { color: '#000' },

    contentArea: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingBottom: 150, justifyContent: 'center' },

    hostingContainer: { flex: 1 },
    lobbyContainer: { flex: 1 },

    statusBanner: { paddingVertical: 8, alignItems: 'center', borderRadius: 12, marginBottom: 15 },
    statusBannerText: { color: 'white', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },

    createContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
    createIconBg: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 2, borderColor: '#374151' },
    createTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
    createSubtitle: { color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 30, marginBottom: 40, lineHeight: 24, fontSize: 16 },
    createBtn: { backgroundColor: '#FFD700', paddingHorizontal: 50, paddingVertical: 18, borderRadius: 16 },
    createBtnText: { color: 'black', fontWeight: 'bold', fontSize: 16 },

    accessCard: { borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
    accessHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    accessLabel: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
    routeText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginTop: 4 },
    codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    accessCode: { color: 'white', fontSize: 40, fontWeight: 'bold', letterSpacing: 2 },
    qrSmallBox: { backgroundColor: 'black', padding: 8, borderRadius: 12 },
    statusRow: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { color: '#9CA3AF', fontSize: 12 },

    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    listTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
    manageText: { fontSize: 12, fontWeight: 'bold' },

    ridersList: { flex: 1 },
    riderCard: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1F2937' },
    hostCard: { borderColor: '#FFD70050' },
    hostStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: '#FFD700' },
    riderContent: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    avatarContainer: { marginRight: 15, position: 'relative' },
    regularAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    hostAvatar: { borderWidth: 2, borderColor: '#FFD700' },
    avatarImg: { width: '100%', height: '100%' },
    onlineIndicator: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#161925' },
    riderInfo: { flex: 1 },
    riderName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    bikeModel: { color: '#9CA3AF', fontSize: 12, marginTop: 2 },

    waitingState: { alignItems: 'center', padding: 40 },
    waitingText: { color: '#6B7280', fontSize: 14, fontStyle: 'italic' },

    bottomControls: { marginTop: 10 },
    startButton: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 16, gap: 10 },
    startButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },

    joinCard: { backgroundColor: '#161925', borderRadius: 24, padding: 30, marginBottom: 30, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
    joinTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    joinSubtitle: { color: '#9CA3AF', fontSize: 14, marginBottom: 30, textAlign: 'center' },
    codeInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 30, justifyContent: 'center' },
    codeInput: { width: 45, height: 55, backgroundColor: '#0F111A', borderWidth: 1, borderColor: '#374151', borderRadius: 12, color: 'white', fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
    codeInputFilled: { borderColor: '#FFD700', backgroundColor: '#1F2937' },
    connectButton: { width: '100%', backgroundColor: '#FFD700', paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    connectButtonText: { color: 'black', fontWeight: 'bold', fontSize: 16 },

    scannerContainer: { alignItems: 'center' },
    orText: { color: '#4B5563', fontWeight: 'bold', marginBottom: 20 },
    scanButton: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderWidth: 1, borderColor: 'rgba(6, 182, 212, 0.3)', borderRadius: 16, backgroundColor: 'rgba(6, 182, 212, 0.1)' },
    scanText: { color: '#06B6D4', fontWeight: 'bold', fontSize: 16 },

    scanOverlay: { position: 'absolute', top: 60, left: 0, right: 0, padding: 20, alignItems: 'center' },
    scanInst: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10 },
    closeScanBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 25 },

    toastContainer: { position: 'absolute', top: 10, left: 20, right: 20, zIndex: 100, alignItems: 'center' },
    toastGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 30, gap: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    toastText: { color: 'black', fontWeight: 'bold', fontSize: 13 }
});

export default LobbyScreen;
