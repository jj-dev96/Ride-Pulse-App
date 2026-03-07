/**
 * MapScreen.tsx — Premium Navigation Experience
 * 
 * Implements a Google Maps-like navigation interface using:
 *  - react-native-maps + OSM tiles
 *  - OSRM for routing
 *  - Bottom Panel with Start Ride Slider
 *  - Premium Floating Action Buttons (FABs)
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
    Alert, Dimensions, Platform, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import MapboxMapView from '../components/MapView';
import { MapService } from '../services/mapService';
import { LocationService, LocationUpdate } from '../services/locationService';
import { Coordinate, RideMember } from '../types';
import useAuth from '../hooks/useAuth';
import useGroupTracking from '../hooks/useGroupTracking';

const { width, height } = Dimensions.get('window');

const MapScreen: React.FC = () => {
    const { user } = useAuth();
    const groupId = user?.groupId ?? null;
    const userId = user?.id ?? null;

    // ── State ─────────────────────────────────────────────────────────────────────
    const [userLocation, setUserLocation] = useState<Coordinate | null>(null);
    const [userHeading, setUserHeading] = useState(0);
    const [destination, setDestination] = useState<Coordinate | null>(null);
    const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
    const [isRideActive, setIsRideActive] = useState(false);

    // Stats
    const [distance, setDistance] = useState<number>(0); // metres
    const [duration, setDuration] = useState<number>(0); // seconds
    const [loading, setLoading] = useState(false);

    // Group tracking
    const { members, publishLocation } = useGroupTracking(groupId, userId);

    // ── Permissions & Location Tracking ──────────────────────────────────────────
    useEffect(() => {
        let isStopped = false;

        const initLocation = async () => {
            const hasPermission = await LocationService.requestLocationPermission();
            if (!hasPermission) {
                Alert.alert('Permission Denied', 'Location access is required for navigation.');
                return;
            }

            // Initial fix
            const current = await LocationService.getCurrentLocation();
            if (current && !isStopped) {
                setUserLocation(current);
                publishLocation(current as any);
            }

            // Continuous tracking
            await LocationService.startLocationTracking((update: LocationUpdate) => {
                if (isStopped) return;
                const coords = {
                    latitude: update.latitude,
                    longitude: update.longitude,
                    heading: update.heading,
                };
                setUserLocation(coords);
                setUserHeading(update.heading);
                publishLocation(update as any);
            });
        };

        initLocation();

        return () => {
            isStopped = true;
            LocationService.stopLocationTracking();
        };
    }, []);

    // ── Route Recalculation ─────────────────────────────────────────────────────
    const calculateRoute = useCallback(async (start: Coordinate, end: Coordinate) => {
        setLoading(true);
        try {
            const result = await MapService.getRoute(start, end);
            if (result) {
                setRouteCoords(result.coordinates);
                setDistance(result.distance);
                setDuration(result.duration);
            }
        } catch (error) {
            console.warn('[MapScreen] Route calculation failed:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userLocation && destination) {
            calculateRoute(userLocation, destination);
        }
    }, [destination]);

    // ── Helper: Format Stats ────────────────────────────────────────────────────
    const etaText = useMemo(() => {
        if (!duration) return '0 min';
        const mins = Math.ceil(duration / 60);
        if (mins > 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
        return `${mins} min`;
    }, [duration]);

    const distanceText = useMemo(() => {
        if (!distance) return '0 km';
        return `${(distance / 1000).toFixed(1)} km`;
    }, [distance]);

    // ── Handlers ───────────────────────────────────────────────────────────────
    const handleRecenter = () => {
        if (userLocation) {
            // MapView internally handles recentering if location changes or bounds fit
        }
    };

    const toggleRide = () => {
        if (!destination) {
            Alert.alert('No Destination', 'Please select a destination on the map first.');
            return;
        }
        setIsRideActive(!isRideActive);
        if (!isRideActive) {
            Alert.alert('Ride Started', 'Navigation is now active.');
        } else {
            setDestination(null);
            setRouteCoords([]);
        }
    };

    const handleMapPress = (coord: Coordinate) => {
        if (!isRideActive) {
            setDestination(coord);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* ── Main Map Interface ─────────────────────────────────────────── */}
            <MapboxMapView
                userLocation={userLocation}
                userHeading={userHeading}
                destination={destination}
                routeCoords={routeCoords}
                isRideActive={isRideActive}
                members={members}
                style={styles.map}
            />

            {/* ── Top HUD: Search & Addresses ─────────────────────────────────── */}
            <SafeAreaView style={styles.topHud} pointerEvents="box-none">
                <View style={styles.searchBar}>
                    <TouchableOpacity style={styles.backButton}>
                        <MaterialIcons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.searchInput}>
                        <Text style={styles.searchText} numberOfLines={1}>
                            {destination ? 'Routing to destination...' : 'Where to?'}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.profileButton}>
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {destination && (
                    <View style={styles.routePill}>
                        <MaterialIcons name="navigation" size={16} color="#FACC15" />
                        <Text style={styles.routePillText}>Navigation Active</Text>
                    </View>
                )}
            </SafeAreaView>

            {/* ── Right Side FABs ────────────────────────────────────────────── */}
            <View style={styles.rightSideActions}>
                <TouchableOpacity style={[styles.fab, styles.fabDanger]}>
                    <MaterialIcons name="report-problem" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fab} onPress={handleRecenter}>
                    <MaterialIcons name="my-location" size={24} color="#3B82F6" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fab}>
                    <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fab}>
                    <FontAwesome5 name="users" size={18} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.fab}>
                    <MaterialIcons name="settings" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* ── Bottom Ride Card ───────────────────────────────────────────── */}
            {destination && (
                <View style={styles.bottomCardWrap}>
                    <LinearGradient
                        colors={['rgba(15,17,26,0)', 'rgba(15,17,26,0.95)', '#0F111A']}
                        style={styles.cardGradient}
                    />
                    <View style={styles.bottomCard}>
                        <View style={styles.cardHeader}>
                            <View style={[styles.dragHandle, isRideActive && { backgroundColor: '#EF4444' }]} />
                        </View>

                        <View style={styles.statRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>TIME</Text>
                                <Text style={styles.statValue}>{etaText}</Text>
                            </View>
                            <View style={styles.statDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>DISTANCE</Text>
                                <Text style={styles.statValue}>{distanceText}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.startButton, isRideActive && styles.stopButton]}
                            onPress={toggleRide}
                        >
                            <Text style={styles.startButtonText}>
                                {isRideActive ? 'STOP RIDE' : 'START RIDE'}
                            </Text>
                            <MaterialIcons
                                name={isRideActive ? "stop" : "arrow-forward"}
                                size={20}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* ── Loading Overlay ────────────────────────────────────────────── */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#FACC15" />
                    <Text style={styles.loadingText}>Calculating route...</Text>
                </View>
            )}
        </View>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F111A' },
    map: { flex: 1 },

    // Top HUD
    topHud: {
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 10, paddingHorizontal: 20, paddingTop: 10,
    },
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(30,41,59,0.95)',
        borderRadius: 16, padding: 12,
        elevation: 8, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 10,
    },
    backButton: { marginRight: 12 },
    searchInput: { flex: 1 },
    searchText: { color: '#9CA3AF', fontSize: 15, fontWeight: '500' },
    profileButton: { marginLeft: 12 },
    avatarPlaceholder: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    routePill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(250, 204, 21, 0.2)',
        paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, alignSelf: 'center', marginTop: 12,
        borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.4)',
    },
    routePillText: { color: '#FACC15', fontSize: 12, fontWeight: 'bold' },

    // FABs
    rightSideActions: {
        position: 'absolute', right: 20, bottom: height * 0.3,
        zIndex: 20, gap: 15,
    },
    fab: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: 'rgba(30,41,59,0.95)',
        alignItems: 'center', justifyContent: 'center',
        elevation: 5, shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 5,
        borderWidth: 1, borderColor: '#334155',
    },
    fabDanger: { backgroundColor: '#EF4444' },

    // Bottom Card
    bottomCardWrap: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 30,
    },
    cardGradient: {
        position: 'absolute', top: -100, left: 0, right: 0, height: 100,
    },
    bottomCard: {
        backgroundColor: '#0F111A',
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        paddingHorizontal: 25, paddingBottom: Platform.OS === 'ios' ? 40 : 25,
        paddingTop: 15, elevation: 20,
    },
    cardHeader: { alignItems: 'center', marginBottom: 20 },
    dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#334155' },
    statRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 25,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: { width: 1, height: 30, backgroundColor: '#334155' },
    statLabel: { color: '#64748B', fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
    statValue: { color: '#fff', fontSize: 20, fontWeight: '900' },
    startButton: {
        backgroundColor: '#10B981',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 18, borderRadius: 20, gap: 10,
    },
    stopButton: { backgroundColor: '#EF4444' },
    startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },

    // Loading
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15,17,26,0.7)',
        alignItems: 'center', justifyContent: 'center', zIndex: 100,
    },
    loadingText: { color: '#fff', marginTop: 15, fontWeight: 'bold' }
});

export default MapScreen;
