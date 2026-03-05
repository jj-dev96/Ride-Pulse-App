import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Dimensions, Animated, PanResponder, StatusBar, Platform,
    Alert, ToastAndroid, Modal, ActivityIndicator
} from 'react-native';
import MapplsMapView from '../components/MapplsMapView';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import NetInfo from '@react-native-community/netinfo';
import {
    geocodeAddress, getRoute, getDistance, cacheLocation,
    getCachedLocation, searchPlaces, reverseGeocode
} from '../services/MapService';
import QuickMessageSheet from '../components/QuickMessageSheet';
import MemberControlSheet from '../components/MemberControlSheet';
import { RideService } from '../services/RideService';
import { GroupService } from '../services/GroupService';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { RootStackParamList, MainTabParamList, LocationCoords, GroupData, GroupMember, PlaceSuggestion, RideData } from '../types';

const { width, height } = Dimensions.get('window');
const GEOFENCE_RADIUS = 500;

type Props = CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'Map'>,
    NativeStackScreenProps<RootStackParamList>
>;

const showToast = (msg: string): void => {
    if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
        Alert.alert(msg);
    }
};

const DashboardScreen: React.FC<Props> = ({ navigation }) => {
    const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
    const { user } = useContext(AuthContext);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [startLocationQuery, setStartLocationQuery] = useState<string>('');
    const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
    const [manualStartLocation, setManualStartLocation] = useState<LocationCoords | null>(null);
    const [isRideActive, setIsRideActive] = useState<boolean>(false);
    const [hasArrived, setHasArrived] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const [currentLocationName, setCurrentLocationName] = useState<string>("Current Location");
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const [travelMode] = useState<'drive'>('drive');
    const [estimatedDistance, setEstimatedDistance] = useState<string>('');
    const [estimatedDuration, setEstimatedDuration] = useState<string>('');

    const getInitials = (name: string | undefined): string => {
        if (!name || name === 'UNDEFINED') return 'RP';
        const parts = name.trim().split(' ');
        if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string | undefined): string => {
        const colors = ['#FFD700', '#FF8C00', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
        if (!name) return colors[0];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const [routeSteps, setRouteSteps] = useState<any[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [rideDuration, setRideDuration] = useState<number>(0);
    const [rideSpeed, setRideSpeed] = useState<number | string>(0);
    const [rideDistance, setRideDistance] = useState<number>(0);

    const [sosActive, setSosActive] = useState<boolean>(false);
    const [sosCountdown, setSosCountdown] = useState<number>(10);
    const [sosTriggered, setSosTriggered] = useState<boolean>(false);
    const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [groupData, setGroupData] = useState<GroupData | null>(null);
    const [joinedMembers, setJoinedMembers] = useState<GroupMember[]>([]);

    const [location, setLocation] = useState<LocationCoords | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const mapRef = useRef(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const headingSubscription = useRef<Location.LocationSubscription | null>(null);
    const [destination, setDestination] = useState<LocationCoords | null>(null);
    const [routeCoords, setRouteCoords] = useState<LocationCoords[]>([]);
    const [activeGroup, setActiveGroup] = useState<GroupData | null>(null);
    const unsubscribeGroup = useRef<(() => void) | null>(null);
    const [showQuickMessages, setShowQuickMessages] = useState<boolean>(false);
    const [showMemberControl, setShowMemberControl] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [activeMessage, setActiveMessage] = useState<any>(null);
    const messageFade = useRef(new Animated.Value(0)).current;
    const [routeArray, setRouteArray] = useState<LocationCoords[]>([]);
    const [activeInput, setActiveInput] = useState<'start' | 'dest' | null>(null);
    const [rideStartTime, setRideStartTime] = useState<string>('');
    const [isRecentering, setIsRecentering] = useState<boolean>(false);

    // Message Listener for Floating Cards
    useEffect(() => {
        if (!activeGroup?.id) return;
        const messagesRef = collection(db, 'rides', activeGroup.id, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
        const unsubscribeMsg = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    // Show all messages (including ours) for feedback
                    const msgTime = new Date(data.timestamp).getTime();
                    if (Date.now() - msgTime < 5000) {
                        showFloatingMessage(data);
                    }
                }
            });
        });
        return () => unsubscribeMsg();
    }, [activeGroup?.id]);

    const showFloatingMessage = (msg: any) => {
        setActiveMessage(msg);
        Animated.timing(messageFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        setTimeout(() => {
            Animated.timing(messageFade, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
                setActiveMessage(null);
            });
        }, 10000);
    };

    // Sync active group
    useEffect(() => {
        if (!user) return;
        (async () => {
            const group = await GroupService.getUserActiveGroup(user.id);
            if (group) {
                unsubscribeGroup.current = GroupService.subscribeToGroup(group.id, (data: GroupData) => {
                    setActiveGroup(data);
                });
            }
        })();
        return () => { if (unsubscribeGroup.current) unsubscribeGroup.current(); };
    }, [user]);

    const handleSendQuickMessage = (msg: string): void => {
        if (activeGroup) {
            GroupService.sendMessage(activeGroup.id, {
                id: Date.now().toString(),
                senderId: user?.id || '',
                sender: user?.name || 'Rider',
                text: msg,
                timestamp: new Date().toISOString()
            }).catch(() => showToast("Failed to send message"));
            showToast("Message sent to group");
        } else {
            showToast("You must be in a ride group to send messages.");
        }
    };

    // Connectivity Monitoring
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected ?? true);
        });
        return () => unsubscribe();
    }, []);

    // Handle Return Trip Params
    useEffect(() => {
        const params = navigation.getState().routes.find(r => r.name === 'Map')?.params as any;
        if (params?.returnTrip && params?.startCoords && params?.destCoords) {
            setDestination(params.destCoords);
            setManualStartLocation(params.startCoords);
            setUseCurrentLocation(false);
            setSearchQuery(params.destName || "");
            setStartLocationQuery(params.startName || "");
            (async () => {
                const route = await getRoute(params.startCoords, params.destCoords, travelMode);
                if (route?.coordinates) {
                    setRouteCoords(route.coordinates);
                    setRouteSteps(route.steps || []);
                    setRideDistance(route.distance / 1000);
                    // Update estimates
                    const km = (route.distance / 1000).toFixed(1);
                    const mins = Math.ceil(route.duration / 60);
                    setEstimatedDistance(`${km} km`);
                    setEstimatedDuration(`${mins} min`);
                }
            })();
        }
    }, [navigation.getState(), travelMode]);

    const lastReverseGeocodeRef = useRef<number>(0);

    const recenterMap = async (): Promise<void> => {
        try {
            setIsRecentering(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Permission to access location was denied');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            const coords = currentLocation.coords;
            setLocation(coords);

            if (mapRef.current) {
                (mapRef.current as any).animateToRegion({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            }

            // Reverse geocode with a simple rate limit (only once every 2 seconds)
            const now = Date.now();
            if (now - lastReverseGeocodeRef.current > 2000) {
                lastReverseGeocodeRef.current = now;
                try {
                    const locName = await reverseGeocode(coords.latitude, coords.longitude);
                    if (locName?.shortAddress) {
                        setCurrentLocationName(locName.shortAddress);
                    }
                } catch { /* non-critical */ }
            }
        } catch (e) {
            console.warn("Recenter error", e);
            showToast('Failed to get current location');
        } finally {
            setIsRecentering(false);
        }
    };

    // Initial Location Setup
    useEffect(() => {
        recenterMap();
    }, []);

    // Ride Timer & Tracking
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isRideActive) {
            setRideStartTime(new Date().toISOString());
            startLocationTracking();
            interval = setInterval(() => {
                setRideDuration(prev => prev + 1);
            }, 1000);
        } else {
            stopLocationTracking();
            setRideDuration(0);
            setRideSpeed(0);
            setRideDistance(0);
            setRouteArray([]);
        }
        return () => {
            if (interval) clearInterval(interval);
            stopLocationTracking();
            stopHeadingTracking();
        };
    }, [isRideActive]);

    const startLocationTracking = async (): Promise<void> => {
        // Start Position Tracking
        locationSubscription.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 5 },
            (newLocation) => {
                const { latitude, longitude, speed, heading: gpsHeading } = newLocation.coords;
                const newCoords = { latitude, longitude };

                setLocation(newLocation.coords);
                // If compass heading isn't available, fallback to GPS heading
                setHeading(prev => prev || gpsHeading || 0);

                const currentSpeedKmh = speed && speed > 0 ? Math.round(speed * 3.6) : 0;
                setRideSpeed(currentSpeedKmh);

                if (isRideActive) {
                    // Update tracked route and distance
                    setRouteArray(prev => {
                        if (prev.length > 0) {
                            const last = prev[prev.length - 1];
                            const dist = getDistance(last, newCoords);
                            setRideDistance(d => d + (dist / 1000));
                        }
                        return [...prev, newCoords];
                    });
                }

                if (activeGroup?.id) {
                    GroupService.updateMemberLocation(activeGroup.id, user?.id || '', {
                        latitude, longitude, speed: currentSpeedKmh, heading: gpsHeading ?? 0
                    });
                }
                cacheLocation(newLocation.coords);
            }
        );

        // Start Heading (Compass) Tracking
        try {
            headingSubscription.current = await Location.watchHeadingAsync((h) => {
                setHeading(h.trueHeading !== -1 ? h.trueHeading : h.magHeading);
            });
        } catch (e) {
            console.warn("Compass start error", e);
        }
    };

    // Sub to group
    useEffect(() => {
        if (user?.groupId) {
            const unsub = GroupService.subscribeToGroup(user.groupId, (data: GroupData) => {
                setGroupData(data);
                if (data?.members) setJoinedMembers(data.members);
            });
            return unsub;
        }
    }, [user?.groupId]);

    const stopLocationTracking = (): void => {
        if (locationSubscription.current) {
            locationSubscription.current.remove();
            locationSubscription.current = null;
        }
    };

    const stopHeadingTracking = (): void => {
        if (headingSubscription.current) {
            headingSubscription.current.remove();
            headingSubscription.current = null;
        }
    };

    // SOS Functions
    const triggerSOS = async (): Promise<void> => {
        Alert.alert(
            "Confirm SOS",
            "Are you sure you want to trigger an SOS? All group members will be notified.",
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Trigger SOS',
                    style: 'destructive',
                    onPress: async () => {
                        setSosActive(true);
                        setSosTriggered(false);
                        setSosCountdown(10);

                        try {
                            const currentLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                            if (activeGroup) {
                                // Add to alerts subcollection
                                await addDoc(collection(db, "rides", activeGroup.id, "alerts"), {
                                    riderId: user?.id,
                                    riderName: user?.name,
                                    location: currentLoc.coords,
                                    rideId: activeGroup.id,
                                    createdAt: serverTimestamp(),
                                    type: "SOS"
                                });

                                await GroupService.broadcastMessage(activeGroup.id, {
                                    senderId: user?.id || '',
                                    senderName: user?.name || '',
                                    text: `🆘 SOS EMERGENCY ALERT: ${user?.name} needs help!`,
                                    timestamp: new Date().toISOString()
                                });
                                showToast('SOS sent to group!');
                            }
                        } catch (e) {
                            console.error("SOS Trigger Error", e);
                            showToast('Failed to trigger SOS alert');
                        }
                    }
                }
            ]
        );
    };

    const cancelSOS = (): void => {
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
    }, [sosActive, sosTriggered]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Slide to Start Animation
    const [trackWidth, setTrackWidth] = useState<number>(0);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (evt, gestureState) => {
            const maxSlide = trackWidth - 55;
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
                        { text: "Complete Now", onPress: () => navigation.navigate('ProfileSetup') }
                    ]
                );
                Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
                return;
            }
            const maxSlide = trackWidth - 55;
            if (gestureState.dx > maxSlide * 0.5) {
                Animated.timing(slideAnim, { toValue: maxSlide, duration: 100, useNativeDriver: true }).start(() => {
                    setIsRideActive(true);
                    slideAnim.setValue(0);
                });
            } else {
                Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
            }
        },
    }), [trackWidth, isRideActive]);

    const stopRide = async (): Promise<void> => {
        const endTime = new Date().toISOString();
        if (rideDistance > 0) {
            try {
                const avgSpeed = rideDuration > 0 ? (rideDistance / (rideDuration / 3600)) : 0;
                const rideData: RideData = {
                    name: searchQuery || "Recent Ride",
                    distance: rideDistance,
                    totalDistance: rideDistance,
                    duration: rideDuration,
                    totalTime: rideDuration,
                    averageSpeed: Math.round(avgSpeed * 10) / 10,
                    maxSpeed: Number(rideSpeed),
                    startLocation: manualStartLocation || location,
                    endLocation: destination,
                    startName: useCurrentLocation ? currentLocationName : startLocationQuery,
                    endName: searchQuery,
                    polyline: routeArray,
                    startedAt: rideStartTime,
                    endedAt: endTime,
                    rideType: (navigation.getState().routes.find(r => r.name === 'Map')?.params as any)?.returnTrip ? 'Return' : 'Outbound'
                };
                if (user?.id) await RideService.logRide(user.id, rideData);
                Alert.alert(
                    "Ride Completed",
                    `Distance: ${rideDistance.toFixed(1)} km\nDuration: ${formatTime(rideDuration)}\nAvg Speed: ${avgSpeed.toFixed(1)} km/h`
                );
            } catch (error) {
                console.error("Failed to log ride:", error);
                showToast('Ride data saved locally, sync failed');
            }
        }
        setIsRideActive(false);
        setRouteCoords([]);
        setRouteSteps([]);
        setCurrentStepIndex(0);
        setDestination(null);
        setHasArrived(false);
    };

    const broadcastMessage = async (text: string): Promise<void> => {
        if (!groupData?.id) return;
        try {
            await GroupService.broadcastMessage(groupData.id, {
                senderId: user?.id || '',
                senderName: user?.name || '',
                text,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error("Broadcast error", e);
        }
    };

    const selectSuggestion = async (item: PlaceSuggestion): Promise<void> => {
        setSuggestions([]);
        const coords: LocationCoords = { latitude: item.latitude, longitude: item.longitude };

        if (activeInput === 'start') {
            setStartLocationQuery(item.name);
            setManualStartLocation(coords);
            setUseCurrentLocation(false);
            if (destination) {
                calculateDirectRoute(coords, destination);
            }
        } else {
            setSearchQuery(item.name);
            setDestination(coords);
            let start = location;
            if (!useCurrentLocation && manualStartLocation) start = manualStartLocation;
            if (start) {
                calculateDirectRoute(start, coords);
            }
        }
    };

    const calculateDirectRoute = async (start: LocationCoords, end: LocationCoords) => {
        setLoading(true);
        try {
            const route = await getRoute(start, end, travelMode);
            if (route?.coordinates) {
                setRouteCoords(route.coordinates);
                setRouteSteps(route.steps || []);
                setRideDistance(route.distance / 1000);
                const km = (route.distance / 1000).toFixed(1);
                const mins = Math.ceil(route.duration / 60);
                setEstimatedDistance(`${km} km`);
                setEstimatedDuration(`${mins} min`);
            }
        } catch (err) {
            console.warn('Route error:', err);
            showToast('Could not fetch route');
        } finally {
            setLoading(false);
        }
    };

    // ── Debounced Search Logic ───────────────────────────────────────────────
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onSearchTextChange = (text: string, type: 'start' | 'dest'): void => {
        if (type === 'start') {
            setStartLocationQuery(text);
            setUseCurrentLocation(false);
            setActiveInput('start');
        } else {
            setSearchQuery(text);
            setActiveInput('dest');
        }

        // Clear existing timer
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        if (text.trim().length > 2) {
            // Set a new timer
            searchTimerRef.current = setTimeout(async () => {
                try {
                    const results = await searchPlaces(text);
                    setSuggestions(results);
                } catch (err) {
                    console.warn('[Dashboard] Debounced search error:', err);
                }
            }, 600); // 600ms debounce
        } else {
            setSuggestions([]);
        }
    };

    const handleSearch = async (): Promise<void> => {
        if (!searchQuery.trim()) return;
        setLoading(true);
        try {
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
            const result = await geocodeAddress(searchQuery);
            if (result) {
                const destCoords: LocationCoords = { latitude: result.latitude, longitude: result.longitude };
                setDestination(destCoords);
                if (startCoords) {
                    const route = await getRoute(startCoords, destCoords, travelMode);
                    if (route?.coordinates) {
                        setRouteCoords(route.coordinates);
                        setRouteSteps(route.steps || []);
                        setRideDistance(route.distance / 1000);

                        // Update estimates
                        const km = (route.distance / 1000).toFixed(1);
                        const mins = Math.ceil(route.duration / 60);
                        setEstimatedDistance(`${km} km`);
                        setEstimatedDuration(`${mins} min`);
                    }
                } else {
                    showToast('Waiting for GPS fix...');
                }
            } else {
                Alert.alert("Location not found", "Could not find the entered location.");
            }
        } catch (err) {
            Alert.alert("Error", "Failed to search location.");
        } finally {
            setLoading(false);
        }
    };

    const resetToCurrentLocation = (): void => {
        setUseCurrentLocation(true);
        setStartLocationQuery('');
        setManualStartLocation(null);
    };

    const handleStartLocationChange = (text: string): void => {
        setStartLocationQuery(text);
        if (useCurrentLocation) setUseCurrentLocation(false);
    };

    const handleStartLocationFocus = (): void => {
        setActiveInput('start');
        if (useCurrentLocation) {
            setStartLocationQuery('');
            setUseCurrentLocation(false);
        }
    };

    // Re-calculate route when mode changes
    useEffect(() => {
        if (destination && !isRideActive) {
            handleSearch();
        }
    }, [travelMode]);

    const getIconForInstruction = (instruction?: string): any => {
        if (!instruction) return 'navigation';
        const low = instruction.toLowerCase();
        if (low.includes('left')) return 'turn-left';
        if (low.includes('right')) return 'turn-right';
        if (low.includes('roundabout')) return 'roundabout-right';
        if (low.includes('straight')) return 'straight';
        return 'navigation';
    };

    return (
        <View style={[styles.container, !isDarkTheme && styles.containerLight]}>
            <StatusBar barStyle={isDarkTheme ? 'light-content' : 'dark-content'} />

            {/* 1. Main Map Layer */}
            <MapplsMapView
                style={styles.map}
                location={useCurrentLocation ? location : manualStartLocation || location}
                userLocation={location}
                userHeading={heading}
                destination={destination}
                routeCoords={routeCoords}
                isRideActive={isRideActive}
                geofenceRadius={GEOFENCE_RADIUS}
                members={joinedMembers}
                isDarkTheme={isDarkTheme}
            />

            {/* Offline/No Connection Banner */}
            {!isConnected && (
                <View style={styles.offlineBanner}>
                    <MaterialIcons name="signal-wifi-off" size={16} color="white" />
                    <Text style={styles.offlineText}>OFFLINE MODE - LOCAL SPEED ONLY</Text>
                </View>
            )}

            {/* 2. Top UI Overlay (Search & Group Info) */}
            {!isRideActive && (
                <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
                    <View style={styles.searchContainer}>
                        {/* Source Input */}
                        <View style={styles.inputRow}>
                            <TouchableOpacity onPress={() => setUseCurrentLocation(!useCurrentLocation)}>
                                <MaterialIcons
                                    name={useCurrentLocation ? "my-location" : "location-searching"}
                                    size={20}
                                    color={useCurrentLocation ? "#3B82F6" : "#9CA3AF"}
                                    style={{ marginRight: 10 }}
                                />
                            </TouchableOpacity>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Starting point?"
                                placeholderTextColor="#9CA3AF"
                                value={useCurrentLocation ? "My Location" : startLocationQuery}
                                onChangeText={(t) => onSearchTextChange(t, 'start')}
                                onFocus={handleStartLocationFocus}
                            />
                            {!useCurrentLocation && (
                                <TouchableOpacity onPress={() => setUseCurrentLocation(true)} style={styles.gpsResetBtn}>
                                    <MaterialIcons name="gps-fixed" size={18} color="#3B82F6" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.inputDivider} />

                        {/* Destination Input */}
                        <View style={styles.inputRow}>
                            <MaterialIcons name="place" size={20} color="#FFD700" style={{ marginRight: 10 }} />
                            <TextInput
                                style={styles.textInput}
                                placeholder="Where to ride?"
                                placeholderTextColor="#9CA3AF"
                                value={searchQuery}
                                onChangeText={(t) => onSearchTextChange(t, 'dest')}
                                onFocus={() => setActiveInput('dest')}
                            />
                            {loading && <ActivityIndicator size="small" color="#FFD700" style={{ marginHorizontal: 5 }} />}
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <MaterialIcons name="close" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Search Suggestions List */}
                        {suggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                {suggestions.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.suggestionItem}
                                        onPress={() => selectSuggestion(item)}
                                    >
                                        <MaterialIcons name="location-on" size={18} color="#FFD700" style={{ marginRight: 10 }} />
                                        <Text style={styles.suggestionText} numberOfLines={1}>{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Group Status (Top Right) */}
                    {activeGroup && (
                        <View style={styles.topRightInfo}>
                            <View style={styles.infoBadge}>
                                <Text style={styles.groupNameText}>{activeGroup.name}</Text>
                                <View style={styles.infoSubRow}>
                                    <View style={styles.memberCountBox}>
                                        <MaterialIcons name="people" size={12} color="#FFD700" />
                                        <Text style={styles.memberCountText}>{activeGroup.members?.length || 1}</Text>
                                    </View>
                                    <Text style={styles.durationText}>{Math.floor(rideDuration / 60)}m</Text>
                                </View>
                            </View>
                        </View>
                    )}



                    {destination && estimatedDistance !== '' && (
                        <View style={styles.routeSummaryPill}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>TIME</Text>
                                <Text style={styles.summaryValue}>{estimatedDuration}</Text>
                            </View>
                            <View style={[styles.summaryItem, { borderLeftWidth: 1, borderLeftColor: '#37415120' }]}>
                                <Text style={styles.summaryLabel}>DIST</Text>
                                <Text style={styles.summaryValue}>{estimatedDistance}</Text>
                            </View>
                        </View>
                    )}
                </SafeAreaView>
            )}

            {/* 3. Active Ride HUD Overlay */}
            {isRideActive && (
                <SafeAreaView style={styles.rideOverlay} pointerEvents="box-none">
                    <View style={styles.rideStatsTop}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>DURATION</Text>
                            <Text style={styles.statValueBig}>{formatTime(rideDuration)}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>DISTANCE</Text>
                            <Text style={styles.statValueBig}>{rideDistance.toFixed(1)} km</Text>
                        </View>
                    </View>

                    <View style={styles.speedometerContainer}>
                        <View style={styles.speedometerRing}>
                            <Text style={styles.speedValue}>{rideSpeed}</Text>
                            <Text style={styles.speedUnit}>KM/H</Text>
                        </View>
                    </View>

                    <View style={styles.bottomRideControls}>
                        {routeSteps && routeSteps.length > 0 && (
                            <View style={styles.navGuidanceBox}>
                                <MaterialIcons
                                    name={getIconForInstruction(routeSteps[currentStepIndex]?.instruction)}
                                    size={36}
                                    color="white"
                                />
                                <View style={{ marginLeft: 15, flex: 1 }}>
                                    <Text style={styles.navInstruction}>
                                        {routeSteps[currentStepIndex]?.instruction || "Follow Route"}
                                    </Text>
                                    <Text style={styles.navDistance}>{routeSteps[currentStepIndex]?.name || ""}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.rideActionRow}>
                            <TouchableOpacity style={styles.stopRideButton} onPress={stopRide} activeOpacity={0.8}>
                                <View style={styles.stopIconSquare} />
                                <Text style={styles.stopRideText}>FINISH RIDE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.rideQuickMessageBtn} onPress={() => setShowQuickMessages(true)}>
                                <MaterialIcons name="chat" size={24} color="white" />
                                <Text style={styles.rideQuickMessageText}>MSG</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            )}

            {/* 4. Team Chat Broadcasts */}
            {activeMessage && (
                <Animated.View style={[styles.floatingMessageCard, { opacity: messageFade }]}>
                    <View style={styles.messageIcon}>
                        <MaterialIcons name="chat" size={20} color="black" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.messageSender}>{activeMessage.senderName || 'Rider'}</Text>
                        <Text style={styles.messageText} numberOfLines={2}>{activeMessage.text}</Text>
                    </View>
                </Animated.View>
            )}

            {/* 5. Main Action FABs */}
            <View style={[styles.rightButtons, isRideActive && { bottom: 280 }]}>
                <TouchableOpacity style={[styles.fab, styles.emergencyFab]} onPress={triggerSOS}>
                    <MaterialIcons name="report-problem" size={28} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fab} onPress={recenterMap} disabled={isRecentering}>
                    {isRecentering ? <ActivityIndicator size="small" color="#FFD700" /> : <MaterialIcons name="my-location" size={24} color="#FFD700" />}
                </TouchableOpacity>

                {/* Only show chat FAB when NOT in a ride (it moved to HUD) */}
                {!isRideActive && (
                    <TouchableOpacity style={styles.fab} onPress={() => setShowQuickMessages(true)}>
                        <MaterialIcons name="chat" size={24} color="#FFD700" />
                    </TouchableOpacity>
                )}

                {activeGroup && (
                    <TouchableOpacity style={styles.fab} onPress={() => setShowMemberControl(true)}>
                        <MaterialIcons name="people" size={24} color="#FFD700" />
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.fab, !isDarkTheme && styles.fabLight]} onPress={() => setIsDarkTheme(!isDarkTheme)}>
                    <MaterialIcons name={isDarkTheme ? "wb-sunny" : "nights-stay"} size={22} color={isDarkTheme ? "#FFD700" : "#0F172A"} />
                </TouchableOpacity>
            </View>

            {/* 6. Slide-to-Start Control */}
            {!isRideActive && (
                <View style={styles.bottomBar}>
                    <View
                        style={styles.slideTrack}
                        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                        {...panResponder.panHandlers}
                    >
                        <Animated.View style={[styles.slideThumb, { transform: [{ translateX: slideAnim }] }]}>
                            <MaterialIcons name="play-arrow" size={28} color="black" />
                        </Animated.View>
                        <Text style={styles.slideText}>SLIDE TO START BICYCLE RIDE</Text>
                    </View>
                </View>
            )}

            {/* 7. Emergency Modals */}
            {sosActive && (
                <View style={[styles.sosOverlay, sosTriggered && { backgroundColor: '#EF4444' }]}>
                    {!sosTriggered ? (
                        <View style={styles.sosInner}>
                            <MaterialIcons name="warning" size={80} color="#EF4444" />
                            <Text style={styles.sosTitle}>EMERGENCY ALERT</Text>
                            <Text style={sosCountdown < 4 ? { fontSize: 140, color: 'white' } : styles.sosCountdown}>{sosCountdown}</Text>
                            <TouchableOpacity style={styles.cancelSosButton} onPress={cancelSOS}>
                                <Text style={styles.cancelSosText}>CANCEL</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.sosInner}>
                            <MaterialIcons name="error" size={100} color="white" />
                            <Text style={styles.sosTriggeredText}>SOS BROADCASTED!</Text>
                            <Text style={styles.sosTriggeredSub}>Emergency signal sent to all riders in your group.</Text>
                            <TouchableOpacity style={[styles.cancelSosButton, { backgroundColor: 'white', marginTop: 40 }]} onPress={cancelSOS}>
                                <Text style={[styles.cancelSosText, { color: '#EF4444' }]}>I AM SAFE (MARK OK)</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* 8. Utility Modals */}
            <QuickMessageSheet
                visible={showQuickMessages}
                onClose={() => setShowQuickMessages(false)}
                onSelect={handleSendQuickMessage}
            />

            {activeGroup && (
                <MemberControlSheet
                    visible={showMemberControl}
                    onClose={() => setShowMemberControl(false)}
                    groupId={activeGroup.id}
                    userId={user?.id || ''}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F111A' },
    containerLight: { backgroundColor: '#f0f4f8' },
    map: { ...StyleSheet.absoluteFillObject },

    inputDivider: { height: 1, backgroundColor: '#374151', marginVertical: 8, marginHorizontal: 10, opacity: 0.5 },
    gpsResetBtn: { padding: 4, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 6 },

    topOverlay: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, pointerEvents: 'box-none' },
    searchContainer: { margin: 15, backgroundColor: 'rgba(15,17,26,0.95)', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: '#1F2937' },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
    textInput: { flex: 1, color: 'white', fontSize: 14, fontWeight: '500' },
    suggestionsContainer: { backgroundColor: '#161925', borderRadius: 10, marginTop: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#374151' },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
    suggestionText: { color: 'white', flex: 1, fontSize: 13 },

    topRightInfo: { position: 'absolute', top: 120, right: 15, zIndex: 10 },
    infoBadge: { backgroundColor: 'rgba(15,17,26,0.9)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#FFD70030' },
    groupNameText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },
    infoSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10 },
    memberCountBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    memberCountText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },
    durationText: { color: '#9CA3AF', fontSize: 11 },

    offlineBanner: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8, zIndex: 50 },
    offlineText: { color: 'white', fontSize: 12, fontWeight: 'bold' },



    routeSummaryPill: { flexDirection: 'row', backgroundColor: '#FFD700', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center', marginTop: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    summaryItem: { paddingHorizontal: 15, alignItems: 'center' },
    summaryLabel: { color: 'black', fontSize: 9, fontWeight: '900', opacity: 0.6 },
    summaryValue: { color: 'black', fontSize: 14, fontWeight: 'bold' },

    rideOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, pointerEvents: 'box-none', justifyContent: 'space-between', paddingHorizontal: 20 },
    rideStatsTop: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    statBox: { backgroundColor: 'rgba(15,17,26,0.9)', borderRadius: 16, padding: 15, alignItems: 'center', minWidth: 130, borderWidth: 1, borderColor: '#1F2937' },
    statLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
    statValueBig: { color: 'white', fontSize: 24, fontWeight: 'bold' },

    speedometerContainer: { position: 'absolute', bottom: 200, alignSelf: 'center', zIndex: 5 },
    speedometerRing: { width: 150, height: 150, borderRadius: 75, borderWidth: 4, borderColor: '#FFD70040', backgroundColor: 'rgba(15,17,26,0.8)', alignItems: 'center', justifyContent: 'center' },
    speedValue: { color: 'white', fontSize: 56, fontWeight: 'bold', fontStyle: 'italic' },
    speedUnit: { color: '#FFD700', fontSize: 14, fontWeight: '900', letterSpacing: 3, marginTop: -5 },

    navGuidanceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,17,26,0.95)', borderRadius: 16, padding: 18, marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    navInstruction: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    navDistance: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },

    bottomRideControls: { width: '100%', paddingRight: 75, marginBottom: 80 },
    rideActionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    stopRideButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', borderRadius: 18, padding: 18, elevation: 8 },
    rideQuickMessageBtn: { width: 75, height: 60, backgroundColor: '#1F2937', borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151', elevation: 8 },
    rideQuickMessageText: { color: 'white', fontSize: 10, fontWeight: '900', marginTop: 2 },
    stopIconSquare: { width: 14, height: 14, backgroundColor: 'white', borderRadius: 2, marginRight: 12 },
    stopRideText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 2 },

    rightButtons: { position: 'absolute', right: 15, bottom: 180, gap: 12, alignItems: 'center', zIndex: 100 },
    fab: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(22,25,37,0.95)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151', elevation: 8 },
    fabLight: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#cbd5e1' },
    emergencyFab: { backgroundColor: '#7F1D1D', borderColor: '#EF4444' },

    bottomBar: { position: 'absolute', bottom: 70, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: 'rgba(15,17,26,0.9)', borderTopWidth: 1, borderTopColor: '#1F2937' },
    slideTrack: { height: 64, borderRadius: 32, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#FFD70050', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    slideThumb: { position: 'absolute', left: 4, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', elevation: 6 },
    slideText: { color: '#9CA3AF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

    sosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    sosInner: { alignItems: 'center', paddingHorizontal: 40 },
    sosTitle: { color: 'white', fontSize: 26, fontWeight: '900', marginTop: 20, letterSpacing: 1 },
    sosCountdown: { fontSize: 120, color: '#EF4444', fontWeight: 'bold', marginVertical: 30 },
    cancelSosButton: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 18, paddingHorizontal: 60, borderRadius: 35, borderWidth: 1, borderColor: 'white' },
    cancelSosText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    sosTriggeredText: { color: 'white', fontSize: 38, fontWeight: '900', marginTop: 20, letterSpacing: 1 },
    sosTriggeredSub: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },

    floatingMessageCard: { position: 'absolute', top: 100, left: 20, right: 20, backgroundColor: '#FFD700', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', elevation: 12, zIndex: 2000 },
    messageIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    messageSender: { color: 'black', fontWeight: 'bold', fontSize: 12, opacity: 0.6, textTransform: 'uppercase' },
    messageText: { color: 'black', fontWeight: '900', fontSize: 17, marginTop: 2 },
});

export default DashboardScreen;
