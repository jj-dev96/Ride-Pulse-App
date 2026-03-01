import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, Animated, PanResponder, StatusBar, Platform, Alert, Image } from 'react-native';
// import MapView, { Marker, UrlTile, Polyline, MAP_TYPES } from 'react-native-maps'; // Removed for OSMWebView
import OSMMapView from '../components/OSMMapView';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import NetInfo from '@react-native-community/netinfo';
import { geocodeAddress, getRoute, getDistance, MAP_TILE_URL, cacheLocation, getCachedLocation, searchPlaces, reverseGeocode } from '../services/MapService';
import { FlatList } from 'react-native';
import { RideService } from '../services/RideService';
import { GroupService } from '../services/GroupService';

const { width, height } = Dimensions.get('window');
const GEOFENCE_RADIUS = 500; // meters

const DashboardScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState('');
    const [startLocationQuery, setStartLocationQuery] = useState('');
    const [useCurrentLocation, setUseCurrentLocation] = useState(true);
    const [manualStartLocation, setManualStartLocation] = useState(null); // { latitude, longitude }
    const [isRideActive, setIsRideActive] = useState(false);
    const [hasArrived, setHasArrived] = useState(false);
    const [isConnected, setIsConnected] = useState(true);
    const [currentLocationName, setCurrentLocationName] = useState("Current Location");

    // Modals
    const [suggestions, setSuggestions] = useState([]);

    const getInitials = (name) => {
        if (!name) return 'RP';
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name) => {
        const colors = ['#FFD700', '#FF8C00', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
        if (!name) return colors[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };
    const [routeSteps, setRouteSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Real Stats
    const [rideDuration, setRideDuration] = useState(0);
    const [rideSpeed, setRideSpeed] = useState(0);
    const [rideDistance, setRideDistance] = useState(0);

    // SOS Logic
    const [sosActive, setSosActive] = useState(false);
    const [sosCountdown, setSosCountdown] = useState(10);
    const [sosTriggered, setSosTriggered] = useState(false); // New state for post-countdown
    const sosTimerRef = useRef(null);
    const [groupData, setGroupData] = useState(null);
    const [joinedMembers, setJoinedMembers] = useState([]);

    // Location State
    const [location, setLocation] = useState(null);
    const [heading, setHeading] = useState(0);
    // Map Reference
    const mapRef = useRef(null); // Now refers to OSMMapView internal logic if we expose it, but for now we drive via props.
    // Actually we don't need mapRef for animateToRegion anymore as the component handles updates via props

    // Connectivity Monitoring
    const locationSubscription = useRef(null);

    // Route State
    const [destination, setDestination] = useState(null);
    const [routeCoords, setRouteCoords] = useState([]);

    // Connectivity Monitoring
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            console.log("Network status:", state.isConnected ? "Online" : "Offline");
            setIsConnected(state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    // Handle Return Trip Params
    useEffect(() => {
        const params = navigation.getState().routes.find(r => r.name === 'Map')?.params;
        if (params?.returnTrip && params?.startCoords && params?.destCoords) {
            setDestination(params.destCoords);
            setManualStartLocation(params.startCoords);
            setUseCurrentLocation(false);
            setSearchQuery(params.destName || "");
            setStartLocationQuery(params.startName || "");

            // Auto calculate route
            (async () => {
                const route = await getRoute(params.startCoords, params.destCoords);
                if (route && route.coordinates) {
                    setRouteCoords(route.coordinates);
                    setRouteSteps(route.steps || []);
                    setRideDistance(route.distance / 1000);
                }
            })();
        }
    }, [navigation.getState()]);

    // Initial Location Setup
    useEffect(() => {
        (async () => {
            try {
                // Try to load cached location first for instant UI
                const cached = await getCachedLocation();
                if (cached) {
                    setLocation(cached);
                }

                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission to access location was denied');
                    return;
                }

                // ... fetch current location logic ...
                let currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                setLocation(currentLocation.coords);
                cacheLocation(currentLocation.coords); // Cache it

                // Get Address Name
                const address = await reverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude);
                if (address && address.shortAddress) {
                    setCurrentLocationName(address.shortAddress);
                }

            } catch (e) {
                console.warn("Location error", e);
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

                const currentSpeedKmh = speed && speed > 0 ? (speed * 3.6).toFixed(0) : 0;
                setRideSpeed(currentSpeedKmh);

                // Update location in Firebase if in a group
                if (groupData?.id) {
                    GroupService.updateMemberLocation(groupData.id, user.id, {
                        latitude,
                        longitude,
                        speed: currentSpeedKmh,
                        heading: newHeading
                    });
                }

                // Cache location periodically
                cacheLocation(newLocation.coords);
            }
        );
    };

    // Sub to group
    useEffect(() => {
        // Find if user is in any active group (Mock: checking if they have a groupId in profile)
        if (user?.groupId) {
            const unsub = GroupService.subscribeToGroup(user.groupId, (data) => {
                setGroupData(data);
                if (data?.members) {
                    setJoinedMembers(data.members);
                }
            });
            return unsub;
        }
    }, [user?.groupId]);

    const handleAddMember = async () => {
        // In real app, open a search or suggest active users
        Alert.prompt("Add Member", "Enter member email/ID", [
            { text: "Cancel" },
            {
                text: "Add",
                onPress: async (val) => {
                    if (groupData?.id) {
                        try {
                            await GroupService.addMember(groupData.id, val);
                            broadcastMessage(`${val} has joined the ride`);
                        } catch (e) { Alert.alert("Error", e.message); }
                    }
                }
            }
        ]);
    };

    const handleRemoveMember = async (memberId, name) => {
        Alert.alert("Remove Member", `Are you sure you want to remove ${name}?`, [
            { text: "No" },
            {
                text: "Yes",
                onPress: async () => {
                    if (groupData?.id) {
                        await GroupService.leaveGroup(groupData.id, memberId);
                        broadcastMessage(`${name} has left the ride`);
                    }
                }
            }
        ]);
    };

    const stopLocationTracking = () => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
    };

    // SOS Functions
    const triggerSOS = () => {
        Alert.alert(
            "Confirm SOS",
            "This will notify all group members of your emergency. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "YES, SEND ALERT",
                    style: "destructive",
                    onPress: () => {
                        setSosActive(true);
                        setSosTriggered(false);
                        setSosCountdown(10);
                        broadcastMessage("Emergency Alert! Need help!");
                    }
                }
            ]
        );
    };

    const cancelSOS = () => {
        setSosActive(false);
        setSosTriggered(false);
        setSosCountdown(10);
        if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    };

    useEffect(() => {
        if (sosActive && !sosTriggered) {
            sosTimerRef.current = setInterval(() => {
                setSosCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(sosTimerRef.current);
                        setSosTriggered(true); // Trigger Red Mode
                        // We do NOT hide overlay here anymore
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
    }, [sosActive, sosTriggered]);

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
            const isProfileComplete = !!user?.profile?.profileCompleted;
            if (!isProfileComplete) {
                Alert.alert(
                    "Profile Incomplete",
                    "Please complete your profile before starting a ride.",
                    [
                        { text: "Later", style: "cancel" },
                        {
                            text: "Complete Now",
                            onPress: () => navigation.navigate('ProfileSetup')
                        }
                    ]
                );
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    useNativeDriver: true,
                }).start();
                return;
            }

            const maxSlide = trackWidth - 55;
            if (gestureState.dx > maxSlide * 0.5) { // Threshold 50%
                // Successful slide
                Animated.timing(slideAnim, {
                    toValue: maxSlide,
                    duration: 100,
                    useNativeDriver: true,
                }).start(() => {
                    setIsRideActive(true);
                    slideAnim.setValue(0);
                });
            } else {
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    useNativeDriver: true,
                }).start();
            }
        },
    }), [trackWidth, isRideActive]);

    const stopRide = async () => {
        // Log ride data before resetting
        if (rideDistance > 0) {
            try {
                const rideData = {
                    name: searchQuery || "Recent Ride",
                    distance: rideDistance,
                    duration: rideDuration,
                    averageSpeed: rideDistance > 0 ? (rideDistance / (rideDuration / 3600)) : 0,
                    maxSpeed: rideSpeed, // This is current speed, should ideally track max during interval
                    startLocation: manualStartLocation || location,
                    endLocation: destination,
                    startName: useCurrentLocation ? currentLocationName : startLocationQuery,
                    endName: searchQuery,
                    rideType: navigation.getState().routes.find(r => r.name === 'Map')?.params?.returnTrip ? 'Return' : 'Outbound'
                };
                await RideService.logRide(user.id, rideData);
                Alert.alert("Ride Completed", `You covered ${rideDistance.toFixed(1)}km!`);
            } catch (error) {
                console.error("Failed to log ride:", error);
            }
        }

        setIsRideActive(false);
        setRouteCoords([]);
        setRouteSteps([]);
        setCurrentStepIndex(0);
        setDestination(null);
        setHasArrived(false);
    };

    const [showMsgModal, setShowMsgModal] = useState(false);
    const shortcuts = [
        "Stopping for fuel", "Brake check", "Take left", "Take right",
        "Slow down", "Speed up", "Emergency stop", "Need help",
        "Regroup", "Reached destination"
    ];

    const broadcastMessage = async (text) => {
        if (!groupData?.id) return;
        try {
            await GroupService.broadcastMessage(groupData.id, {
                senderId: user.id,
                senderName: user.name,
                text,
                timestamp: new Date().toISOString()
            });
            setShowMsgModal(false);
            // Local notification toast logic could go here
        } catch (e) {
            console.error("Broadcast error", e);
        }
    };

    const selectSuggestion = async (item) => {
        setSearchQuery(item.name); // or item.fullAddress
        setSuggestions([]);
        // Trigger search directly with known coords
        const destCoords = { latitude: item.latitude, longitude: item.longitude };
        setDestination(destCoords);

        let startCoords = location;
        if (!useCurrentLocation && manualStartLocation) startCoords = manualStartLocation;

        if (startCoords) {
            const route = await getRoute(startCoords, destCoords);
            if (route && route.coordinates) {
                setRouteCoords(route.coordinates);
                setRouteSteps(route.steps || []);
                setRideDistance(route.distance / 1000);
            }
        }
    };

    const onSearchTextChange = async (text) => {
        setSearchQuery(text);
        if (text.length > 2) {
            const results = await searchPlaces(text);
            setSuggestions(results);
        } else {
            setSuggestions([]);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            // 1. Resolve Start Location
            let startCoords = location;
            if (!useCurrentLocation && startLocationQuery.trim()) {
                const startResult = await geocodeAddress(startLocationQuery);
                if (startResult) {
                    startCoords = { latitude: startResult.latitude, longitude: startResult.longitude };
                    setManualStartLocation(startCoords);
                } else {
                    Alert.alert("Start Location Not Found", "Using current location instead.");
                }
            }

            // 2. Resolve Destination
            const result = await geocodeAddress(searchQuery);
            if (result) {
                const destCoords = { latitude: result.latitude, longitude: result.longitude };
                setDestination(destCoords);

                // 3. Get Route
                if (startCoords) {
                    const route = await getRoute(startCoords, destCoords);
                    if (route && route.coordinates) {
                        setRouteCoords(route.coordinates);
                        setRouteSteps(route.steps || []);
                        setRideDistance(route.distance / 1000);
                    }
                }
            } else {
                Alert.alert("Location not found", "Could not find the entered location.");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Failed to search location.");
        }
    };

    // Toggle handled nicely via input focus/change now
    const resetToCurrentLocation = () => {
        setUseCurrentLocation(true);
        setStartLocationQuery('');
        setManualStartLocation(null);
    };

    const handleStartLocationChange = (text) => {
        setStartLocationQuery(text);
        if (useCurrentLocation) {
            setUseCurrentLocation(false);
        }
    };

    const handleStartLocationFocus = () => {
        if (useCurrentLocation) {
            setStartLocationQuery(''); // Clear "Current Location" text for typing
            setUseCurrentLocation(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <OSMMapView
                style={styles.map}
                location={useCurrentLocation ? location : manualStartLocation || location}
                destination={destination}
                routeCoords={routeCoords}
                isRideActive={isRideActive}
                geofenceRadius={GEOFENCE_RADIUS}
                members={joinedMembers}
            />

            {/* Top-Right Map Info (Req 9) */}
            {groupData && (
                <View style={styles.topRightInfo}>
                    <View style={styles.infoBadge}>
                        <Text style={styles.groupNameText}>{groupData.name || "Live Group"}</Text>
                        <View style={styles.infoSubRow}>
                            <View style={styles.memberCountBox}>
                                <MaterialIcons name="people" size={14} color="#FFD700" />
                                <Text style={styles.memberCountText}>{joinedMembers.length}</Text>
                            </View>
                            <Text style={styles.durationText}>{formatTime(rideDuration)}</Text>
                        </View>
                    </View>
                </View>
            )}

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
                    <View style={styles.searchContainer}>
                        {/* FROM Location Input */}
                        <View style={[styles.inputRow, !useCurrentLocation && { marginBottom: 10 }]}>
                            {/* Icon: Click to reset to current location if manual */}
                            <TouchableOpacity onPress={resetToCurrentLocation} style={styles.iconButton}>
                                <MaterialIcons
                                    name={useCurrentLocation ? "my-location" : "location-on"}
                                    size={20}
                                    color={useCurrentLocation ? "#10B981" : "#F59E0B"}
                                />
                            </TouchableOpacity>

                            <TextInput
                                placeholder={useCurrentLocation ? currentLocationName : "Enter Start Location"}
                                placeholderTextColor="#6B7280"
                                style={[styles.textInput, useCurrentLocation && { color: '#10B981', fontWeight: 'bold' }]}
                                value={useCurrentLocation ? currentLocationName : startLocationQuery}
                                onChangeText={handleStartLocationChange}
                                onFocus={handleStartLocationChange}
                            />

                            {!useCurrentLocation && (
                                <TouchableOpacity onPress={resetToCurrentLocation}>
                                    <MaterialIcons name="close" size={20} color="#6B7280" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* TO Location Input */}
                        <View style={styles.inputRow}>
                            <MaterialIcons name="flag" size={20} color="#EF4444" style={{ marginLeft: 5, marginRight: 5 }} />
                            <TextInput
                                placeholder="Enter Destination"
                                placeholderTextColor="#9CA3AF"
                                style={styles.textInput}
                                value={searchQuery}
                                onChangeText={onSearchTextChange}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                            />
                            <TouchableOpacity onPress={handleSearch} style={{ padding: 5 }}>
                                <MaterialIcons name="search" size={24} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        {/* Suggestions List */}
                        {suggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {suggestions.map((item) => (
                                    <TouchableOpacity key={item.id} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                                        <MaterialIcons name="place" size={16} color="#9CA3AF" style={{ marginRight: 10 }} />
                                        <Text style={styles.suggestionText} numberOfLines={1}>{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
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

                    {/* Navigation Guidance Overlay */}
                    {routeSteps.length > 0 && (
                        <View style={styles.navGuidanceBox}>
                            <MaterialIcons name="turn-right" size={30} color="white" />
                            <View style={{ marginLeft: 15 }}>
                                <Text style={styles.navInstruction}>
                                    {routeSteps[currentStepIndex]?.instruction || "Follow Route"}
                                </Text>
                                <Text style={styles.navDistance}>
                                    {routeSteps[currentStepIndex]?.name || ""}
                                </Text>
                            </View>
                        </View>
                    )}

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
                    <TouchableOpacity
                        style={[styles.fab, styles.emergencyFab, { marginBottom: 20 }]}
                        onPress={triggerSOS}
                    >
                        <MaterialIcons name="report-problem" size={28} color="white" />
                    </TouchableOpacity>
                )}
                {!isRideActive && (
                    <>
                        <TouchableOpacity
                            style={[styles.fab, styles.emergencyFab]}
                            onPress={triggerSOS}
                        >
                            <MaterialIcons name="report-problem" size={28} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fab}>
                            <MaterialIcons name="my-location" size={24} color="#FFD700" onPress={() => {
                                // Logic to re-center would go here, maybe a forceUpdate prop or ref method on OSMMapView
                                // For now, the user location update handles it if they move. 
                                // To implement "recur", we'd simply ensure the next prop update centers it.
                            }} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.fab} onPress={() => setShowMsgModal(true)}>
                            <MaterialIcons name="chat-bubble" size={24} color="#FFD700" />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            {/* Message Modal */}
            {showMsgModal && (
                <View style={styles.msgOverlay}>
                    <View style={styles.msgModal}>
                        <View style={styles.msgHeader}>
                            <Text style={styles.msgTitle}>Quick Messages</Text>
                            <TouchableOpacity onPress={() => setShowMsgModal(false)}>
                                <MaterialIcons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={shortcuts}
                            numColumns={2}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.shortcutBtn} onPress={() => broadcastMessage(item)}>
                                    <Text style={styles.shortcutText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={{ gap: 10 }}
                        />
                    </View>
                </View>
            )}

            {/* Bottom Overlay: Slide to Start (Visible only when NOT riding) */}
            {!isRideActive && (
                <View style={styles.bottomOverlay}>
                    {/* Profile Button */}
                    <TouchableOpacity
                        style={styles.profileButton}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <View style={[
                            styles.profileIconCircle,
                            !user?.profile?.profileImage && { backgroundColor: getAvatarColor(user?.profile?.fullName || user?.name) }
                        ]}>
                            {user?.profile?.profileImage ? (
                                <Image source={{ uri: user.profile.profileImage }} style={styles.dashboardAvatar} />
                            ) : (
                                <Text style={styles.dashboardAvatarText}>
                                    {getInitials(user?.profile?.fullName || user?.name)}
                                </Text>
                            )}
                        </View>
                        {!user?.profile?.profileCompleted && <View style={styles.dashboardWarningDot} />}
                    </TouchableOpacity>

                    {/* Member Control Buttons */}
                    <View style={styles.memberControls}>
                        <TouchableOpacity style={styles.memberBtn} onPress={handleAddMember}>
                            <MaterialIcons name="person-add" size={24} color="#FFD700" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.memberBtn} onPress={() => {
                            if (joinedMembers.length > 1) {
                                // Simple logic: show list to remove
                                Alert.alert("Remove Member", "Select a member to remove", joinedMembers.filter(m => m.id !== user.id).map(m => ({
                                    text: m.name,
                                    onPress: () => handleRemoveMember(m.id, m.name)
                                })).concat([{ text: "Cancel", style: 'cancel' }]));
                            } else {
                                Alert.alert("No members", "No other members to remove.");
                            }
                        }}>
                            <MaterialIcons name="person-remove" size={24} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

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

            {/* SOS Countdown & Emergency Overlay */}
            {sosActive && (
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    topRightInfo: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 100,
    },
    infoBadge: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
        alignItems: 'flex-end',
        minWidth: 120,
    },
    groupNameText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    infoSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        gap: 10,
    },
    memberCountBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    memberCountText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 12,
    },
    durationText: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: 'bold',
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
        bottom: 100, // Adjusted for TabBar
        zIndex: 20,
        justifyContent: 'space-between',
    },
    searchContainer: {
        backgroundColor: 'rgba(22, 25, 37, 0.95)',
        borderRadius: 15,
        padding: 10,
        borderWidth: 1,
        borderColor: '#374151',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 45,
        zIndex: 20,
    },
    suggestionsContainer: {
        backgroundColor: '#1F2937',
        top: 5,
        borderRadius: 10,
        padding: 5,
        maxHeight: 200,
        zIndex: 50, // Ensure it sits on top
        elevation: 10,
    },
    suggestionItem: {
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    suggestionText: {
        color: 'white',
        fontSize: 14,
    },
    navGuidanceBox: {
        position: 'absolute',
        top: 80, // Below top stats
        left: 0,
        right: 0,
        backgroundColor: '#10B981',
        marginHorizontal: 10,
        borderRadius: 15,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: 'black',
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    navInstruction: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    navDistance: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 2,
    },
    iconButton: {
        padding: 5,
    },
    readOnlyInput: {
        flex: 1,
        color: '#10B981',
        marginLeft: 10,
        fontWeight: 'bold',
    },
    textInput: {
        flex: 1,
        color: 'white',
        marginLeft: 10,
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
        bottom: 220, // Moved HIGHER to ensure visibility above slider/tabs
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
        bottom: 110, // Adjusted for TabBar height
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 50,
    },
    profileButton: {
        position: 'relative',
        marginRight: 15,
    },
    profileIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#000',
        overflow: 'hidden'
    },
    dashboardAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    dashboardAvatarText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dashboardWarningDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#0F111A',
        zIndex: 10
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
        backgroundColor: '#111827',
        borderRadius: 30,
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: '#374151',
        // Glow effect
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    sliderHandle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    sliderText: {
        position: 'absolute',
        alignSelf: 'center',
        color: '#6B7280',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 4,
        textTransform: 'uppercase',
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
    },
    // SOS Overlay Styles
    sosOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.85)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
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
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
    { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
    { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

export default DashboardScreen;
