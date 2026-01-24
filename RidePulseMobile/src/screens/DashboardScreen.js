import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Animated, PanResponder, StatusBar, Platform, Alert } from 'react-native';
import MapView, { Marker, UrlTile, MAP_TYPES } from 'react-native-maps';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import NetInfo from '@react-native-community/netinfo';

const { width, height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRideActive, setIsRideActive] = useState(false);
    const [isConnected, setIsConnected] = useState(true);

    // Real Stats
    const [rideDuration, setRideDuration] = useState(0);
    const [rideSpeed, setRideSpeed] = useState(0);
    const [rideDistance, setRideDistance] = useState(0);

    // Location State
    const [location, setLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    const mapRef = useRef(null);
    const locationSubscription = useRef(null);

    // Connectivity Monitoring
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            console.log("Network status:", state.isConnected ? "Online" : "Offline");
            setIsConnected(state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    // Initial Location Setup
    useEffect(() => {
        (async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission to access location was denied');
                    return;
                }

                let currentLocation;
                try {
                    currentLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                } catch (locError) {
                    console.warn("Dashboard: Location failed, using fallback", locError);
                    // Fallback to San Francisco (or any default)
                    currentLocation = {
                        coords: {
                            latitude: 37.78825,
                            longitude: -122.4324,
                            heading: 0,
                            speed: 0
                        }
                    };
                    Alert.alert("Location Services Unavailable", "Using demo location for now.");
                }

                setLocation(currentLocation.coords);

                // Center map initially
                if (mapRef.current && currentLocation) {
                    mapRef.current.animateToRegion({
                        latitude: currentLocation.coords.latitude,
                        longitude: currentLocation.coords.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }, 1000);
                }
            } catch (e) {
                console.error("Dashboard: Location init fatal error", e);
            }
        })();
    }, []);

    // Ride Timer & Tracking
    useEffect(() => {
        let interval;
        if (isRideActive) {
            // Start Ride: Watch Position
            startLocationTracking();

            interval = setInterval(() => {
                setRideDuration(prev => prev + 1);
            }, 1000);
        } else {
            // Stop Ride
            stopLocationTracking();
            clearInterval(interval);
            setRideDuration(0);
            setRideSpeed(0);
            setRideDistance(0);
        }
        return () => {
            clearInterval(interval);
            stopLocationTracking();
        };
    }, [isRideActive]);

    const startLocationTracking = async () => {
        locationSubscription.current = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 1000,
                distanceInterval: 5,
            },
            (newLocation) => {
                const { latitude, longitude, speed, heading: newHeading } = newLocation.coords;

                setLocation(newLocation.coords);
                setHeading(newHeading);

                // Speed is in m/s, convert to km/h or user pref. using km/h here.
                // speed can be null/negative on emulator
                const currentSpeedKmh = speed && speed > 0 ? (speed * 3.6).toFixed(0) : 0;
                setRideSpeed(currentSpeedKmh);

                // TODO: Calculate real distance logic here (cumulative)

                // Animate Map Camera
                if (mapRef.current) {
                    mapRef.current.animateCamera({
                        center: { latitude, longitude },
                        pitch: 45,
                        heading: newHeading, // Rotate map with user
                        zoom: 17,
                    }, { duration: 1000 });
                }
            }
        );
    };

    const stopLocationTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Slide to Start Animation
    // Track width will be calculated on layout
    const [trackWidth, setTrackWidth] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
            const maxSlide = trackWidth - 55; // Handle width (50) + padding (5)
            if (!isRideActive && gestureState.dx >= 0 && gestureState.dx <= maxSlide) {
                slideAnim.setValue(gestureState.dx);
            }
        },
        onPanResponderRelease: (evt, gestureState) => {
            const maxSlide = trackWidth - 55;
            if (gestureState.dx > maxSlide * 0.5) { // Threshold 50%
                // Successful slide
                Animated.spring(slideAnim, {
                    toValue: maxSlide,
                    useNativeDriver: true,
                }).start(() => {
                    setIsRideActive(true);
                    slideAnim.setValue(0);
                });
            } else {
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
        },
    }), [trackWidth, isRideActive]);

    const stopRide = () => {
        setIsRideActive(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <MapView
                ref={mapRef}
                style={styles.map}
                mapType={Platform.OS === 'android' ? MAP_TYPES.NONE : MAP_TYPES.STANDARD} // NONE for Custom Tiles on Android
                rotateEnabled={true}
                showsUserLocation={false} // We draw our own custom marker
                initialRegion={{
                    latitude: 37.78825, // Default Fallback
                    longitude: -122.4324,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                {/* OpenStreetMap Dark Tiles (CartoDB Dark Matter) */}
                <UrlTile
                    urlTemplate="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                />

                {/* User Marker */}
                {location && (
                    <Marker
                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                        rotation={heading}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={styles.userMarkerContainer}>
                            <View style={[styles.userMarkerOuter, isRideActive && { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                <View style={[styles.userMarkerInner, isRideActive && { backgroundColor: '#10B981', borderColor: 'white' }]}>
                                    <FontAwesome5 name="location-arrow" size={14} color={isRideActive ? "white" : "black"} style={{ transform: [{ rotate: '-45deg' }] }} />
                                </View>
                            </View>
                            {isRideActive && <View style={[styles.userMarkerPulse, { borderColor: '#10B981' }]} />}
                        </View>
                    </Marker>
                )}
            </MapView>

            {/* Offline/Low Connectivity Indicator */}
            {!isConnected && (
                <View style={styles.offlineBanner}>
                    <MaterialIcons name="cloud-off" size={16} color="white" />
                    <Text style={styles.offlineText}>OFFLINE MODE - LOCAL SPEED ONLY</Text>
                </View>
            )}

            {/* Top Overlay: Search Bar (Hidden when riding) */}
            {!isRideActive && (
                <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
                    <View style={styles.searchBar}>
                        <MaterialIcons name="search" size={24} color="#9CA3AF" />
                        <TextInput
                            placeholder="Enter Destination"
                            placeholderTextColor="#9CA3AF"
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <MaterialIcons name="mic" size={24} color="#FFD700" />
                    </View>

                    {/* Live Group Card */}
                    <View style={styles.liveGroupCard}>
                        <View style={styles.liveIndicator}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>LIVE GROUP</Text>
                        </View>
                        <Text style={styles.groupName}>Sunday Canyon Run</Text>
                        <Text style={styles.groupStats}>4 Riders • 12mi left</Text>
                    </View>

                    {/* Radar Overlay Lottie */}
                    <View style={styles.radarContainer}>
                        <LottieView
                            source={{ uri: 'https://assets9.lottiefiles.com/packages/lf20_g3ki3cca.json' }} // Radar Scan
                            autoPlay
                            loop
                            style={{ width: 150, height: 150 }}
                        />
                        <Text style={styles.radarLabel}>RADAR ACTIVE</Text>
                    </View>
                </SafeAreaView>
            )}

            {/* ACTIVE RIDE TELEMETRY OVERLAY */}
            {isRideActive && (
                <SafeAreaView style={styles.rideOverlay} pointerEvents="box-none">
                    {/* Top Stats */}
                    <View style={styles.rideStatsTop}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>DURATION</Text>
                            <Text style={styles.statValueBig}>{formatTime(rideDuration)}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>DISTANCE</Text>
                            <Text style={styles.statValueBig}>{rideDistance.toFixed(1)} <Text style={{ fontSize: 16, color: '#9CA3AF' }}>km</Text></Text>
                        </View>
                    </View>

                    {/* Speedometer (Central) */}
                    <View style={styles.speedometerContainer}>
                        <Text style={styles.speedValue}>{rideSpeed}</Text>
                        <Text style={styles.speedUnit}>KM/H</Text>
                    </View>

                    {/* Stop Button */}
                    <TouchableOpacity
                        style={styles.stopRideButton}
                        onPress={stopRide}
                        activeOpacity={0.8}
                    >
                        <View style={styles.stopIconSquare} />
                        <Text style={styles.stopRideText}>STOP RIDE</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            )}

            {/* Right Side Buttons Layout */}
            <View style={[styles.rightButtons, isRideActive && { bottom: 40 }]}>
                {isRideActive && (
                    <TouchableOpacity style={[styles.fab, styles.emergencyFab, { marginBottom: 20 }]}>
                        <MaterialIcons name="report-problem" size={28} color="white" />
                    </TouchableOpacity>
                )}
                {!isRideActive && (
                    <>
                        <TouchableOpacity style={[styles.fab, styles.emergencyFab]}>
                            <MaterialIcons name="report-problem" size={28} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fab}>
                            <MaterialIcons name="my-location" size={24} color="#FFD700" onPress={() => {
                                if (location && mapRef.current) {
                                    mapRef.current.animateToRegion({
                                        latitude: location.latitude,
                                        longitude: location.longitude,
                                        latitudeDelta: 0.01,
                                        longitudeDelta: 0.01,
                                    })
                                }
                            }} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fab}>
                            <MaterialIcons name="chat-bubble" size={24} color="#FFD700" />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Bottom Overlay: Slide to Start (Visible only when NOT riding) */}
            {!isRideActive && (
                <View style={styles.bottomOverlay}>
                    {/* Profile Button */}
                    <TouchableOpacity style={styles.profileButton}>
                        <View style={styles.profileIconCircle}>
                            <FontAwesome5 name="user-ninja" size={30} color="black" />
                        </View>
                        <View style={styles.profileBadge} />
                    </TouchableOpacity>

                    {/* Slider */}
                    <View
                        style={styles.sliderTrack}
                        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
                    >
                        <Animated.View
                            style={[
                                styles.sliderHandle,
                                { transform: [{ translateX: slideAnim }] }
                            ]}
                            {...panResponder.panHandlers}
                        >
                            <FontAwesome5 name="motorcycle" size={20} color="black" />
                        </Animated.View>
                        <Text style={styles.sliderText}>SLIDE TO START {">>>"}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    topOverlay: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    rideOverlay: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        bottom: 40,
        zIndex: 20,
        justifyContent: 'space-between',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(22, 25, 37, 0.95)',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        borderWidth: 1,
        borderColor: '#374151',
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: 'white',
        fontSize: 16,
    },
    liveGroupCard: {
        backgroundColor: 'rgba(22, 25, 37, 0.95)',
        borderRadius: 15,
        padding: 15,
        width: 200,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#374151',
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    liveDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        marginRight: 6,
    },
    liveText: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    groupName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    groupStats: {
        color: '#9CA3AF',
        fontSize: 12,
        marginTop: 4,
    },
    radarContainer: {
        position: 'absolute',
        top: 80,
        right: 0,
        alignItems: 'center',
    },
    radarCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderWidth: 1,
        borderColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    radarSweep: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        // Sweep animation would go here
    },
    radarDot: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        shadowColor: '#10B981',
        shadowOpacity: 1,
        shadowRadius: 5,
    },
    radarCenter: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'white',
    },
    radarLabel: {
        color: '#10B981',
        fontSize: 8,
        fontWeight: 'bold',
        marginTop: 5,
    },
    rightButtons: {
        position: 'absolute',
        right: 20,
        bottom: 120, // Default when slider is visible
        gap: 15,
        alignItems: 'center',
    },
    fab: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#161925',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#374151',
    },
    emergencyFab: {
        backgroundColor: '#EF4444',
        borderColor: '#EF4444',
        shadowColor: '#EF4444',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 90,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileButton: {
        marginRight: 15,
    },
    profileIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#000',
    },
    profileBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 15,
        height: 15,
        borderRadius: 7.5,
        backgroundColor: '#FFD700',
        borderWidth: 2,
        borderColor: '#0F111A',
    },
    sliderTrack: {
        flex: 1,
        height: 60,
        backgroundColor: 'rgba(22, 25, 37, 0.9)',
        borderRadius: 30,
        justifyContent: 'center',
        paddingHorizontal: 5,
        borderWidth: 1,
        borderColor: '#FFD70033',
    },
    sliderHandle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    sliderText: {
        position: 'absolute',
        alignSelf: 'center',
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    userMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    userMarkerOuter: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userMarkerInner: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'black',
    },
    userMarkerPulse: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#FFD700',
        opacity: 0.3,
    },
    riderMarker: {
        shadowColor: '#00FF00',
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    // New Styles for Active Ride
    rideStatsTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginHorizontal: 10,
    },
    statBox: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        padding: 15,
        minWidth: 120,
    },
    statLabel: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
        marginBottom: 5,
    },
    statValueBig: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    speedometerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -100, // Pull it up a bit
    },
    speedValue: {
        color: 'white',
        fontSize: 120,
        fontWeight: 'bold',
        fontStyle: 'italic',
        textShadowColor: 'rgba(16, 185, 129, 0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    speedUnit: {
        color: '#10B981',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: -10,
        letterSpacing: 1,
    },
    stopRideButton: {
        alignSelf: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#EF4444',
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    stopIconSquare: {
        width: 16,
        height: 16,
        backgroundColor: 'white',
        borderRadius: 2,
        marginRight: 10,
    },
    stopRideText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    offlineBanner: {
        position: 'absolute',
        top: 100,
        alignSelf: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        zIndex: 100,
        gap: 8,
    },
    offlineText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});

export default DashboardScreen;
