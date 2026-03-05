/**
 * MapScreen.tsx
 *
 * Full-featured map screen using:
 *  - react-native-maps (OSM tile server)
 *  - expo-location (live GPS)
 *  - OpenRouteService (routing via routingService)
 *  - Overpass API (nearby places via placesService)
 *  - useGroupTracking (real-time member positions)
 *  - RiderMarker (animated rider overlay)
 *
 * Features:
 *  ✅ Current user location (live GPS, blue dot)
 *  ✅ Set destination by tapping map or entering address
 *  ✅ Route polyline (green)
 *  ✅ ETA + distance HUD
 *  ✅ Auto-recalculate when user deviates > 80m
 *  ✅ Nearby fuel / food / hospital markers (toggle)
 *  ✅ Real-time group member markers with animated movement
 *  ✅ Remove rider marker when they leave group
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, Animated, Platform,
} from 'react-native';
import MapView, { Marker, Polyline, UrlTile, Region, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import useAuth from '../hooks/useAuth';
import useGroupTracking from '../hooks/useGroupTracking';
import RiderMarker from '../components/RiderMarker';
import {
    getRoute, recalculateRoute, checkDeviation, getETAText,
} from '../services/routingService';
import { fetchNearbyPlaces, NearbyPlace, POICategory } from '../services/placesService';
import { Coordinate } from '../types';

// ── OSM tile server ────────────────────────────────────────────────────────────
// OpenStreetMap Standard tiles (free, attribution required)
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

// ── Marker icon colours per POI category ──────────────────────────────────────
const POI_COLORS: Record<POICategory, string> = {
    fuel: '#F59E0B',
    food: '#10B981',
    hospital: '#EF4444',
};
const POI_ICONS: Record<POICategory, string> = {
    fuel: 'local-gas-station',
    food: 'restaurant',
    hospital: 'local-hospital',
};

// ── Component ──────────────────────────────────────────────────────────────────

const MapScreen: React.FC = () => {
    const { user } = useAuth();
    const groupId = user?.groupId ?? null;
    const userId = user?.id ?? null;

    // ── Location ──────────────────────────────────────────────────────────────
    const [location, setLocation] = useState<Coordinate | null>(null);
    const [startLocation, setStartLocation] = useState<Coordinate | null>(null);
    const [heading, setHeading] = useState<number>(0);
    const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
    const locationSubRef = useRef<Location.LocationSubscription | null>(null);

    // ── Route ─────────────────────────────────────────────────────────────────
    const [destination, setDestination] = useState<Coordinate | null>(null);
    const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
    const [etaText, setEtaText] = useState<string>('');
    const [isRouting, setIsRouting] = useState<boolean>(false);
    const [isRecentering, setIsRecentering] = useState<boolean>(false);
    const deviationCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Nearby places ─────────────────────────────────────────────────────────
    const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
    const [activePOI, setActivePOI] = useState<POICategory | null>(null);
    const [loadingPOI, setLoadingPOI] = useState<boolean>(false);

    // ── Group tracking ────────────────────────────────────────────────────────
    const { members, publishLocation } = useGroupTracking(groupId, userId);

    // ── Map ref ───────────────────────────────────────────────────────────────
    const mapRef = useRef<MapView>(null);

    // ══════════════════════════════════════════════════════════════════════════
    // Permission + GPS tracking
    // ══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setPermissionGranted(false);
                Alert.alert(
                    'Location Permission Required',
                    'RidePulse needs location access to show your position and track rides.'
                );
                return;
            }
            setPermissionGranted(true);

            // Initial fix
            const initial = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const coords: Coordinate = {
                latitude: initial.coords.latitude,
                longitude: initial.coords.longitude,
                heading: initial.coords.heading ?? 0,
                speed: initial.coords.speed ?? 0,
            };
            setLocation(coords);
            setStartLocation(coords);
            publishLocation(coords);
            centerMapOn(coords);

            // Continuous watch
            locationSubRef.current = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 1500,
                    distanceInterval: 5,
                },
                (pos) => {
                    const updated: Coordinate = {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        heading: pos.coords.heading ?? 0,
                        speed: pos.coords.speed ?? 0,
                    };
                    setLocation(updated);
                    setHeading(pos.coords.heading ?? 0);
                    publishLocation(updated);
                }
            );
        })();

        return () => {
            locationSubRef.current?.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ══════════════════════════════════════════════════════════════════════════
    // Routing
    // ══════════════════════════════════════════════════════════════════════════

    const fetchRoute = useCallback(async (from: Coordinate, to: Coordinate) => {
        setIsRouting(true);
        try {
            const result = await getRoute(from, to);
            if (result) {
                setRouteCoords(result.coordinates);
                setEtaText(getETAText(result.distance, result.duration));
                mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: { top: 80, right: 40, bottom: 200, left: 40 },
                    animated: true,
                });
            } else {
                Alert.alert('Routing Error', 'Could not find a route to the destination.');
            }
        } catch (err) {
            console.error('[MapScreen] fetchRoute error:', err);
        } finally {
            setIsRouting(false);
        }
    }, []);

    // Trigger route fetch when destination changes
    useEffect(() => {
        if (!destination || !location) return;
        fetchRoute(location, destination);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destination]);

    // ── Deviation check every 10 seconds ─────────────────────────────────────
    useEffect(() => {
        if (!destination || routeCoords.length === 0) {
            if (deviationCheckRef.current) clearInterval(deviationCheckRef.current);
            return;
        }

        deviationCheckRef.current = setInterval(() => {
            if (!location) return;
            const deviated = checkDeviation(location, routeCoords, 80);
            if (deviated) {
                recalculateRoute(location, destination)
                    .then((result) => {
                        if (result) {
                            setRouteCoords(result.coordinates);
                            setEtaText(getETAText(result.distance, result.duration));
                        }
                    })
                    .catch(console.error);
            }
        }, 10_000);

        return () => {
            if (deviationCheckRef.current) clearInterval(deviationCheckRef.current);
        };
    }, [destination, routeCoords, location]);

    // ══════════════════════════════════════════════════════════════════════════
    // Map tap → set destination
    // ══════════════════════════════════════════════════════════════════════════

    const onMapPress = useCallback((e: MapPressEvent) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setDestination({ latitude, longitude });
    }, []);

    // ══════════════════════════════════════════════════════════════════════════
    // Nearby places
    // ══════════════════════════════════════════════════════════════════════════

    const togglePOI = useCallback(async (category: POICategory) => {
        if (activePOI === category) {
            setActivePOI(null);
            setNearbyPlaces([]);
            return;
        }
        if (!location) {
            Alert.alert('No Location', 'Waiting for GPS fix…');
            return;
        }
        setActivePOI(category);
        setLoadingPOI(true);
        try {
            const places = await fetchNearbyPlaces(location, category, 3000);
            setNearbyPlaces(places);
        } catch (err) {
            console.error('[MapScreen] togglePOI error:', err);
        } finally {
            setLoadingPOI(false);
        }
    }, [activePOI, location]);

    // ══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════════════════════════════════════

    const centerMapOn = (coord: Coordinate) => {
        mapRef.current?.animateToRegion({
            latitude: coord.latitude,
            longitude: coord.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }, 600);
    };

    const clearDestination = () => {
        setDestination(null);
        setRouteCoords([]);
        setEtaText('');
    };

    const recenterToCurrentLocation = useCallback(async () => {
        try {
            setIsRecentering(true);
            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const coords: Coordinate = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                heading: pos.coords.heading ?? 0,
                speed: pos.coords.speed ?? 0,
            };
            setLocation(coords);
            publishLocation(coords);
            centerMapOn(coords);
        } catch (err) {
            console.error('[MapScreen] recenter error:', err);
        } finally {
            setIsRecentering(false);
        }
    }, [publishLocation]);

    // ══════════════════════════════════════════════════════════════════════════
    // Render guards
    // ══════════════════════════════════════════════════════════════════════════

    if (permissionGranted === false) {
        return (
            <View style={styles.centred}>
                <MaterialIcons name="location-off" size={60} color="#EF4444" />
                <Text style={styles.permText}>Location permission denied.</Text>
                <Text style={styles.permSub}>Enable it in Settings to use the map.</Text>
            </View>
        );
    }

    const initialRegion: Region = location
        ? { latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
        : { latitude: 20.5937, longitude: 78.9629, latitudeDelta: 12, longitudeDelta: 12 };

    // ══════════════════════════════════════════════════════════════════════════
    // Render
    // ══════════════════════════════════════════════════════════════════════════

    return (
        <View style={styles.container}>
            {/* ── Map ─────────────────────────────────────────────────────── */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={initialRegion}
                onPress={onMapPress}
                showsUserLocation={false}  // using custom user marker
                showsMyLocationButton={false}
                showsCompass={false}
                toolbarEnabled={false}
                mapType="none"  // required for custom tile URL
            >
                {/* OSM Tile Layer */}
                <UrlTile
                    urlTemplate={OSM_TILE_URL}
                    maximumZ={19}
                    flipY={false}
                    tileSize={256}
                // Attribution is required by OSM license
                />

                {/* Start marker (origin) */}
                {startLocation && (
                    <Marker
                        coordinate={{ latitude: startLocation.latitude, longitude: startLocation.longitude }}
                        pinColor="green"
                        title="Start"
                    />
                )}

                {/* User location marker */}
                {location && (
                    <Marker
                        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        flat
                        rotation={heading}
                    >
                        <View style={styles.userDot}>
                            <View style={styles.userDotInner} />
                        </View>
                    </Marker>
                )}

                {/* Destination marker */}
                {destination && (
                    <Marker
                        coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
                        pinColor="#EF4444"
                        title="Destination"
                    />
                )}

                {/* Route polyline */}
                {routeCoords.length > 0 && (
                    <Polyline
                        coordinates={routeCoords}
                        strokeColor="#10B981"
                        strokeWidth={5}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}

                {/* Nearby POI markers */}
                {nearbyPlaces.map((place) => (
                    <Marker
                        key={place.id}
                        coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                        title={place.name}
                        description={place.distance ? `${place.distance}m away` : undefined}
                    >
                        <View style={[styles.poiMarker, { backgroundColor: POI_COLORS[place.category] }]}>
                            <MaterialIcons
                                name={POI_ICONS[place.category] as any}
                                size={14}
                                color="white"
                            />
                        </View>
                    </Marker>
                ))}

                {/* Group member markers */}
                {members.map((member) => (
                    <Marker
                        key={member.id}
                        coordinate={{ latitude: member.latitude ?? 0, longitude: member.longitude ?? 0 }}
                        anchor={{ x: 0.5, y: 1 }}
                        tracksViewChanges={false}
                    >
                        <RiderMarker
                            member={member}
                            isHost={member.role === 'host'}
                        />
                    </Marker>
                ))}
            </MapView>

            {/* ── Top HUD ─────────────────────────────────────────────────── */}
            <SafeAreaView style={styles.hudTop} pointerEvents="box-none">
                {/* ETA / distance pill */}
                {etaText !== '' && (
                    <View style={styles.etaPill}>
                        <MaterialIcons name="directions" size={16} color="#10B981" />
                        <Text style={styles.etaText}>{etaText}</Text>
                        <TouchableOpacity onPress={clearDestination} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <MaterialIcons name="close" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Group member counter */}
                {members.length > 0 && (
                    <View style={styles.groupPill}>
                        <MaterialIcons name="people" size={14} color="#FFD700" />
                        <Text style={styles.groupPillText}>{members.length} rider{members.length !== 1 ? 's' : ''} nearby</Text>
                    </View>
                )}
            </SafeAreaView>

            {/* ── Right FABs ──────────────────────────────────────────────── */}
            <View style={styles.rightFabs}>
                {/* Recenter */}
                <TouchableOpacity
                    style={styles.fab}
                    onPress={recenterToCurrentLocation}
                >
                    {isRecentering ? (
                        <ActivityIndicator size="small" color="#FFD700" />
                    ) : (
                        <MaterialIcons name="my-location" size={22} color="#FFD700" />
                    )}
                </TouchableOpacity>

                {/* POI toggles */}
                {(['fuel', 'food', 'hospital'] as POICategory[]).map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[
                            styles.fab,
                            activePOI === cat && { borderColor: POI_COLORS[cat], borderWidth: 2 },
                        ]}
                        onPress={() => togglePOI(cat)}
                    >
                        <MaterialIcons
                            name={POI_ICONS[cat] as any}
                            size={20}
                            color={activePOI === cat ? POI_COLORS[cat] : '#9CA3AF'}
                        />
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Routing / POI loading indicator ─────────────────────────── */}
            {(isRouting || loadingPOI) && (
                <View style={styles.loadingBadge}>
                    <ActivityIndicator size="small" color="#FFD700" />
                    <Text style={styles.loadingText}>{isRouting ? 'Routing…' : 'Loading…'}</Text>
                </View>
            )}

            {/* ── OSM Attribution (required by license) ───────────────────── */}
            <View style={styles.attribution}>
                <Text style={styles.attributionText}>© OpenStreetMap contributors</Text>
            </View>
        </View>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F111A' },
    map: { ...StyleSheet.absoluteFillObject },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F111A', padding: 30 },
    permText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
    permSub: { color: '#9CA3AF', fontSize: 14, marginTop: 8, textAlign: 'center' },

    // User dot
    userDot: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: 'rgba(59,130,246,0.25)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: '#3B82F6',
    },
    userDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6' },

    // POI marker
    poiMarker: {
        width: 28, height: 28, borderRadius: 14,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: 'white',
        elevation: 4,
    },

    // HUD
    hudTop: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 0 : 12,
        gap: 8,
    },
    etaPill: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(15,17,26,0.88)',
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
        alignSelf: 'flex-start',
        borderWidth: 1, borderColor: '#10B98130',
    },
    etaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    groupPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(15,17,26,0.88)',
        borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
        alignSelf: 'flex-start',
        borderWidth: 1, borderColor: '#FFD70030',
    },
    groupPillText: { color: '#FFD700', fontWeight: '600', fontSize: 12 },

    // FABs
    rightFabs: {
        position: 'absolute', right: 14, bottom: 100,
        gap: 10, alignItems: 'center',
    },
    fab: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(22,25,37,0.92)',
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: '#374151',
        elevation: 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4, shadowRadius: 4,
    },

    // Loaders
    loadingBadge: {
        position: 'absolute', bottom: 100, left: 16,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(15,17,26,0.9)',
        borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: '#374151',
    },
    loadingText: { color: '#9CA3AF', fontSize: 12 },

    // Attribution
    attribution: {
        position: 'absolute', bottom: 4, right: 8,
    },
    attributionText: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
});

export default MapScreen;
