import React, { useState, useContext, useRef, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Dimensions, Animated, PanResponder, StatusBar, Platform,
    Alert, ToastAndroid, Modal, ActivityIndicator, FlatList, KeyboardAvoidingView, ScrollView
} from 'react-native';
import MapboxMapView from '../components/MapView';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';
import { RideMessage } from '../services/RideChatService';
import LottieView from 'lottie-react-native';
import NetInfo from '@react-native-community/netinfo';
import {
    geocodeAddress, getRoute, getDistance, cacheLocation,
    getCachedLocation, searchPlaces, reverseGeocode
} from '../services/mapService';
import { subscribeToNearbyDrivers, DriverLocation } from '../services/rideMatchingService';
import { LocationService, LocationUpdate } from '../services/locationService';
import QuickMessageSheet from '../components/QuickMessageSheet';
import MemberControlSheet from '../components/MemberControlSheet';
import { RideService } from '../services/RideService';
import { GroupService } from '../services/GroupService';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import SearchBar from '../components/SearchBar';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { RootStackParamList, MainTabParamList, LocationCoords, GroupData, GroupMember, PlaceSuggestion, RideData, GroupSOSAlert } from '../types';
import { RideSessionManager } from '../services/RideSessionManager';
import { RideLocationSync } from '../services/RideLocationSync';
import { FormationService, RiderFormation } from '../services/FormationService';
import { RideChatService } from '../services/RideChatService';
import { SOSAlertService } from '../services/SOSAlertService';
import { LeaderRouteService } from '../services/LeaderRouteService';
import { RideMarkersRenderer } from '../components/RideMarkersRenderer';
import { GroupFormationPanel } from '../components/GroupFormationPanel';
import { GroupChatOverlay } from '../components/GroupChatOverlay';
import { GroupSOSAlert as GroupSOSAlertCard } from '../components/GroupSOSAlert';

const { width, height } = Dimensions.get('window');
const GEOFENCE_RADIUS = 500;

type Props = CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, 'Map'>,
    NativeStackScreenProps<RootStackParamList>
>;

// Toast helper removed from global scope to use component-level floating messages


