/**
 * MapView/index.tsx — Open Source Navigation Map (OSM + react-native-maps)
 *
 * Implements a fully functional navigation system using:
 *   - react-native-maps (MapView, Marker, Polyline, Circle)
 *   - OpenStreetMap Tiles
 *   - Automatic bounds fitting for routes
 */

import React, { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react';
import {
    View, Text, StyleSheet, Animated, ViewStyle, Image, ImageStyle, Dimensions, Platform
} from 'react-native';
import MapView, { Marker as RNMarker, Polyline as RNPolyline, UrlTile, Circle as RNCircle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Coordinate, RideMember } from '../../types';
import { DriverLocation } from '../../services/rideMatchingService';
import { getColorForUser } from '../../services/GroupRideManager';
import { useImperativeHandle } from 'react';

const { width, height } = Dimensions.get('window');

// ── Props ──────────────────────────────────────────────────────────────────────
interface MapViewProps {
    location?: Coordinate | null;       // Center point
    userLocation?: Coordinate | null;   // Real GPS position
    userHeading?: number;               // Compass heading
    destination?: Coordinate | null;
    routeCoords?: Coordinate[];
    isRideActive?: boolean;
    onMapReady?: () => void;
    onMapPress?: (coord: Coordinate) => void;
    geofenceRadius?: number;
    members?: RideMember[];
    nearbyDrivers?: DriverLocation[];
    style?: ViewStyle;
    isDarkTheme?: boolean;
    children?: React.ReactNode;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function getInitials(name?: string | null): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

// ── Custom Markers ─────────────────────────────────────────────────────────────
const UserPulseMarker: React.FC<{ heading?: number; isRideActive?: boolean }> = memo(({ heading = 0, isRideActive }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.8, duration: 1200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <View style={markerStyles.userWrap}>
            <Animated.View style={[markerStyles.pulse, { transform: [{ scale: pulseAnim }] }]} />
            <View style={[markerStyles.navArrowContainer, { transform: [{ rotate: `${heading}deg` }] }]}>
                <View style={markerStyles.navArrowMain} />
            </View>
            <View style={markerStyles.userCoreDot} />
        </View>
    );
});

const DestinationPin: React.FC = memo(() => (
    <View style={markerStyles.destWrap}>
        <View style={markerStyles.pinHead}><View style={markerStyles.pinInner} /></View>
        <View style={markerStyles.pinTip} />
    </View>
));

const MemberMarker: React.FC<{ member: RideMember }> = memo(({ member }) => {
    const initials = getInitials(member.name);
    const color = (member as any).color || getColorForUser(member.id);
    const isLeader = member.role === 'host' || member.role === 'leader';
    const size = isLeader ? 36 : 30;
    return (
        <View style={markerStyles.memberWrap}>
            <View style={[
                markerStyles.memberAvatar,
                {
                    borderColor: color,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    borderWidth: isLeader ? 3 : 2,
                },
            ]}>
                {member.profileImage
                    ? <Image source={{ uri: member.profileImage }} style={markerStyles.memberImage as ImageStyle} />
                    : <Text style={markerStyles.memberInitials}>{initials}</Text>}
            </View>
        </View>
    );
});

// ── Main MapView Component ─────────────────────────────────────────────────────
const MapboxMapView = React.forwardRef<MapView, MapViewProps>(({
    location,
    userLocation,
    userHeading = 0,
    destination,
    routeCoords = [],
    isRideActive = false,
    onMapReady,
    geofenceRadius = 500,
    members = [],
    nearbyDrivers = [],
    style,
    isDarkTheme = true,
    children,
}, ref) => {
    const mapRef = useRef<MapView>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    useImperativeHandle(ref, () => mapRef.current!);

    // Filter valid members
    const activeMembers = useMemo(() =>
        members.filter(m => typeof m.latitude === 'number' && typeof m.longitude === 'number'),
        [members]
    );

    // Auto-fit bounds logic
    useEffect(() => {
        if (!isMapReady || !mapRef.current) return;

        if (routeCoords.length > 1) {
            mapRef.current.fitToCoordinates(routeCoords, {
                edgePadding: { top: 120, right: 60, bottom: 250, left: 60 },
                animated: true,
            });
        } else if (userLocation && destination) {
            mapRef.current.fitToCoordinates([userLocation, destination], {
                edgePadding: { top: 120, right: 80, bottom: 250, left: 80 },
                animated: true,
            });
        }
    }, [routeCoords, userLocation, destination, isMapReady]);

    const handleMapReady = () => {
        setIsMapReady(true);
        onMapReady?.();
    };

    const initialRegion = {
        latitude: userLocation?.latitude ?? location?.latitude ?? 20.5937,
        longitude: userLocation?.longitude ?? location?.longitude ?? 78.9629,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    return (
        <View style={[styles.container, style]}>
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={initialRegion}
                mapType="none" // Essential for showing Custom Tiles
                showsUserLocation={false}
                onMapReady={handleMapReady}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined} // Google Maps engine is more stable for tiles on Android
            >
                {/* ── OpenStreetMap Custom Tiles ────────────────── */}
                <UrlTile
                    urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"
                    maximumZ={19}
                    flipY={false}
                    tileSize={256}
                    shouldReplaceMapContent={true}
                />

                {/* ── Route Polyline (Yellow per request) ───────── */}
                {routeCoords.length > 1 && (
                    <RNPolyline
                        coordinates={routeCoords}
                        strokeColor="#FACC15" // Yellow-400
                        strokeWidth={6}
                        lineJoin="round"
                    />
                )}

                {/* ── Geofence Circle ─────────────────────────── */}
                {destination && geofenceRadius > 0 && (
                    <RNCircle
                        center={{ latitude: destination.latitude, longitude: destination.longitude }}
                        radius={geofenceRadius}
                        fillColor="rgba(250, 204, 21, 0.1)"
                        strokeColor="rgba(250, 204, 21, 0.5)"
                        strokeWidth={2}
                    />
                )}

                {/* ── User Marker ─────────────────────────────── */}
                {userLocation && (
                    <RNMarker coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }}>
                        <UserPulseMarker heading={userHeading} isRideActive={isRideActive} />
                    </RNMarker>
                )}

                {/* ── Destination Marker ───────────────────────── */}
                {destination && (
                    <RNMarker coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}>
                        <DestinationPin />
                    </RNMarker>
                )}

                {/* ── Driver Markers ───────────────────────────── */}
                {nearbyDrivers.map(driver => (
                    <RNMarker key={`d-${driver.id}`} coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}>
                        <View style={markerStyles.driverPill}><Text>🚗</Text></View>
                    </RNMarker>
                ))}
                {children}
            </MapView>

            <View style={styles.attribution}>
                <Text style={styles.attributionText}>© OpenStreetMap © CARTO</Text>
            </View>
        </View>
    );
});

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, overflow: 'hidden' },
    attribution: { position: 'absolute', bottom: 4, left: 6, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 4, borderRadius: 3 },
    attributionText: { fontSize: 8, color: '#fff' }
});

const markerStyles = StyleSheet.create({
    userWrap: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    pulse: { position: 'absolute', width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(59, 130, 246, 0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.5)' },
    navArrowContainer: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    navArrowMain: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#3B82F6' },
    userCoreDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    destWrap: { alignItems: 'center' },
    pinHead: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    pinInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    pinTip: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#fff', marginTop: -4 },
    memberWrap: { alignItems: 'center' },
    memberAvatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, backgroundColor: '#1F2937', overflow: 'hidden' },
    memberImage: { width: 30, height: 30 },
    memberInitials: { color: '#fff', fontSize: 10, textAlign: 'center', marginTop: 6 },
    driverPill: { backgroundColor: '#fff', padding: 4, borderRadius: 10, elevation: 3 }
});

export default MapboxMapView;
