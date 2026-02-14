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
    const [scanning, setScanning] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    const inputRefs = useRef([]);

    // Listen to group updates
    useEffect(() => {
        let unsubscribe;
        if (currentGroup && currentGroup.id) {
            unsubscribe = GroupService.subscribeToGroup(currentGroup.id, (data) => {
                if (data) {
                    setCurrentGroup(data);
                } else {
                    // Group deleted or lost
                    if (currentGroup) {
                        Alert.alert("Group Closed", "This lobby has been closed.");
                        setCurrentGroup(null);
                    }
                }
            });
        }
        return () => unsubscribe && unsubscribe();
    }, [currentGroup?.id]);

    const handleSwitchTab = (tab) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
    };

    const handleCodeChange = (text, index) => {
        const newCode = [...joinCode];
        newCode[index] = text.toUpperCase();
        setJoinCode(newCode);

        // Auto-advance
        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }

        // Auto-submit if full (optional, can be dangerous if user types wrong)
        if (index === 5 && text) {
            // optional auto-submit logic
        }
    };

    const handleKeyPress = ({ nativeEvent }, index) => {
        if (nativeEvent.key === 'Backspace') {
            // If current is empty, move back
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
            const id = await GroupService.createGroup(user);
            // Group listener will allow us to see the group instantly, 
            // but we set a temp state to switch UI immediately
            setCurrentGroup({ id, members: [user], hostId: user.id });
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
            handleSwitchTab('HOSTING'); // Switch view to show lobby
        } catch (error) {
            Alert.alert("Error", "Could not join lobby: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartRide = () => {
        // Just navigate to dashboard for now
        navigation.navigate('Map', { startRide: true, groupId: currentGroup?.id });
    };

    const onBarCodeScanned = ({ data }) => {
        setScanning(false);
        // Fill code
        if (data && data.length === 6) {
            const chars = data.split('');
            setJoinCode(chars);
            Alert.alert("Code Found", `Join Lobby ${data}?`, [
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
            Alert.alert("Error", "Could not join lobby.");
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

    const leaveLobby = async () => {
        if (!currentGroup) return;
        setLoading(true);
        try {
            await GroupService.leaveGroup(currentGroup.id, user.id);
            setCurrentGroup(null);
            setJoinCode(['', '', '', '', '', '']);
            handleSwitchTab('JOIN');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!currentGroup?.id) return;
        try {
            await Share.share({
                message: `Join my ride on RidePulse! Use access code: ${currentGroup.id}`,
            });
        } catch (error) {
            Alert.alert(error.message);
        }
    };

    // --- Render Helpers ---

    if (scanning) {
        return (
            <View style={{ flex: 1, backgroundColor: 'black' }}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    onBarcodeScanned={onBarCodeScanned}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                />
                <View style={styles.scanOverlay}>
                    <Text style={styles.scanInst}>Scan a RidePulse QR Code</Text>
                    <TouchableOpacity style={styles.closeScanBtn} onPress={() => setScanning(false)}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={['#0F111A', '#161925', '#111827']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.keyboardView}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    {/* Header Logo */}
                    <View style={styles.header}>
                        <View style={styles.logoBox}>
                            <Image
                                source={require('../../assets/logo-main.png')}
                                style={styles.logoImage}
                                resizeMode="contain"
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
                        >
                            <Text style={[styles.tabText, activeTab === 'JOIN' && styles.activeTabText]}>JOIN RIDE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'HOSTING' && styles.activeTab]}
                            onPress={() => handleSwitchTab('HOSTING')}
                        >
                            <Text style={[styles.tabText, activeTab === 'HOSTING' && styles.activeTabText]}>
                                {currentGroup ? 'CURRENT LOBBY' : 'HOST RIDE'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Content Area */}
                    <View style={styles.contentArea}>
                        {/* JOIN RIDE UI */}
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

                        {/* HOSTING / LOBBY UI */}
                        {activeTab === 'HOSTING' && (
                            <View style={styles.hostingContainer}>
                                {!currentGroup ? (
                                    <View style={styles.createContainer}>
                                        <View style={styles.createIconBg}>
                                            <FontAwesome5 name="road" size={40} color="#FFD700" />
                                        </View>
                                        <Text style={styles.createTitle}>No Active Lobby</Text>
                                        <Text style={styles.createSubtitle}>Create a new ride group and invite friends to track each other.</Text>

                                        <TouchableOpacity
                                            style={styles.createBtn}
                                            onPress={handleCreateLobby}
                                            disabled={loading}
                                        >
                                            {loading ? <ActivityIndicator color="black" /> : (
                                                <Text style={styles.createBtnText}>CREATE NEW LOBBY</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.lobbyContainer}>
                                        {/* Access Code Card - Fixed Top */}
                                        <LinearGradient
                                            colors={['#1F2937', '#111827']}
                                            style={styles.accessCard}
                                        >
                                            <View style={styles.accessHeader}>
                                                <Text style={styles.accessLabel}>RIDE ACCESS CODE</Text>
                                                <TouchableOpacity onPress={handleShare}>
                                                    <MaterialIcons name="share" size={24} color="#9CA3AF" />
                                                </TouchableOpacity>
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
                                                <View style={styles.statusDot} />
                                                <Text style={styles.statusText}>Lobby is active • Waiting for riders</Text>
                                            </View>
                                        </LinearGradient>

                                        {/* Riders List Header */}
                                        <View style={styles.listHeader}>
                                            <Text style={styles.listTitle}>RIDERS <Text style={{ color: '#FFD700' }}>({currentGroup.members?.length || 0})</Text></Text>
                                            <TouchableOpacity onPress={leaveLobby}>
                                                <Text style={[styles.manageText, { color: '#EF4444' }]}>Leave</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Scrollable List */}
                                        <ScrollView
                                            style={styles.ridersList}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={{ paddingBottom: 20 }}
                                        >
                                            {currentGroup.members && currentGroup.members.map((member) => (
                                                <LinearGradient
                                                    key={member.id}
                                                    colors={['#1F2937', '#161925']}
                                                    style={[styles.riderCard, (member.id === currentGroup.hostId) && styles.hostCard]}
                                                >
                                                    {/* Host Indicator Stripe */}
                                                    {(member.id === currentGroup.hostId) && <View style={styles.hostStripe} />}

                                                    <View style={styles.riderContent}>
                                                        <View style={styles.avatarContainer}>
                                                            <View style={[styles.regularAvatar, (member.id === currentGroup.hostId) && styles.hostAvatar]}>
                                                                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                                                    {member.name ? member.name.charAt(0).toUpperCase() : '?'}
                                                                </Text>
                                                            </View>
                                                        </View>

                                                        <View style={styles.riderInfo}>
                                                            <Text style={styles.riderName}>{member.name || 'Unknown'}</Text>
                                                            <Text style={styles.bikeModel}>{member.id === user?.id ? 'You' : 'Rider'}</Text>
                                                        </View>

                                                        {(member.id === currentGroup.hostId) && (
                                                            <FontAwesome5 name="medal" size={16} color="#FFD700" />
                                                        )}
                                                    </View>
                                                </LinearGradient>
                                            ))}
                                            {/* Spacer for bottom controls */}
                                            <View style={{ height: 20 }} />
                                        </ScrollView>

                                        {/* Fixed Bottom Controls */}
                                        <View style={[styles.bottomControls, { marginBottom: insets.bottom + 70 }]}>
                                            <Text style={styles.controlsTitle}>CONTROLS</Text>
                                            <View style={styles.controlsRow}>
                                                <TouchableOpacity style={styles.startButton} onPress={handleStartRide}>
                                                    <MaterialIcons name="play-arrow" size={24} color="white" />
                                                    <Text style={styles.startButtonText}>OPEN MAP</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Host Ride Modal */}
            <Modal visible={showHostModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>CREATE RIDE EVENT</Text>
                                <TouchableOpacity onPress={() => setShowHostModal(false)}>
                                    <MaterialIcons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>EVENT NAME</Text>
                            <TextInput style={styles.input} placeholder="e.g. Sunday Morning Run" placeholderTextColor="#4B5563" />

                            <Text style={styles.label}>ROUTE / DESTINATION</Text>
                            <TextInput style={styles.input} placeholder="Select on Map..." placeholderTextColor="#4B5563" />

                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.label}>DATE</Text>
                                    <View style={styles.dateBox}><Text style={{ color: 'white' }}>Today</Text></View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>TIME</Text>
                                    <View style={styles.dateBox}><Text style={{ color: 'white' }}>Now</Text></View>
                                </View>
                            </View>

                            <Text style={styles.label}>DIFFICULTY</Text>
                            <View style={styles.diffRow}>
                                <TouchableOpacity style={[styles.diffChip, { backgroundColor: '#10B981' }]}><Text style={styles.diffText}>Chill</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.diffChip, { borderColor: '#F59E0B', borderWidth: 1 }]}><Text style={[styles.diffText, { color: '#F59E0B' }]}>Sport</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.diffChip, { borderColor: '#EF4444', borderWidth: 1 }]}><Text style={[styles.diffText, { color: '#EF4444' }]}>Race</Text></TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.createEventBtn} onPress={() => setShowHostModal(false)}>
                                <Text style={styles.createBtnText}>PUBLISH EVENT</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Floating Action Button for Events */}
            {activeTab === 'HOSTING' && (
                <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 90 }]} onPress={() => setShowHostModal(true)}>
                    <MaterialIcons name="add" size={30} color="black" />
                </TouchableOpacity>
            )}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    logoBox: {
        marginBottom: 10,
        backgroundColor: '#FFD700',
        padding: 5,
        borderRadius: 4,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    logoImage: {
        width: 80,
        height: 80,
    },
    headerTextContainer: {
        flexDirection: 'row',
    },
    headerTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#161925',
        borderRadius: 16,
        padding: 6,
        marginBottom: 20,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: '#374151',
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 12,
    },
    activeTab: {
        backgroundColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 2,
    },
    tabText: {
        color: '#9CA3AF',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 0.5,
    },
    activeTabText: {
        color: '#000',
    },
    contentArea: {
        flex: 1,
        paddingHorizontal: 20,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 150,
        justifyContent: 'center', // Center content vertically
    },
    hostingContainer: {
        flex: 1,
    },
    lobbyContainer: {
        flex: 1,
    },
    // Create UI
    createContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 80,
    },
    createIconBg: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#374151',
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
    },
    createTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    createSubtitle: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 30,
        marginBottom: 40,
        lineHeight: 24,
        fontSize: 16,
    },
    createBtn: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 50,
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#FFD700',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    createEventBtn: {
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
    },
    createBtnText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Lobby Active UI
    accessCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#374151',
        shadowColor: 'black',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    accessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    accessLabel: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    accessCode: {
        color: 'white',
        fontSize: 48,
        fontWeight: 'bold',
        letterSpacing: 4,
        textShadowColor: 'rgba(255, 215, 0, 0.3)',
        textShadowRadius: 10,
    },
    qrSmallBox: {
        backgroundColor: 'black',
        padding: 8,
        borderRadius: 12,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 8,
        shadowColor: '#10B981',
        shadowOpacity: 1,
        shadowRadius: 5,
    },
    statusText: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    listTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    manageText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    ridersList: {
        flex: 1,
    },
    bottomControls: {
        marginTop: 10,
    },
    riderCard: {
        borderRadius: 16,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#374151',
    },
    hostCard: {
        borderColor: '#FFD700',
        borderWidth: 1,
    },
    hostStripe: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        backgroundColor: '#FFD700',
    },
    riderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    avatarContainer: {
        marginRight: 15,
    },
    hostAvatar: {
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    regularAvatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#374151',
        alignItems: 'center',
        justifyContent: 'center',
    },
    riderInfo: {
        flex: 1,
    },
    riderName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    bikeModel: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 2,
    },
    controlsTitle: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1,
    },
    controlsRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    startButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        gap: 8,
        shadowColor: '#EF4444',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    startButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    // Join Mode Styles
    joinCard: {
        backgroundColor: '#161925',
        borderRadius: 24,
        padding: 30,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#374151',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    joinTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1,
    },
    joinSubtitle: {
        color: '#9CA3AF',
        fontSize: 14,
        marginBottom: 30,
        textAlign: 'center',
    },
    codeInputContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 30,
        width: '100%',
        justifyContent: 'center',
    },
    codeInput: {
        width: 45,
        height: 55,
        backgroundColor: '#0F111A',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 12,
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    codeInputFilled: {
        borderColor: '#FFD700',
        backgroundColor: '#1F2937',
    },
    connectButton: {
        width: '100%',
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: '#FFD700',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    connectButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    scannerContainer: {
        alignItems: 'center',
    },
    orText: {
        color: '#4B5563',
        fontWeight: 'bold',
        marginBottom: 20,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(6, 182, 212, 0.3)',
        borderRadius: 16,
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
    },
    scanText: {
        color: '#06B6D4',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Scan Overlay
    scanOverlay: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        padding: 20,
        alignItems: 'center'
    },
    scanInst: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10
    },
    closeScanBtn: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        borderRadius: 25
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1F2937',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    label: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 12,
        padding: 16,
        color: 'white',
        fontSize: 16,
    },
    row: {
        flexDirection: 'row',
    },
    dateBox: {
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    diffRow: {
        flexDirection: 'row',
        gap: 10,
    },
    diffChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111827',
    },
    diffText: {
        color: 'white',
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFD700',
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
});

export default LobbyScreen;