const DashboardScreen: React.FC<Props> = ({ navigation, route }) => {
    const [isDarkTheme, setIsDarkTheme] = useState<boolean>(true);
    const [hasManuallyToggled, setHasManuallyToggled] = useState<boolean>(false);
    const { user } = useContext(AuthContext);

    // ── Auto-Theme Logic ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!hasManuallyToggled) {
            const hour = new Date().getHours();
            const isNight = hour < 6 || hour >= 18; // Night between 6 PM and 6 AM
            setIsDarkTheme(isNight);
        }
    }, [hasManuallyToggled]);

    const toggleTheme = () => {
        setIsDarkTheme(!isDarkTheme);
        setHasManuallyToggled(true);
    };

    const showToast = (msg: string): void => {
        showFloatingMessage({
            senderName: 'SYSTEM',
            text: msg,
            timestamp: new Date().toISOString()
        });
    };
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [startLocationQuery, setStartLocationQuery] = useState<string>('');
    const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(true);
    const [manualStartLocation, setManualStartLocation] = useState<LocationCoords | null>(null);
    const [isRideActive, setIsRideActive] = useState<boolean>(false);
    const isRideActiveRef = useRef<boolean>(false); // Ref to avoid stale closure in GPS callback
    const [hasArrived, setHasArrived] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(true);
    const [currentLocationName, setCurrentLocationName] = useState<string>("Current Location");
    const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
    const quickMsgs = ["Stopping for fuel", "Brake check", "Slow down", "Speed up", "Need help", "Regroup"];
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
    // Unified group state - only verified groups allowed
    const [activeGroup, setActiveGroup] = useState<GroupData | null>(null);
    const [joinedMembers, setJoinedMembers] = useState<GroupMember[]>([]);

    const [location, setLocation] = useState<LocationCoords | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const mapRef = useRef(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const headingSubscription = useRef<Location.LocationSubscription | null>(null);
    const [destination, setDestination] = useState<LocationCoords | null>(null);
    const [routeCoords, setRouteCoords] = useState<LocationCoords[]>([]);
    const unsubscribeGroup = useRef<(() => void) | null>(null); // Restored this line
    const [showQuickMessages, setShowQuickMessages] = useState<boolean>(false);
    const [showMemberControl, setShowMemberControl] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [activeMessage, setActiveMessage] = useState<any>(null);
    const messageFade = useRef(new Animated.Value(0)).current;
    const [routeArray, setRouteArray] = useState<LocationCoords[]>([]);
    const [activeInput, setActiveInput] = useState<'start' | 'dest' | null>(null);
    const [rideStartTime, setRideStartTime] = useState<string>('');
    const [isRecentering, setIsRecentering] = useState<boolean>(false);
    const [nearbyDrivers, setNearbyDrivers] = useState<DriverLocation[]>([]);
    const [telemetryData, setTelemetryData] = useState<{ speed: number; timestamp: number }[]>([]);

    // Multiplayer Advanced States
    const [multiplayerColor, setMultiplayerColor] = useState<string>('');
    const [formations, setFormations] = useState<RiderFormation[]>([]);
    const [groupMessages, setGroupMessages] = useState<RideMessage[]>([]);
    const [sosAlerts, setSosAlerts] = useState<GroupSOSAlert[]>([]);
    const [showMultiplayerChat, setShowMultiplayerChat] = useState<boolean>(false);
    const [dismissedSosIds, setDismissedSosIds] = useState<Set<string>>(new Set());
    const lastMsgId = useRef<string | null>(null);
    const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const listenerAttachTime = useRef<number>(Date.now());

    // ── Leader / Role Logic ──────────────────────────────────────────────────
    const isLeader = useMemo(() => {
        const uid = user?.id?.trim();
        const rawHostId = activeGroup?.leaderId || activeGroup?.hostId;
        const hostId = typeof rawHostId === 'string' ? rawHostId.trim() : null;

        if (!activeGroup) return true;
        if (hostId && uid) return hostId === uid;

        // Fallback for member roster
        const me = joinedMembers.find(m => m.id?.trim() === uid);
        if (me) return me.role === 'host' || me.role === 'leader';

        return true;
    }, [activeGroup?.hostId, activeGroup?.leaderId, user?.id, joinedMembers]);

    const leaderName = useMemo(() => {
        if (!activeGroup) return 'Leader';
        const rawHostId = activeGroup?.leaderId || activeGroup?.hostId;
        const hostId = typeof rawHostId === 'string' ? rawHostId.trim() : null;
        const leader = joinedMembers.find(m => m.id?.trim() === hostId);
        return leader ? (leader.id === user?.id ? 'you' : leader.name.toLowerCase()) : 'leader';
    }, [joinedMembers, activeGroup, user?.id]);
    // Message Listener for Floating Cards
    useEffect(() => {
        if (!activeGroup?.id) return;
        listenerAttachTime.current = Date.now();
        const messagesRef = collection(db, 'rides', activeGroup.id, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
        const unsubscribeMsg = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    const docId = change.doc.id;

                    // Prevention 1: Ignore messages seen before
                    if (lastMsgId.current === docId) return;
                    lastMsgId.current = docId;

                    // Prevention 2: Ignore messages that were sent BEFORE we opened the dashboard
                    const msgTime = new Date(data.timestamp).getTime();
                    if (msgTime < listenerAttachTime.current - 1000) return;

                    // Prevention 3: Filter recent enough
                    if (Date.now() - msgTime < 10000) {
                        showFloatingMessage(data);
                    }
                }
            });
        });
        return () => unsubscribeMsg();
    }, [activeGroup?.id]);

    const showFloatingMessage = (msg: any) => {
        if (msgTimer.current) clearTimeout(msgTimer.current);
        setActiveMessage(msg);
        Animated.timing(messageFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        msgTimer.current = setTimeout(() => {
            Animated.timing(messageFade, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
                setActiveMessage(null);
            });
        }, 5000); // Reduced to 5 seconds
    };

    // Sync active group (Verified source of truth)
    useEffect(() => {
        if (!user) {
            setActiveGroup(null);
            return;
        }
        (async () => {
            const group = await GroupService.getUserActiveGroup(user.id);
            if (group) {
                unsubscribeGroup.current = GroupService.subscribeToGroup(group.id, (data: GroupData | null) => {
                    if (!data || data.status === 'completed' || data.status === 'cancelled') {
                        // AUTO-TERMINATE RIDE FOR ALL MEMBERS
                        setIsRideActive(false);
                        AsyncStorage.setItem('SOLO_RIDE_ACTIVE', 'false').catch(() => { });

                        setActiveGroup(null);
                        setDestination(null);
                        setRouteCoords([]);
                        setSosAlerts([]);
                        setJoinedMembers([]);
                        unsubscribeGroup.current?.();
                        showToast(data?.status === 'completed' ? "Mission Completed by Leader" : "Mission Cancelled by Leader");
                    } else {
                        setActiveGroup(data);
                    }
                });
            } else {
                setActiveGroup(null);
                setJoinedMembers([]);
            }
        })();
        return () => { if (unsubscribeGroup.current) unsubscribeGroup.current(); };
    }, [user?.id, user?.groupId]); // React to groupId changes!

    // Sync destination and route from leader (Only for Non-Leaders in active groups)
    useEffect(() => {
        if (activeGroup && !isLeader && (activeGroup.status === 'active' || activeGroup.status === 'waiting')) {
            const destCoords = activeGroup.destinationCoordinates || activeGroup.destinationCoords;
            const geom = activeGroup.routeGeometry || activeGroup.routeCoords;

            if (destCoords) {
                setDestination(destCoords as LocationCoords);

                // Recalculate route from rider's CURRENT location to destination
                // so the map shows a route from WHERE THE RIDER IS, not from the leader's position
                const riderStart = location;
                if (riderStart && (destCoords as LocationCoords).latitude) {
                    getRoute(riderStart, destCoords as LocationCoords, 'drive').then((routeResult) => {
                        if (routeResult?.coordinates) {
                            setRouteCoords(routeResult.coordinates);
                            setRouteSteps(routeResult.steps || []);
                            // Set rideDistance to rider's route distance
                            const km = routeResult.distance / 1000;
                            setRideDistance(km);
                            setEstimatedDistance(`${km.toFixed(1)} km`);
                            const mins = Math.ceil(routeResult.duration / 60);
                            setEstimatedDuration(`${mins} min`);
                        } else if (geom) {
                            // Fallback: use leader's route geometry if own calc fails
                            setRouteCoords(geom as LocationCoords[]);
                        }
                    }).catch(() => {
                        // Fallback: use leader's route geometry
                        if (geom) setRouteCoords(geom as LocationCoords[]);
                        if (activeGroup.distance) {
                            setRideDistance(parseFloat(String(activeGroup.distance)) || 0);
                            setEstimatedDistance(`${activeGroup.distance} km`);
                        }
                    });
                } else if (geom) {
                    setRouteCoords(geom as LocationCoords[]);
                    if (activeGroup.distance) {
                        setRideDistance(parseFloat(String(activeGroup.distance)) || 0);
                        setEstimatedDistance(`${activeGroup.distance} km`);
                    }
                }
            } else if (geom) {
                setRouteCoords(geom as LocationCoords[]);
            }

            if (activeGroup.destination && activeGroup.destination !== 'TBD') {
                setSearchQuery(activeGroup.destination);
            }
            if (activeGroup.eta) {
                setEstimatedDuration(`${activeGroup.eta} min`);
            }

            // AUTO-START RIDE FOR MEMBERS
            if (activeGroup.status === 'active' && !isRideActive) {
                // Sync timer from the group's startedAt so leader and rider timers match
                if ((activeGroup as any).startedAt) {
                    const elapsedSeconds = Math.floor(
                        (Date.now() - new Date((activeGroup as any).startedAt).getTime()) / 1000
                    );
                    setRideDuration(Math.max(0, elapsedSeconds));
                }
                // Set the route distance so riders see the same distance as leader
                if (activeGroup.distance && rideDistance === 0) {
                    setRideDistance(parseFloat(String(activeGroup.distance)) || 0);
                }
                setIsRideActive(true);
                AsyncStorage.setItem('SOLO_RIDE_ACTIVE', 'true').catch(() => { });
            }
        }
    }, [activeGroup?.destinationCoordinates, activeGroup?.destinationCoords, activeGroup?.routeGeometry, activeGroup?.routeCoords, activeGroup?.id, isLeader, activeGroup?.distance, activeGroup?.eta, activeGroup?.status, isRideActive, location?.latitude, location?.longitude]);

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

    // ── Multiplayer Advanced Features (Only for Verified Groups) ─────────────
    useEffect(() => {
        // IMPORTANT: Only run if activeGroup is verified and belongs to this user
        if (!activeGroup?.id || !user?.id) return;

        // 1. Start Broadcast
        RideLocationSync.startLocationBroadcasting(activeGroup.id, user.id, user.name || 'Rider', multiplayerColor || '#FF3B30');

        // 2. Subscribe to Members
        const unsubMembers = onSnapshot(collection(db, 'rides', activeGroup.id, 'members'), (snap) => {
            const members = snap.docs.map(d => ({ id: d.id, ...d.data() } as GroupMember));
            setJoinedMembers(members);

            // 3. Update Formation
            const rawHostId = activeGroup.leaderId || activeGroup.hostId || members[0]?.id;
            const hostId = typeof rawHostId === 'string' ? rawHostId : (rawHostId as any)?.toString();
            if (hostId) {
                setFormations(FormationService.calculateFormation(members, hostId));
            }
        });

        // 4. Listen for Messages
        const unsubChat = RideChatService.listenToChat(activeGroup.id, (msgs) => setGroupMessages(msgs as any));

        // 5. Listen for SOS Alerts
        const unsubSOS = SOSAlertService.listenForSOS(activeGroup.id, (alerts) => {
            setSosAlerts(alerts.filter(alert => !dismissedSosIds.has(alert.id)));
        });

        return () => {
            unsubMembers();
            unsubChat();
            unsubSOS();
            RideLocationSync.stopLocationBroadcasting();
        };
    }, [activeGroup?.id, user?.id, multiplayerColor, dismissedSosIds]); // Added dismissedSosIds to dependency array

    // ── Group Auto Map Zoom (Debounced) ──────────────────────────────────────
    const lastZoomTime = useRef<number>(0);
    useEffect(() => {
        const gid = activeGroup?.id || user?.groupId;
        if (gid && joinedMembers.length > 0 && mapRef.current) {
            const now = Date.now();
            if (now - lastZoomTime.current < 5000) return; // Feature 11: Debounce camera updates (5s)

            const coords = joinedMembers
                .filter(m => m.latitude && m.longitude)
                .map(m => ({ latitude: m.latitude!, longitude: m.longitude! }));

            if (location) coords.push(location);
            if (destination) coords.push(destination);

            if (coords.length > 1) {
                (mapRef.current as any).fitToCoordinates?.(coords, {
                    edgePadding: { top: 150, right: 80, bottom: 280, left: 80 },
                    animated: true,
                });
                lastZoomTime.current = now;
            }
        }
    }, [joinedMembers, isRideActive, destination, location]);

    // Connectivity Monitoring
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected ?? true);
        });
        return () => unsubscribe();
    }, []);

    // Handle Return Trip Params
    useEffect(() => {
        const params = route.params as any;
        if (params?.returnTrip && params?.startCoords && params?.destCoords) {
            setDestination(params.destCoords);
            setManualStartLocation(params.startCoords);
            setUseCurrentLocation(false);
            setSearchQuery(params.destName || "");
            setStartLocationQuery(params.startName || "");
            (async () => {
                const routeResult = await getRoute(params.startCoords, params.destCoords, travelMode);
                if (routeResult?.coordinates) {
                    setRouteCoords(routeResult.coordinates);
                    setRouteSteps(routeResult.steps || []);
                    setRideDistance(routeResult.distance / 1000);
                    // Update estimates
                    const km = (routeResult.distance / 1000).toFixed(1);
                    const mins = Math.ceil(routeResult.duration / 60);
                    setEstimatedDistance(`${km} km`);
                    setEstimatedDuration(`${mins} min`);
                }
            })();
        }
    }, [route.params, travelMode]);

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

    // Subscribe to nearby drivers
    useEffect(() => {
        if (!location) return;
        const unsubscribe = subscribeToNearbyDrivers(
            location,
            10, // 10km radius
            (drivers) => setNearbyDrivers(drivers)
        );
        return () => unsubscribe();
    }, [location?.latitude, location?.longitude]);

    // Store location to Firestore continuously
    useEffect(() => {
        if (!user?.id || !location) return;
        LocationService.storeLocationInFirestore(user.id, {
            latitude: location.latitude,
            longitude: location.longitude,
            speed: (location as any).speed ?? 0,
            heading: (location as any).heading ?? 0,
            altitude: (location as any).altitude ?? 0,
            accuracy: (location as any).accuracy ?? 0,
            timestamp: Date.now(),
        });
    }, [location, user?.id]);

    // Map Tracking Lifecycle
    useEffect(() => {
        startLocationTracking();
        return () => {
            stopLocationTracking();
            stopHeadingTracking();
        };
    }, []); // Start tracking on mount

    // Ride Timer logic
    useEffect(() => {
        isRideActiveRef.current = isRideActive; // Keep ref in sync
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isRideActive) {
            setRideStartTime(new Date().toISOString());
            // NOTE: Do NOT reset rideDuration to 0 here.
            // For group members, rideDuration may have been pre-seeded from startedAt
            // so that the rider's timer syncs with the leader's elapsed time.
            interval = setInterval(() => {
                setRideDuration(prev => prev + 1);
            }, 1000);
        } else {
            setRideDuration(0);
            setRideSpeed(0);
            setRideDistance(0);
            setEstimatedDistance('');
            setEstimatedDuration('');
            setRouteArray([]);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRideActive]);

    const startLocationTracking = async (): Promise<void> => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

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

                if (isRideActiveRef.current) { // Use ref to avoid stale closure
                    // Update tracked route and distance
                    setRouteArray(prev => {
                        if (prev.length > 0) {
                            const last = prev[prev.length - 1];
                            const dist = getDistance(last, newCoords);
                            setRideDistance(d => d + (dist / 1000));
                        }
                        return [...prev, newCoords];
                    });

                    // Update telemetry samples
                    setTelemetryData(prev => [
                        ...prev,
                        { speed: currentSpeedKmh, timestamp: Date.now() }
                    ]);
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

    // Unified group state is now handled by the main sync effect at line 182.
    // Redundant subscription removed to prevent inconsistent state from stale user.groupId.

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
                            if (activeGroup && user) {
                                // Use centralized SOS service
                                await SOSAlertService.broadcastSOS(
                                    activeGroup.id,
                                    user.id,
                                    user.name || 'Unknown Rider',
                                    { latitude: currentLoc.coords.latitude, longitude: currentLoc.coords.longitude }
                                );

                                showToast('🆘 SOS BROADCAST ACTIVE!');
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

        if (activeGroup && user) {
            SOSAlertService.cancelSOS(activeGroup.id, user.id);
        }
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
        onPanResponderRelease: async (evt, gestureState) => {
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
                // If in a group, only leader can start the mission ride
                if (activeGroup && !isLeader) {
                    showToast("Waiting for Leader to start...");
                    Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true }).start();
                    return;
                }

                Animated.timing(slideAnim, { toValue: maxSlide, duration: 100, useNativeDriver: true }).start(async () => {
                    setIsRideActive(true);

                    // Leader starts group ride
                    if (activeGroup && isLeader) {
                        try {
                            await GroupService.updateRideStatus(activeGroup.id, 'active');
                            await GroupService.broadcastMessage(activeGroup.id, {
                                senderId: user?.id || 'Leader',
                                senderName: user?.name || 'Leader',
                                text: "🚀 RIDE STARTED! Let's Go!",
                                timestamp: new Date().toISOString()
                            });
                        } catch (err) {
                            console.error("Leader start failed:", err);
                        }
                    }

                    try {
                        await AsyncStorage.setItem('SOLO_RIDE_ACTIVE', 'true');
                    } catch { }
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
                    rideType: (route.params as any)?.returnTrip ? 'Return' : 'Outbound',
                    telemetry: telemetryData
                };
                if (user?.id) await RideService.logRide(user.id, rideData);

                showFloatingMessage({
                    senderName: "MISSION COMPLETE",
                    text: `🏁 Dist: ${rideDistance.toFixed(1)} km | Time: ${formatTime(rideDuration)}`,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                console.error("Failed to log ride:", error);
                showToast('Ride data saved locally');
            }
        }
        if (activeGroup && user?.id) {
            try {
                if (isLeader) {
                    // Leader completes the ride — clears groupId for ALL participants
                    await GroupService.completeRide(activeGroup.id);
                } else {
                    // Non-leader just leaves the group
                    await GroupService.leaveGroup(activeGroup.id, user.id);
                }
            } catch (err) {
                console.error("End group session failed:", err);
            }
        }

        // Full local state reset
        setIsRideActive(false);
        try {
            await AsyncStorage.setItem('SOLO_RIDE_ACTIVE', 'false');
        } catch { }
        setRouteCoords([]);
        setRouteSteps([]);
        setCurrentStepIndex(0);
        setDestination(null);
        setHasArrived(false);
        setSosAlerts([]);
        setActiveGroup(null);
        setFormations([]);
        setGroupMessages([]);
        setJoinedMembers([]);
        setDismissedSosIds(new Set());
        setMultiplayerColor('');
        setTelemetryData([]);

        // Navigate back to Lobby so users can create/join a new ride
        navigation.navigate('CenterLogo' as any);
    };

    const broadcastMessage = async (text: string): Promise<void> => {
        if (!activeGroup?.id) return;
        try {
            await GroupService.broadcastMessage(activeGroup.id, {
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

                // Broadcast to group if leader
                if (activeGroup && isLeader) {
                    LeaderRouteService.shareRouteWithGroup(
                        activeGroup.id,
                        searchQuery || end.latitude.toString(),
                        { latitude: end.latitude, longitude: end.longitude },
                        route.coordinates,
                        km,
                        mins.toString()
                    );
                }
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
            <MapboxMapView
                style={styles.map}
                location={useCurrentLocation ? location : manualStartLocation || location}
                userLocation={location}
                userHeading={heading}
                destination={destination}
                routeCoords={routeCoords}
                isRideActive={isRideActive}
                geofenceRadius={GEOFENCE_RADIUS}
                members={joinedMembers}
                nearbyDrivers={nearbyDrivers}
                isDarkTheme={isDarkTheme}
            >
                {/* Advanced Multiplayer Renderer */}
                {activeGroup && (
                    <RideMarkersRenderer
                        members={joinedMembers}
                        userId={user?.id || ''}
                        sosAlerts={sosAlerts}
                        leaderId={(activeGroup?.leaderId as string) || (activeGroup as any)?.hostId || undefined}
                    />
                )}
            </MapboxMapView>

            {/* Offline/No Connection Banner */}
            {!isConnected && (
                <View style={styles.offlineBanner}>
                    <MaterialIcons name="signal-wifi-off" size={16} color="white" />
                    <Text style={styles.offlineText}>OFFLINE MODE - LOCAL SPEED ONLY</Text>
                </View>
            )}

            {/* 2. Top UI Overlay (Search & Group Info) */}
            {!isRideActive && (
                <View style={styles.topOverlay} pointerEvents="box-none">
                    <SafeAreaView edges={['top']} pointerEvents="box-none">
                        <SearchBar
                            onSelectDestination={(place) => {
                                setSearchQuery(place.name);
                                setDestination({ latitude: place.latitude, longitude: place.longitude });
                                let start = location;
                                if (!useCurrentLocation && manualStartLocation) start = manualStartLocation;
                                if (start) calculateDirectRoute(start, { latitude: place.latitude, longitude: place.longitude });
                            }}
                            onSelectStart={(place) => {
                                setStartLocationQuery(place.name);
                                setManualStartLocation({ latitude: place.latitude, longitude: place.longitude });
                                setUseCurrentLocation(false);
                                if (destination) calculateDirectRoute({ latitude: place.latitude, longitude: place.longitude }, destination);
                            }}
                            onUseCurrentLocation={resetToCurrentLocation}
                            useCurrentLocation={useCurrentLocation}
                            currentLocationName={currentLocationName}
                            startQuery={startLocationQuery}
                            destQuery={searchQuery}
                            onStartQueryChange={setStartLocationQuery}
                            onDestQueryChange={setSearchQuery}
                            loading={loading}
                            isDarkTheme={isDarkTheme}
                            locked={!!(activeGroup && (activeGroup.status === 'active' || activeGroup.status === 'waiting') && user?.id && activeGroup.hostId !== user.id)}
                        />
                        {/* Theme Toggle Button - Top Right Floating */}
                        <TouchableOpacity
                            style={[styles.themePill, !isDarkTheme && styles.themePillLight]}
                            onPress={toggleTheme}
                        >
                            <MaterialIcons
                                name={isDarkTheme ? "nights-stay" : "wb-sunny"}
                                size={18}
                                color={isDarkTheme ? "#FFD700" : "#0F172A"}
                            />
                            <Text style={[styles.themePillText, !isDarkTheme && styles.themePillTextLight]}>
                                {isDarkTheme ? "NIGHT" : "DAY"}
                            </Text>
                        </TouchableOpacity>

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
                </View>
            )}

            {/* 3. Active Ride HUD Overlay */}
            {isRideActive && (
                <SafeAreaView style={styles.rideOverlay} pointerEvents="box-none">
                    <View style={styles.rideStatsTop}>
                        <View style={[styles.statBox, !isDarkTheme && styles.statBoxLight]}>
                            <Text style={[styles.statLabel, !isDarkTheme && styles.statLabelLight]}>DURATION</Text>
                            <Text style={[styles.statValueBig, !isDarkTheme && styles.statValueBigLight]}>{formatTime(rideDuration)}</Text>
                        </View>
                        <View style={[styles.statBox, !isDarkTheme && styles.statBoxLight]}>
                            <Text style={[styles.statLabel, !isDarkTheme && styles.statLabelLight]}>DISTANCE</Text>
                            <Text style={[styles.statValueBig, !isDarkTheme && styles.statValueBigLight]}>
                                {/* For group members: show route distance from estimatedDistance.
                                    For leader/solo: show GPS-tracked distance. */}
                                {!isLeader && activeGroup && estimatedDistance
                                    ? estimatedDistance
                                    : `${rideDistance.toFixed(1)} km`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.bottomRideControls}>
                        {routeSteps && routeSteps.length > 0 && (
                            <View style={[styles.navGuidanceBox, !isDarkTheme && styles.navGuidanceBoxLight]}>
                                <MaterialIcons
                                    name={getIconForInstruction(routeSteps[currentStepIndex]?.instruction)}
                                    size={36}
                                    color={isDarkTheme ? "white" : "black"}
                                />
                                <View style={{ marginLeft: 15, flex: 1 }}>
                                    <Text style={[styles.navInstruction, !isDarkTheme && styles.navInstructionLight]}>
                                        {routeSteps[currentStepIndex]?.instruction || "Follow Route"}
                                    </Text>
                                    <Text style={[styles.navDistance, !isDarkTheme && styles.navDistanceLight]}>{routeSteps[currentStepIndex]?.name || ""}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.rideActionRow}>
                            <View style={[styles.compactSpeedometer, !isDarkTheme && styles.compactSpeedometerLight]}>
                                <Text style={[styles.compactSpeedValue, !isDarkTheme && styles.compactSpeedValueLight]}>{rideSpeed}</Text>
                                <Text style={styles.compactSpeedUnit}>KM/H</Text>
                            </View>

                            <TouchableOpacity style={styles.stopRideButton} onPress={stopRide} activeOpacity={0.8}>
                                <View style={styles.stopIconSquare} />
                                <Text style={styles.stopRideText}>FINISH RIDE</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </SafeAreaView>
            )}

            {/* ── Multiplayer HUD Overlays ─────────────────── */}
            {activeGroup && (
                <>
                    {/* GroupFormationPanel removed from top as requested */}

                    {showMultiplayerChat && (
                        <GroupChatOverlay
                            messages={groupMessages}
                            onSendMessage={(msg) => RideChatService.sendMessage(activeGroup.id, user.id, user.name || 'Rider', msg)}
                            onClose={() => setShowMultiplayerChat(false)}
                            quickMessages={quickMsgs}
                        />
                    )}

                    {sosAlerts.filter(a => !dismissedSosIds.has(a.id)).map(alert => (
                        <GroupSOSAlertCard
                            key={alert.id}
                            alert={alert}
                            onDismiss={() => {
                                setDismissedSosIds(prev => {
                                    const next = new Set(prev);
                                    next.add(alert.id);
                                    return next;
                                });
                            }}
                            onNavigate={() => {
                                setDestination({ latitude: alert.latitude, longitude: alert.longitude });
                                setSearchQuery(`SOS: ${alert.username}`);
                            }}
                        />
                    ))}
                </>
            )}

            {/* 4. Team Chat Broadcasts */}
            {activeMessage && (
                <Animated.View style={[styles.floatingMessageCard, { opacity: messageFade }]}>
                    <View style={styles.messageIcon}>
                        <MaterialIcons name="chat" size={20} color="#FFD700" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.messageSender}>{activeMessage.senderName || 'Rider'}</Text>
                        <Text style={styles.messageText} numberOfLines={2}>{activeMessage.text}</Text>
                    </View>
                </Animated.View>
            )}

            {/* 5. Main Action FABs */}
            <View style={[styles.rightButtons, isRideActive && { bottom: 220 }]}>
                {activeGroup && (
                    <TouchableOpacity
                        style={[styles.fab, !isDarkTheme && styles.fabLight, { position: 'relative' }]}
                        onPress={() => setShowMemberControl(true)}
                    >
                        <MaterialIcons name="groups" size={28} color="#FFD700" />
                        <View style={styles.fabBadge}>
                            <Text style={styles.fabBadgeText}>{joinedMembers.length}</Text>
                        </View>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.fab} onPress={recenterMap} disabled={isRecentering}>
                    {isRecentering ? <ActivityIndicator size="small" color="#FFD700" /> : <MaterialIcons name="my-location" size={24} color="#FFD700" />}
                </TouchableOpacity>
            </View>

            {/* 6. Slide-to-Start Control */}
            {!isRideActive && (
                <View style={[styles.bottomBar, !isDarkTheme && styles.bottomBarLight]}>
                    <View
                        style={[styles.slideTrack, !isDarkTheme && styles.slideTrackLight]}
                        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                        {...panResponder.panHandlers}
                    >
                        <Animated.View style={[styles.slideThumb, { transform: [{ translateX: slideAnim }] }]}>
                            <MaterialIcons name="play-arrow" size={28} color="black" />
                        </Animated.View>
                        <Text style={[styles.slideText, !isDarkTheme && styles.slideTextLight]}>
                            {activeGroup
                                ? (isLeader ? 'SLIDE TO START MISSION' : 'WAITING FOR LEADER...')
                                : 'SLIDE TO START RIDE'}
                        </Text>
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
                    onOpenChat={() => setShowMultiplayerChat(true)}
                    onOpenQuickMessages={() => setShowQuickMessages(true)}
                    onTriggerSOS={triggerSOS}
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

    topRightInfo: { position: 'absolute', top: 240, right: 15, zIndex: 10 },
    infoBadge: { backgroundColor: 'rgba(15,17,26,0.9)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#FFD70030' },
    infoBadgeLight: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#FFD70030' },
    groupNameText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },
    infoSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 10 },
    memberCountBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    memberCountText: { color: '#FFD700', fontSize: 11, fontWeight: 'bold' },
    durationText: { color: '#9CA3AF', fontSize: 11 },
    durationTextLight: { color: '#64748b' },

    offlineBanner: { position: 'absolute', bottom: 200, left: 20, right: 20, backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8, zIndex: 50 },
    offlineText: { color: 'white', fontSize: 12, fontWeight: 'bold' },

    routeSummaryPill: { flexDirection: 'row', backgroundColor: '#FFD700', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, alignSelf: 'center', marginTop: 20, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    summaryItem: { paddingHorizontal: 15, alignItems: 'center' },
    summaryLabel: { color: 'black', fontSize: 9, fontWeight: '900', opacity: 0.6 },
    summaryValue: { color: 'black', fontSize: 14, fontWeight: 'bold' },

    rideOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, pointerEvents: 'box-none', justifyContent: 'space-between', paddingHorizontal: 20 },
    rideStatsTop: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    statBox: { backgroundColor: 'rgba(15,17,26,0.9)', borderRadius: 16, padding: 15, alignItems: 'center', minWidth: 130, borderWidth: 1, borderColor: '#1F2937' },
    statBoxLight: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#e2e8f0' },
    statLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
    statLabelLight: { color: '#64748b' },
    statValueBig: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    statValueBigLight: { color: '#0f172a' },

    compactSpeedometer: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#1F2937', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFD700', elevation: 8 },
    compactSpeedometerLight: { backgroundColor: '#ffffff', borderColor: '#FFD700' },
    compactSpeedValue: { color: '#FFD700', fontSize: 18, fontWeight: 'bold' },
    compactSpeedValueLight: { color: '#0f172a' },
    compactSpeedUnit: { color: '#9CA3AF', fontSize: 8, fontWeight: '900', marginTop: -2 },

    navGuidanceBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,17,26,0.95)', borderRadius: 16, padding: 16, marginBottom: 15, borderWidth: 1, borderColor: '#1F2937' },
    navGuidanceBoxLight: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#cbd5e1' },
    navInstruction: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    navInstructionLight: { color: '#0f172a' },
    navDistance: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
    navDistanceLight: { color: '#64748b' },

    bottomRideControls: { width: '100%', paddingRight: 85, marginBottom: 80 },
    rideActionRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    stopRideButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#EF4444', borderRadius: 16, padding: 16, elevation: 8 },
    rideQuickMessageBtn: { width: 70, height: 60, backgroundColor: '#1F2937', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151', elevation: 8 },
    rideQuickMessageText: { color: 'white', fontSize: 10, fontWeight: '900', marginTop: 2 },
    stopIconSquare: { width: 14, height: 14, backgroundColor: 'white', borderRadius: 2, marginRight: 12 },
    stopRideText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 2 },

    rightButtons: { position: 'absolute', right: 20, bottom: 195, gap: 12, alignItems: 'flex-end', zIndex: 100 },
    fab: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(22,25,37,0.95)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151', elevation: 8 },
    fabLight: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#cbd5e1' },
    fabBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#EF4444', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1F2937' },
    fabBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

    bottomBar: { position: 'absolute', bottom: 70, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: 'rgba(15,17,26,0.9)', borderTopWidth: 1, borderTopColor: '#1F2937' },
    bottomBarLight: { backgroundColor: 'rgba(255,255,255,0.9)', borderTopColor: '#e2e8f0' },
    slideTrack: { height: 64, borderRadius: 32, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#FFD70050', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    slideTrackLight: { backgroundColor: '#e2e8f0', borderColor: '#FFD70030' },
    slideThumb: { position: 'absolute', left: 4, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFD700', alignItems: 'center', justifyContent: 'center', elevation: 6 },
    slideText: { color: '#9CA3AF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    slideTextLight: { color: '#64748b' },

    sosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    sosInner: { alignItems: 'center', paddingHorizontal: 40 },
    sosTitle: { color: 'white', fontSize: 26, fontWeight: '900', marginTop: 20, letterSpacing: 1 },
    sosCountdown: { fontSize: 120, color: '#EF4444', fontWeight: 'bold', marginVertical: 30 },
    cancelSosButton: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 18, paddingHorizontal: 60, borderRadius: 35, borderWidth: 1, borderColor: 'white' },
    cancelSosText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    sosTriggeredText: { color: 'white', fontSize: 38, fontWeight: '900', marginTop: 20, letterSpacing: 1 },
    sosTriggeredSub: { color: 'rgba(255,255,255,0.7)', fontSize: 15, textAlign: 'center', marginTop: 12, lineHeight: 22 },

    floatingMessageCard: { position: 'absolute', top: 200, left: 20, right: 20, backgroundColor: 'rgba(31, 41, 55, 0.95)', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FFD70050', elevation: 12, zIndex: 1 },
    messageIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,215,0,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    messageSender: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 12, opacity: 0.8, textTransform: 'uppercase' },
    messageText: { color: 'white', fontWeight: '900', fontSize: 16, marginTop: 4 },

    themePill: {
        position: 'absolute',
        top: 240, // Below Search Bar
        right: 15,
        backgroundColor: 'rgba(15,17,26,0.9)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#1F2937',
        elevation: 10,
        zIndex: 100,
    },
    themePillLight: { backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#cbd5e1' },
    themePillText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    themePillTextLight: { color: '#0F172A' },
});

export default DashboardScreen;
