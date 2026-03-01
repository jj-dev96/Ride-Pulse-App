import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QuickMessageSheet from '../components/QuickMessageSheet';
import { GroupService } from '../services/GroupService';
import { AuthContext } from '../context/AuthContext';
// let MapView, Marker, UrlTile;
// if (Platform.OS !== 'web') {
//     const Maps = require('react-native-maps');
//     MapView = Maps.default;
//     Marker = Maps.Marker;
//     UrlTile = Maps.UrlTile;
// }

// import { MAP_TILE_URL } from '../services/MapService'; // Not needed directly, handled in component
import OSMMapView from '../components/OSMMapView';

import * as Location from 'expo-location';

const RideProgressScreen = ({ navigation }) => {
    const { user } = React.useContext(AuthContext);
    const [speed, setSpeed] = useState(0);
    const [location, setLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const locationSubscription = useRef(null);

<<<<<<< HEAD
    const [activeGroup, setActiveGroup] = useState(null);
    const [showQuickMessages, setShowQuickMessages] = useState(false);

    // Weather State
    const [weather, setWeather] = useState({ temp: 24, condition: 'Sunny', wind: 12 });

    // Music State
=======
    // Weather & Music
    const [weather] = useState({ temp: 24, condition: 'Sunny', wind: 12 });
>>>>>>> feb14-version
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack] = useState({ title: "Born to be Wild", artist: "Steppenwolf" });

    // SOS Logic
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(10);
    const [sosTriggered, setSosTriggered] = useState(false);
    const sosTimerRef = useRef(null);

    useEffect(() => {
<<<<<<< HEAD
        let isTracking = true;
        (async () => {
            const group = await GroupService.getUserActiveGroup(user?.id);
            if (group) setActiveGroup(group);

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }
=======
        let isCancelled = false;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
>>>>>>> feb14-version

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
<<<<<<< HEAD
                (loc) => {
                    if (!isTracking) return;
                    setLocation(loc.coords);
                    const spd = loc.coords.speed && loc.coords.speed > 0 ? loc.coords.speed * 3.6 : 0;
                    setSpeed(spd.toFixed(0));
                }
            );
        })();
        return () => {
            isTracking = false;
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
=======
                (newLocation) => {
                    if (isCancelled) return;
                    setLocation(newLocation.coords);
                    setHeading(newLocation.coords.heading);

                    // Convert m/s to km/h
                    const s = newLocation.coords.speed;
                    setSpeed(s && s > 0 ? (s * 3.6).toFixed(0) : 0);
                }
            );
        })();

        return () => {
            isCancelled = true;
            if (locationSubscription.current) locationSubscription.current.remove();
>>>>>>> feb14-version
        };
    }, []);

    // SOS Timer Logic
    useEffect(() => {
        if (isSOSActive && !sosTriggered) {
            sosTimerRef.current = setInterval(() => {
                setSosCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(sosTimerRef.current);
                        setSosTriggered(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (sosTimerRef.current) clearInterval(sosTimerRef.current);
        }
        return () => {
            if (sosTimerRef.current) clearInterval(sosTimerRef.current);
        };
    }, [isSOSActive, sosTriggered]);

    const handleSendQuickMessage = (msg) => {
        if (activeGroup) {
            GroupService.sendMessage(activeGroup.id, {
                id: Date.now().toString(),
                sender: user?.name || 'Rider',
                text: msg,
                timestamp: new Date().toISOString()
            });
            Alert.alert("Sent", "Message broadcasted!");
        } else {
            Alert.alert("No Ride", "You must be in a ride group to send messages.");
        }
    };

    const triggerSOS = () => {
        Alert.alert(
<<<<<<< HEAD
            "Confirm SOS",
            "Are you sure you want to trigger SOS to all members in the lobby?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Trigger SOS",
                    style: 'destructive',
=======
            "Emergency SOS",
            "This will alert all nearby riders and emergency services. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "YES, SEND SOS",
                    style: "destructive",
>>>>>>> feb14-version
                    onPress: () => {
                        setIsSOSActive(true);
                        setSosTriggered(false);
                        setSosCountdown(10);
<<<<<<< HEAD
                        if (activeGroup) {
                            GroupService.sendMessage(activeGroup.id, {
                                id: Date.now().toString(),
                                sender: user?.name || 'Rider',
                                text: `Emergency Alert from ${user?.name || 'Rider'}`,
                                timestamp: new Date().toISOString()
                            });
                        }
=======
>>>>>>> feb14-version
                    }
                }
            ]
        );
    };

    const cancelSOS = () => {
        setIsSOSActive(false);
        setSosTriggered(false);
        setSosCountdown(10);
        if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    };

    return (
        <View style={styles.container}>
            <OSMMapView
                style={StyleSheet.absoluteFill}
                location={location}
                isRideActive={true}
            />

            <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']}
                style={styles.gradient}
            />

            <View style={styles.content}>
                {/* Top Widgets */}
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

                {/* Bottom Stats Area */}
                <View style={styles.bottomSection}>
                    {/* Speedometer - Moved to bottom */}
                    <View style={styles.speedContainer}>
                        <Text style={styles.speedValue}>{speed}</Text>
                        <Text style={styles.speedUnit}>KM/H</Text>
                    </View>

                    <View style={styles.controlsRow}>
                        <TouchableOpacity style={styles.sosButton} onPress={triggerSOS}>
                            <MaterialIcons name="report-problem" size={30} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.endRideBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.endRideText}>END RIDE</Text>
                            <MaterialIcons name="stop" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.chatButton}>
                            <MaterialIcons name="chat" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
