import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Lazy load MapView... Remvoing native map imports
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
    const [speed, setSpeed] = useState(0);
    const [location, setLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const locationSubscription = useRef(null);

    // Weather & Music
    const [weather] = useState({ temp: 24, condition: 'Sunny', wind: 12 });
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack] = useState({ title: "Born to be Wild", artist: "Steppenwolf" });

    // SOS Logic
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(10);
    const [sosTriggered, setSosTriggered] = useState(false);
    const sosTimerRef = useRef(null);

    useEffect(() => {
        let isCancelled = false;
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            locationSubscription.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1000,
                    distanceInterval: 1,
                },
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

    const triggerSOS = () => {
        Alert.alert(
            "Emergency SOS",
            "This will alert all nearby riders and emergency services. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "YES, SEND SOS",
                    style: "destructive",
                    onPress: () => {
                        setIsSOSActive(true);
                        setSosTriggered(false);
                        setSosCountdown(10);
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
