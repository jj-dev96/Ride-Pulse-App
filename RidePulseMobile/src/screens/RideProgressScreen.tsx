import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import QuickMessageSheet from '../components/QuickMessageSheet';
import { GroupService } from '../services/GroupService';
import { AuthContext } from '../context/AuthContext';
import MapplsMapView from '../components/MapplsMapView';
import * as Location from 'expo-location';
import { RootStackParamList, GroupData, LocationCoords } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RideProgress'>;

const RideProgressScreen: React.FC<Props> = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [speed, setSpeed] = useState<number>(0);
    const [location, setLocation] = useState<LocationCoords | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const [activeGroup, setActiveGroup] = useState<GroupData | null>(null);
    const [showQuickMessages, setShowQuickMessages] = useState<boolean>(false);
    const [weather] = useState({ temp: 24, condition: 'Sunny', wind: 12 });
    const [isSOSActive, setIsSOSActive] = useState<boolean>(false);
    const [sosCountdown, setSosCountdown] = useState<number>(10);
    const [sosTriggered, setSosTriggered] = useState<boolean>(false);
    const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        let isCancelled = false;
        (async () => {
            if (user?.id) {
                const group = await GroupService.getUserActiveGroup(user.id);
                if (group && !isCancelled) setActiveGroup(group);
            }
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            locationSubscription.current = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.High, timeInterval: 1000, distanceInterval: 1 },
                (newLocation) => {
                    if (isCancelled) return;
                    setLocation(newLocation.coords);
                    setHeading(newLocation.coords.heading ?? 0);
                    const s = newLocation.coords.speed;
                    setSpeed(s && s > 0 ? Math.round(s * 3.6) : 0);
                }
            );
        })();
        return () => {
            isCancelled = true;
            if (locationSubscription.current) locationSubscription.current.remove();
        };
    }, []);

    useEffect(() => {
        if (isSOSActive && !sosTriggered) {
            sosTimerRef.current = setInterval(() => {
                setSosCountdown((prev) => {
                    if (prev <= 1) {
                        if (sosTimerRef.current) clearInterval(sosTimerRef.current);
                        setSosTriggered(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (sosTimerRef.current) clearInterval(sosTimerRef.current);
        }
        return () => { if (sosTimerRef.current) clearInterval(sosTimerRef.current); };
    }, [isSOSActive, sosTriggered]);

    const handleSendQuickMessage = (msg: string): void => {
        if (activeGroup) {
            GroupService.sendMessage(activeGroup.id, {
                id: Date.now().toString(), sender: user?.name || 'Rider',
                text: msg, timestamp: new Date().toISOString()
            });
            Alert.alert("Sent", "Message broadcasted!");
        } else {
            Alert.alert("No Ride", "You must be in a ride group to send messages.");
        }
    };

    const triggerSOS = (): void => {
        Alert.alert(
            "Confirm SOS",
            "This will alert all group members of your emergency. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "YES, SEND ALERT",
                    style: 'destructive',
                    onPress: () => {
                        setIsSOSActive(true);
                        setSosTriggered(false);
                        setSosCountdown(10);
                        if (activeGroup) {
                            GroupService.sendMessage(activeGroup.id, {
                                id: Date.now().toString(), sender: user?.name || 'Rider',
                                text: `Emergency Alert from ${user?.name || 'Rider'}`,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                }
            ]
        );
    };

    const cancelSOS = (): void => {
        setIsSOSActive(false);
        setSosTriggered(false);
        setSosCountdown(10);
        if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    };

    return (
        <View style={styles.container}>
            <MapplsMapView style={StyleSheet.absoluteFill as any} location={location} isRideActive={true} isDarkTheme={true} />
            <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />

            <View style={styles.content}>
                <View style={styles.topBar}>
                    <View style={styles.widget}>
                        <Text style={styles.widgetTitle}>LEADERBOARD</Text>
                        <View style={styles.row}>
                            <Text style={styles.leaderName}><Text style={{ color: '#FFD700' }}>1.</Text> Alex</Text>
                            <Text style={styles.leaderSpeed}>124 km/h</Text>
                        </View>
                    </View>
                    <View style={styles.weatherWidget}>
                        <MaterialIcons name="wb-sunny" size={20} color="#F59E0B" />
                        <View style={{ marginLeft: 8 }}>
                            <Text style={styles.temp}>{weather.temp}°</Text>
                            <Text style={styles.wind}>{weather.wind} km/h Wind</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.bottomSection}>
                    <View style={styles.speedContainer}>
                        <Text style={styles.speedValue}>{speed}</Text>
                        <Text style={styles.speedUnit}>KM/H</Text>
                    </View>
                    <View style={styles.controlsRow}>
                        <TouchableOpacity style={styles.sosButton} onPress={triggerSOS}>
                            <MaterialIcons name="report-problem" size={30} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.endRideBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.endRideText}>END RIDE</Text>
                            <MaterialIcons name="stop" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.chatButton} onPress={() => setShowQuickMessages(true)}>
                            <MaterialIcons name="chat" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {isSOSActive && (
                <View style={[styles.sosOverlay, sosTriggered && styles.sosTriggeredOverlay]}>
                    {!sosTriggered ? (
                        <View style={styles.sosContainer}>
                            <MaterialIcons name="warning" size={60} color="#EF4444" />
                            <Text style={styles.sosTitle}>SENDING SOS</Text>
                            <Text style={styles.sosSubtitle}>Sending emergency alert in</Text>
                            <Text style={styles.sosCountdown}>{sosCountdown}</Text>
                            <TouchableOpacity style={styles.cancelSosButton} onPress={cancelSOS}>
                                <Text style={styles.cancelSosText}>CANCEL</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.emergencyContainer}>
                            <MaterialIcons name="phonelink-ring" size={50} color="white" style={{ marginBottom: 10 }} />
                            <Text style={styles.emergencyTitle}>EMERGENCY MODE ACTIVE</Text>
                            <Text style={styles.emergencySubtitle}>Location broadcasted to all riders</Text>
                            <TouchableOpacity style={styles.safeButton} onLongPress={cancelSOS} delayLongPress={1000}>
                                <Text style={styles.safeButtonText}>HOLD TO MARK SAFE</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <QuickMessageSheet
                visible={showQuickMessages}
                onClose={() => setShowQuickMessages(false)}
                onSelect={handleSendQuickMessage}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    gradient: { ...StyleSheet.absoluteFillObject },
    content: { flex: 1, padding: 20, justifyContent: 'space-between', paddingTop: 50, paddingBottom: 40 },
    topBar: { flexDirection: 'row', justifyContent: 'space-between' },
    widget: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 12, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minWidth: 120 },
    widgetTitle: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', marginBottom: 5 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    leaderName: { color: 'white', fontWeight: 'bold' },
    leaderSpeed: { color: '#10B981', fontWeight: 'bold' },
    weatherWidget: { backgroundColor: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 15, flexDirection: 'row', alignItems: 'center' },
    temp: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    wind: { color: '#9CA3AF', fontSize: 10 },
    bottomSection: { gap: 20 },
    speedContainer: { alignItems: 'center', justifyContent: 'center' },
    speedValue: { fontSize: 100, fontWeight: '900', color: 'white', fontStyle: 'italic', lineHeight: 110 },
    speedUnit: { fontSize: 20, color: '#FFD700', fontWeight: 'bold', letterSpacing: 5, marginTop: -10 },
    controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
    sosButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', elevation: 10 },
    endRideBtn: { flex: 1, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', gap: 10 },
    endRideText: { color: 'white', fontWeight: 'bold', letterSpacing: 1 },
    chatButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    sosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    sosTriggeredOverlay: { backgroundColor: '#EF4444' },
    sosContainer: { alignItems: 'center' },
    sosTitle: { color: 'white', fontSize: 30, fontWeight: 'bold', marginTop: 20 },
    sosSubtitle: { color: '#9CA3AF', fontSize: 14, marginTop: 8 },
    sosCountdown: { fontSize: 120, color: '#EF4444', fontWeight: 'bold', marginVertical: 40 },
    cancelSosButton: { backgroundColor: 'white', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30 },
    cancelSosText: { color: '#EF4444', fontWeight: 'bold', fontSize: 18 },
    emergencyContainer: { alignItems: 'center', padding: 30 },
    emergencyTitle: { color: 'white', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
    emergencySubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' },
    safeButton: { marginTop: 50, backgroundColor: 'white', padding: 20, borderRadius: 40, width: 300, alignItems: 'center' },
    safeButtonText: { color: '#EF4444', fontWeight: 'bold', fontSize: 18 },
});

export default RideProgressScreen;