<<<<<<< HEAD

                {/* Left out Center speed for now, speed moved to bottom */}

                {/* Right Actions */}
                <View className="absolute right-4 bottom-32 items-end space-y-4">
                    <TouchableOpacity
                        onPress={triggerSOS}
                        className={`w-12 h-12 rounded-full items-center justify-center border ${isSOSActive ? 'bg-red-500 border-red-500 animate-pulse' : 'bg-black/60 border-red-500/50'}`}
                    >
                        <MaterialIcons name="warning" size={24} color={isSOSActive ? 'white' : '#EF4444'} />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-12 h-12 bg-black/60 rounded-full items-center justify-center border border-white/20">
                        <MaterialIcons name="my-location" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Bottom Controls / Speedometer Area */}
                <View className="items-center pb-4">
                    <View style={styles.speedometerContainer}>
                        <Text style={styles.speedValue}>{speed}</Text>
                        <Text style={styles.speedUnit}>KM/H</Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-end">
                    <TouchableOpacity className="w-14 h-14 bg-black/60 rounded-full items-center justify-center border border-primary/50 shadow-lg shadow-primary/20">
                        <MaterialIcons name="smart-toy" size={28} color="#FFD700" />
                    </TouchableOpacity>

                    {/* End Ride Button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="flex-1 mx-4 h-14 bg-white/10 rounded-full border border-white/20 items-center justify-center flex-row"
                    >
                        <Text className="text-white font-bold tracking-widest uppercase ml-2">End Ride</Text>
                        <MaterialIcons name="stop" size={24} color="white" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TouchableOpacity className="w-14 h-14 bg-black/60 rounded-full items-center justify-center border border-white/20" onPress={() => setShowQuickMessages(true)}>
                        <MaterialIcons name="chat" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* SOS Overlay */}
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
                                <View style={styles.emergencyHeader}>
                                    <MaterialIcons name="phonelink-ring" size={50} color="white" style={{ marginBottom: 10 }} />
                                    <Text style={styles.emergencyTitle}>EMERGENCY MODE ACTIVE</Text>
                                    <Text style={styles.emergencySubtitle}>Location broadcasted to all riders</Text>
                                </View>

                                <View style={styles.contactsList}>
                                    <Text style={styles.contactsTitle}>EMERGENCY CONTACTS</Text>

                                    <TouchableOpacity style={styles.contactCard}>
                                        <View style={styles.contactAvatar}>
                                            <Text style={styles.contactInitials}>H</Text>
                                        </View>
                                        <View style={styles.contactInfo}>
                                            <Text style={styles.contactName}>Host (Michael)</Text>
                                            <Text style={styles.contactPhone}>+1 555-0192</Text>
                                        </View>
                                        <View style={styles.callButton}>
                                            <MaterialIcons name="call" size={24} color="white" />
                                        </View>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.contactCard}>
                                        <View style={styles.contactAvatar}>
                                            <Text style={styles.contactInitials}>C</Text>
                                        </View>
                                        <View style={styles.contactInfo}>
                                            <Text style={styles.contactName}>Co-Rider (Alex)</Text>
                                            <Text style={styles.contactPhone}>+1 555-0144</Text>
                                        </View>
                                        <View style={styles.callButton}>
                                            <MaterialIcons name="call" size={24} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={styles.safeButton} onLongPress={cancelSOS} delayLongPress={1000}>
                                    <Text style={styles.safeButtonText}>HOLD TO MARK SAFE</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}
            </View>
            <QuickMessageSheet
                visible={showQuickMessages}
                onClose={() => setShowQuickMessages(false)}
                onSelect={handleSendQuickMessage}
            />
