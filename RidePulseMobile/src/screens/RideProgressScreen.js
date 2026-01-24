import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Lazy load MapView to prevent Web crash
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

import * as Location from 'expo-location';

const RideProgressScreen = ({ navigation }) => {
    const [speed, setSpeed] = useState(0);
    const [location, setLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const mapRef = useRef(null);
    const locationSubscription = useRef(null);

    // Weather State
    const [weather, setWeather] = useState({ temp: 24, condition: 'Sunny', wind: 12 });

    // Music State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTrack, setCurrentTrack] = useState({ title: "Born to be Wild", artist: "Steppenwolf" });

    const [errorMsg, setErrorMsg] = useState(null);

    // SOS Logic
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(10);
    const [sosTriggered, setSosTriggered] = useState(false); // Triggered state
    const sosTimerRef = useRef(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);
        })();
    }, []);

    // Mock speed fluctuation
    useEffect(() => {
        const interval = setInterval(() => {
            setSpeed(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                return Math.max(0, prev + change); // Prevent negative speed
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // SOS Timer Logic
    useEffect(() => {
        if (isSOSActive && !sosTriggered) {
            sosTimerRef.current = setInterval(() => {
                setSosCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(sosTimerRef.current);
                        setSosTriggered(true); // TRIGGER RED MODE
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
        setIsSOSActive(true);
        setSosTriggered(false);
        setSosCountdown(10);
    };

    const cancelSOS = () => {
        setIsSOSActive(false);
        setSosTriggered(false);
        setSosCountdown(10);
        if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    };

    return (
        <View className="flex-1 bg-black relative">
            {Platform.OS !== 'web' && MapView ? (
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFill}
                    customMapStyle={mapDarkStyle}
                    showsUserLocation={true}
                    followsUserLocation={true}
                    region={location ? {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    } : {
                        latitude: 37.78825,
                        longitude: -122.4324,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    }}
                >
                    {/* Additional Markers can be added here */}
                </MapView>
            ) : (
                <View className="absolute inset-0 bg-gray-900 justify-center items-center">
                    <MaterialIcons name="map" size={80} color="#333" />
                    <Text className="text-gray-500 mt-4 font-bold">MAP VIEW UNAVAILABLE ON WEB</Text>
                    <Text className="text-gray-600 text-xs mt-1">Please use the mobile app for full experience</Text>
                    {errorMsg && <Text className="text-red-500 mt-2">{errorMsg}</Text>}
                </View>
            )}

            {/* Gradient Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                className="absolute inset-0 pointer-events-none"
            />

            {/* HUD Content */}
            <View className="absolute inset-0 z-10 p-4 justify-between pb-12">
                {/* Top Bar with Weather */}
                <View style={styles.topBar}>
                    {/* Leaderboard (Left) */}
                    <View style={styles.leaderboardWidget}>
                        <Text style={styles.widgetTitle}>LEADERBOARD</Text>
                        <View style={styles.leaderboardRow}>
                            <Text style={styles.leaderboardText}><Text style={{ color: '#FFD700' }}>1.</Text> Alex</Text>
                            <Text style={styles.leaderboardVal}>124 km/h</Text>
                        </View>
                        <View style={styles.leaderboardRow}>
                            <Text style={styles.leaderboardText}><Text style={{ color: 'white' }}>2.</Text> You</Text>
                            <Text style={styles.leaderboardVal}>118 km/h</Text>
                        </View>
                    </View>

                    {/* Weather Widget (Center-Right? No, let's put it next to Leaderboard or replace existing Music location if needed. Let's stack them top left/right) */}
                    <View style={styles.weatherWidget}>
                        <View style={{ alignItems: 'center' }}>
                            <MaterialIcons name="wb-sunny" size={20} color="#F59E0B" />
                            <Text style={styles.weatherTemp}>{weather.temp}°</Text>
                        </View>
                        <View style={{ marginLeft: 8 }}>
                            <Text style={styles.weatherCond}>{weather.condition}</Text>
                            <Text style={styles.weatherWind}>{weather.wind} km/h Wind</Text>
                        </View>
                    </View>

                    {/* Interactive Music Player (Right) */}
                    <View style={styles.musicWidget}>
                        <View style={styles.musicIconBox}>
                            <MaterialIcons name="music-note" size={16} color="#FFD700" />
                        </View>
                        <View style={styles.musicInfo}>
                            <Text style={styles.musicTitle} numberOfLines={1}>{currentTrack.title}</Text>
                            <Text style={styles.musicArtist}>{currentTrack.artist}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} style={styles.playBtn}>
                            <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Center Speed */}
                <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center">
                    <Text className="text-8xl font-black text-white italic tracking-tighter" style={{ textShadowColor: 'rgba(255, 215, 0, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                        {speed}
                    </Text>
                    <Text className="text-primary text-xl font-bold uppercase tracking-[0.4em] -mt-2">km/h</Text>
                </View>

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

                {/* Bottom Controls */}
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

                    <TouchableOpacity className="w-14 h-14 bg-black/60 rounded-full items-center justify-center border border-white/20">
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
        </View>
    );
};

const styles = StyleSheet.create({
    sosOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Styles for Top Bar widgets
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginTop: 40, // Reduced top margin
        paddingHorizontal: 10,
    },
    leaderboardWidget: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 10,
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
    },
    widgetTitle: {
        color: '#6B7280',
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 4,
        letterSpacing: 1,
    },
    leaderboardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: 100,
        marginBottom: 2,
    },
    leaderboardText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    leaderboardVal: {
        color: '#10B981', // primary green or similar
        fontSize: 12,
        fontWeight: 'bold',
    },
    weatherWidget: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
    },
    weatherTemp: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    weatherCond: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    weatherWind: {
        color: '#9CA3AF',
        fontSize: 8,
    },
    musicWidget: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderRadius: 30,
        padding: 5,
        paddingRight: 15, // extra for play button
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        maxWidth: 160,
    },
    musicIconBox: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    musicInfo: {
        flex: 1,
        marginRight: 8,
    },
    musicTitle: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    musicArtist: {
        color: '#9CA3AF',
        fontSize: 8,
    },
    playBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sosContainer: {
        width: '80%',
        backgroundColor: '#1F2937',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#EF4444',
    },
    sosTitle: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        letterSpacing: 1,
    },
    sosSubtitle: {
        color: '#9CA3AF',
        fontSize: 16,
        marginTop: 5,
        marginBottom: 20,
    },
    sosCountdown: {
        fontSize: 80,
        fontWeight: 'bold',
        color: '#EF4444',
        marginBottom: 30,
    },
    cancelSosButton: {
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
    },
    cancelSosText: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    // Trigged State
    sosTriggeredOverlay: {
        backgroundColor: '#EF4444', // Red background
    },
    emergencyContainer: {
        flex: 1,
        width: '100%',
        padding: 20,
        alignItems: 'center',
        paddingTop: 80,
    },
    emergencyHeader: {
        alignItems: 'center',
        marginBottom: 40,
    },
    emergencyTitle: {
        color: 'white',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 1,
        textAlign: 'center',
    },
    emergencySubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        marginTop: 10,
    },
    contactsList: {
        width: '100%',
        gap: 15,
        marginBottom: 40,
    },
    contactsTitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1,
    },
    contactCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    contactAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    contactInitials: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 18,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    contactPhone: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    safeButton: {
        marginTop: 'auto',
        marginBottom: 30,
        backgroundColor: 'white',
        paddingVertical: 18,
        width: '100%',
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: 'black',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    safeButtonText: {
        color: '#EF4444',
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: 1,
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
    // ... existing styles, minimized for brevity, you should probably keep the full styles if possible but for this response I'll assume they persist or I'll re-include if I want to be safe.
    // Actually, it's better to keep the map styles as they were.
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
