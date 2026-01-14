import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

const LobbyScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('HOSTING'); // 'JOIN' or 'HOSTING'
    const [joinCode, setJoinCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);

    const riders = [
        { id: 1, name: 'Alex Rider', bike: 'Ducati Monster 821', isHost: true, avatar: 'helmet-safety' },
        { id: 2, name: 'SarahV', bike: 'Ninja 650', isHost: false, avatar: 'user-circle' },
        { id: 3, name: 'MikeBoxer', bike: 'BMW R1250', isHost: false, avatar: 'user' },
    ];

    const handleCodeChange = (text, index) => {
        const newCode = [...joinCode];
        newCode[index] = text;
        setJoinCode(newCode);

        // Auto-advance
        if (text && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleStartRide = () => {
        // Navigate to Map and theoretically start the ride (handled by logic on Dashboard)
        navigation.navigate('Map', { startRide: true });
    };

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
                        <Text style={[styles.tabText, activeTab === 'HOSTING' && styles.activeTabText]}>HOSTING</Text>
                    </TouchableOpacity>
                </View>

                {/* JOIN RIDE UI */}
                {activeTab === 'JOIN' && (
                    <View>
                        <View style={styles.joinCard}>
                            <Text style={styles.joinTitle}>ENTER ACCESS CODE</Text>
                            <Text style={styles.joinSubtitle}>Ask the host for the 6-character code</Text>

                            <LottieView
                                source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_jcikwtux.json' }} // Connecting/Network
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
                                        keyboardType="ascii-capable"
                                        autoCapitalize="characters"
                                    />
                                ))}
                            </View>

                            <TouchableOpacity style={styles.connectButton}>
                                <Text style={styles.connectButtonText}>CONNECT TO LOBBY</Text>
                                <MaterialIcons name="login" size={20} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.scannerContainer}>
                            <Text style={styles.orText}>OR</Text>
                            <TouchableOpacity style={styles.scanButton}>
                                <MaterialIcons name="qr-code-scanner" size={24} color="#06B6D4" />
                                <Text style={styles.scanText}>SCAN QR CODE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* HOSTING UI */}
                {activeTab === 'HOSTING' && (
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
                                <Text style={styles.accessCode}>RP-9X2</Text>
                                <View style={styles.codeActions}>
                                    <TouchableOpacity style={styles.iconButton}>
                                        <MaterialIcons name="content-copy" size={20} color="#9CA3AF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.iconButton}>
                                        <MaterialIcons name="share" size={20} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.statusRow}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>Lobby is active • Waiting for riders</Text>
                            </View>
                        </LinearGradient>

                        {/* Riders List */}
                        <View style={styles.listHeader}>
                            <Text style={styles.listTitle}>RIDERS <Text style={{ color: '#FFD700' }}>(3)</Text></Text>
                            <TouchableOpacity>
                                <Text style={styles.manageText}>Manage</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.ridersList}>
                            {riders.map((rider) => (
                                <View key={rider.id} style={[styles.riderCard, rider.isHost && styles.hostCard]}>
                                    {/* Host Indicator Stripe */}
                                    {rider.isHost && <View style={styles.hostStripe} />}

                                    <View style={styles.riderContent}>
                                        <View style={styles.avatarContainer}>
                                            {rider.isHost ? (
                                                <View style={styles.hostAvatar}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>My</Text>
                                                </View>
                                            ) : (
                                                <View style={styles.regularAvatar}>
                                                    <Text style={{ color: 'white' }}>{rider.name.substring(0, 4)}</Text>
                                                </View>
                                            )}
                                            {rider.isHost && (
                                                <View style={styles.hostBadge}>
                                                    <Text style={styles.hostBadgeText}>HOST</Text>
                                                </View>
                                            )}
                                            {!rider.isHost && (
                                                <View style={[styles.statusBadge, { backgroundColor: rider.id === 2 ? '#3B82F6' : '#8B5CF6' }]} />
                                            )}
                                        </View>

                                        <View style={styles.riderInfo}>
                                            <Text style={styles.riderName}>{rider.name}</Text>
                                            <Text style={styles.bikeModel}>{rider.bike}</Text>
                                        </View>

                                        {rider.isHost ? (
                                            <FontAwesome5 name="medal" size={16} color="#FFD700" />
                                        ) : (
                                            <TouchableOpacity style={styles.removeButton}>
                                                <MaterialIcons name="close" size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Host Controls */}
                        <Text style={styles.controlsTitle}>HOST CONTROLS</Text>
                        <View style={styles.controlsRow}>
                            <TouchableOpacity style={styles.pauseButton}>
                                <MaterialIcons name="pause" size={24} color="black" />
                                <Text style={styles.pauseButtonText}>PAUSE RIDE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.startButton} onPress={handleStartRide}>
                                <MaterialIcons name="play-arrow" size={24} color="white" />
                                <Text style={styles.startButtonText}>START RIDE</Text>
                            </TouchableOpacity>
                        </View>
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
        backgroundColor: '#FFD700', // Yellow bg for logo like mockup
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
        letterSpacing: -1,
    },
    codeActions: {
        flexDirection: 'row',
        gap: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#374151',
        alignItems: 'center',
        justifyContent: 'center',
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
    hostBadge: {
        position: 'absolute',
        bottom: -6,
        alignSelf: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    hostBadgeText: {
        color: 'black',
        fontSize: 8,
        fontWeight: 'bold',
    },
    statusBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#161925',
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
    removeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
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
        gap: 15,
        marginBottom: 20,
    },
    pauseButton: {
        flex: 1,
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        gap: 8,
    },
    pauseButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 14,
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
    // Styles for Join Mode
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
        width: 45,
        height: 55,
        backgroundColor: '#111827',
        borderWidth: 1,
        borderColor: '#374151',
        borderRadius: 8,
        color: 'white',
        fontSize: 24,
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
});

export default LobbyScreen;