=======
            </View>

            {/* SOS Overlay */}
            {isSOSActive && (
                <View style={[styles.sosOverlay, sosTriggered && styles.sosTriggeredOverlay]}>
                    {!sosTriggered ? (
                        <View style={styles.sosContainer}>
                            <MaterialIcons name="warning" size={60} color="#EF4444" />
                            <Text style={styles.sosTitle}>SENDING SOS</Text>
                            <Text style={styles.sosCountdown}>{sosCountdown}</Text>
                            <TouchableOpacity style={styles.cancelSosButton} onPress={cancelSOS}>
                                <Text style={styles.cancelSosText}>CANCEL</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.emergencyContainer}>
                            <Text style={styles.emergencyTitle}>EMERGENCY ACTIVE</Text>
                            <TouchableOpacity style={styles.safeButton} onLongPress={cancelSOS}>
                                <Text style={styles.safeButtonText}>HOLD TO MARK SAFE</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
>>>>>>> feb14-version
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'space-between',
        paddingTop: 50,
        paddingBottom: 40,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    widget: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        minWidth: 120,
    },
    widgetTitle: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    leaderName: {
        color: 'white',
        fontWeight: 'bold',
    },
    leaderSpeed: {
        color: '#10B981',
        fontWeight: 'bold',
    },
    weatherWidget: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
    },
    temp: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    wind: {
        color: '#9CA3AF',
        fontSize: 10,
    },
    bottomSection: {
        gap: 20,
    },
    speedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
<<<<<<< HEAD
    speedometerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    speedValue: {
        color: 'white',
        fontSize: 80,
        fontWeight: 'bold',
        fontStyle: 'italic',
        textShadowColor: 'rgba(16, 185, 129, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    speedUnit: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: -5,
        letterSpacing: 1,
    },
=======
    speedValue: {
        fontSize: 100,
        fontWeight: '900',
        color: 'white',
        fontStyle: 'italic',
        lineHeight: 110,
    },
    speedUnit: {
        fontSize: 20,
        color: '#FFD700',
        fontWeight: 'bold',
        letterSpacing: 5,
        marginTop: -10,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    sosButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
    },
    endRideBtn: {
        flex: 1,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    endRideText: {
        color: 'white',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    chatButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    sosOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    sosTriggeredOverlay: {
        backgroundColor: '#EF4444',
    },
>>>>>>> feb14-version
    sosContainer: {
        alignItems: 'center',
    },
    sosTitle: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
        marginTop: 20,
    },
    sosCountdown: {
        fontSize: 120,
        color: '#EF4444',
        fontWeight: 'bold',
        marginVertical: 40,
    },
    cancelSosButton: {
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 50,
        borderRadius: 30,
    },
    cancelSosText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 18,
    },
    emergencyContainer: {
        alignItems: 'center',
        padding: 30,
    },
    emergencyTitle: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
        textAlign: 'center',
    },
    safeButton: {
        marginTop: 50,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 40,
        width: 300,
        alignItems: 'center',
    },
    safeButtonText: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 18,
    }
});

const mapDarkStyle = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#263c3f" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#6b9a76" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#1f2835" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#515c6d" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#17263c" }]
    }
];

export default RideProgressScreen;
