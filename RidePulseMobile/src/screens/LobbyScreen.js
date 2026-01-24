import React, { useState, useRef, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import QRCode from 'react-native-qrcode-svg';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AuthContext } from '../context/AuthContext';
import { GroupService } from '../services/GroupService';

const { width, height } = Dimensions.get('window');

const LobbyScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('JOIN'); // 'JOIN' or 'HOSTING'
    const [joinCode, setJoinCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [currentGroup, setCurrentGroup] = useState(null);

    // Scanner
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

    const handleCodeChange = (text, index) => {
        const newCode = [...joinCode];
        newCode[index] = text.toUpperCase();
        setJoinCode(newCode);

        // Auto-advance
        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }

        // Auto-submit if full
        if (index === 5 && text) {
            const fullCode = newCode.join('');
            // Optional: Auto submit disabled for safety, user clicks Connect
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
            Alert.alert("Error", "Failed to create lobby.");
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
            setActiveTab('HOSTING'); // Switch view to show lobby
        } catch (error) {
            Alert.alert("Error", "Could not join lobby. Check the code.");
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
            setActiveTab('HOSTING');
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
            setActiveTab('JOIN');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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
        <View style={styles.container}>
            <SafeAreaView style={styles.content}>
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
                        onPress={() => setActiveTab('JOIN')}
                    >
                        <Text style={[styles.tabText, activeTab === 'JOIN' && styles.activeTabText]}>JOIN RIDE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'HOSTING' && styles.activeTab]}
                        onPress={() => setActiveTab('HOSTING')}
                    >
                        <Text style={[styles.tabText, activeTab === 'HOSTING' && styles.activeTabText]}>
                            {currentGroup ? 'CURRENT LOBBY' : 'HOST RIDE'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* JOIN RIDE UI */}
                {activeTab === 'JOIN' && (
                    <ScrollView>
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
                                        style={styles.codeInput}
                                        maxLength={1}
                                        value={digit}
                                        onChangeText={(text) => handleCodeChange(text, index)}
                                        keyboardType="ascii-capable" // Force ASCII to avoid rich text issues
                                        autoCapitalize="characters"
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
                    <>
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
                            <>
                                {/* Access Code Card */}
                                <LinearGradient
                                    colors={['#161925', '#111827']}
                                    style={styles.accessCard}
                                >
                                    <View style={styles.accessHeader}>
                                        <Text style={styles.accessLabel}>RIDE ACCESS CODE</Text>
                                        <View style={styles.accessRightDecor} />
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

                                {/* Riders List */}
                                <View style={styles.listHeader}>
                                    <Text style={styles.listTitle}>RIDERS <Text style={{ color: '#FFD700' }}>({currentGroup.members?.length || 0})</Text></Text>
                                    <TouchableOpacity onPress={leaveLobby}>
                                        <Text style={[styles.manageText, { color: '#EF4444' }]}>Leave</Text>
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.ridersList}>
                                    {currentGroup.members && currentGroup.members.map((member) => (
                                        <View key={member.id} style={[styles.riderCard, (member.id === currentGroup.hostId) && styles.hostCard]}>
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
                                        </View>
                                    ))}
                                </ScrollView>

                                {/* Host Controls */}
                                <Text style={styles.controlsTitle}>CONTROLS</Text>
                                <View style={styles.controlsRow}>
                                    <TouchableOpacity style={styles.startButton} onPress={handleStartRide}>
                                        <MaterialIcons name="play-arrow" size={24} color="white" />
                                        <Text style={styles.startButtonText}>OPEN MAP</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </>
                )}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    logoBox: {
        marginBottom: 10,
        backgroundColor: '#FFD700',
        padding: 5,
        borderRadius: 4,
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
        borderRadius: 8,
        padding: 4,
        marginBottom: 25,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#FFD700',
    },
    tabText: {
        color: '#6B7280',
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeTabText: {
        color: 'black',
    },
    // Create UI
    createContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    createIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#1F2937',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#374151',
    },
    createTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    createSubtitle: {
        color: '#9CA3AF',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 30,
        lineHeight: 22,
    },
    createBtn: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 12,
        shadowColor: '#FFD700',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    createBtnText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Lobby Active UI
    accessCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    accessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    accessLabel: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    codeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    accessCode: {
        color: 'white',
        fontSize: 42,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    qrSmallBox: {
        backgroundColor: 'black',
        padding: 5,
        borderRadius: 8,
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
    riderCard: {
        backgroundColor: '#161925',
        borderRadius: 12,
        marginBottom: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#1F2937',
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
        padding: 15,
    },
    avatarContainer: {
        marginRight: 15,
    },
    hostAvatar: {
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    regularAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
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
    },
    controlsTitle: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        marginTop: 10,
        letterSpacing: 1,
    },
    controlsRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    startButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    startButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    // Join Mode Styles
    joinCard: {
        backgroundColor: '#161925',
        borderRadius: 16,
        padding: 30,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#1F2937',
        alignItems: 'center',
    },
    joinTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1,
    },
    joinSubtitle: {
        color: '#9CA3AF',
        fontSize: 12,
        marginBottom: 30,
    },
    codeInputContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 30,
    },
    codeInput: {
        width: 35, // reduced slightly
        height: 50,
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 8,
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    connectButton: {
        width: '100%',
        backgroundColor: '#FFD700',
        paddingVertical: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    connectButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 14,
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
        padding: 15,
        borderWidth: 1,
        borderColor: '#06B6D450',
        borderRadius: 12,
        backgroundColor: '#06B6D410',
    },
    scanText: {
        color: '#06B6D4',
        fontWeight: 'bold',
    },
    // Scanner Overlay
    scanOverlay: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    scanInst: {
        color: 'white',
        fontSize: 18,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 10,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
    },
    closeScanBtn: {
        backgroundColor: 'rgba(255,0,0,0.5)',
        borderRadius: 30,
        padding: 5,
    }
});

export default LobbyScreen;
