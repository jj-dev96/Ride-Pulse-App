/**
 * MapplsMapView.tsx — Now powered by react-native-maps + OpenStreetMap
 *
 * All Mappls / WebView code removed.
 * Uses:
 *   - react-native-maps   MapView + UrlTile (native, hardware-accelerated)
 *   - CartoDB Dark Matter  tiles in dark mode
 *   - OpenStreetMap        tiles in light mode
 *   - Custom pulsing user marker
 *   - Destination pin + geofence circle
 *   - Route Polyline
 *   - Group member markers with name labels
 *
 * Props interface is IDENTICAL to the old MapplsMapView so DashboardScreen
 * requires zero changes.
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import {
  View, Text, Image, StyleSheet, Animated, ViewStyle, ImageStyle, Platform,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  Circle,
  UrlTile,
  Region,
  Camera,
} from 'react-native-maps';
import { Coordinate, RideMember } from '../types';

// ── Tile URLs ──────────────────────────────────────────────────────────────────
// CartoDB Dark Matter — dark themed map, looks great on AMOLED screens
const TILE_DARK =
  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';

// CartoDB Positron — clean light map (OSM based, but app-friendly)
const TILE_LIGHT =
  'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// ── Props ──────────────────────────────────────────────────────────────────────
// Kept exactly the same as the original MapplsMapView to avoid breaking changes
interface MapplsMapViewProps {
  location?: Coordinate | null;       // Center/Start point
  userLocation?: Coordinate | null;   // Real GPS position for arrow
  userHeading?: number;               // Compass heading
  destination?: Coordinate | null;
  routeCoords?: Coordinate[];
  isRideActive?: boolean;
  onMapReady?: () => void;
  geofenceRadius?: number;
  members?: RideMember[];
  style?: ViewStyle;
  isDarkTheme?: boolean;
}

// ── User location marker — Professional Nav Arrow ──────────────────────────
const UserMarker: React.FC<{ heading?: number; isRideActive?: boolean }> = memo(({ heading = 0, isRideActive }) => {
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
      {isRideActive && (
        <View style={markerStyles.startLabel}>
          <Text style={markerStyles.labelText}>START</Text>
        </View>
      )}
      {/* Pulsing outer ring for emphasis */}
      <Animated.View
        style={[markerStyles.pulse, { transform: [{ scale: pulseAnim }] }]}
      />
      {/* Sleek Navigation Arrow */}
      <View style={[markerStyles.navArrowContainer, { transform: [{ rotate: `${heading}deg` }] }]}>
        <View style={markerStyles.navArrowMain} />
        <View style={markerStyles.navArrowShadow} />
      </View>
      {/* Subtle center dot */}
      <View style={markerStyles.userCoreDot} />
    </View>
  );
});

// ── Destination marker — Premium 3D Pin ──────────────────────────────────────
const DestinationMarker: React.FC = memo(() => (
  <View style={markerStyles.destWrap}>
    <View style={markerStyles.endLabel}>
      <Text style={markerStyles.labelText}>END</Text>
    </View>
    <View style={markerStyles.premiumPinContainer}>
      <View style={markerStyles.pinHead}>
        <View style={markerStyles.pinInner} />
      </View>
      <View style={markerStyles.pinTip} />
    </View>
    <View style={markerStyles.pinShadow} />
  </View>
));

// ── Group member marker — avatar + name label ─────────────────────────────────
const MemberMarker: React.FC<{ member: RideMember }> = memo(({ member }) => {
  const initials = getInitials(member.name);
  const dotColor = member.role === 'host' ? '#FFD700' : '#10B981';

  return (
    <View style={markerStyles.memberWrap}>
      {/* Avatar */}
      <View style={[markerStyles.memberAvatar, { borderColor: dotColor }]}>
        {member.profileImage ? (
          <Image
            source={{ uri: member.profileImage }}
            style={markerStyles.memberImage as ImageStyle}
            resizeMode="cover"
          />
        ) : (
          <Text style={markerStyles.memberInitials}>{initials}</Text>
        )}
      </View>
      {/* Name pill */}
      <View style={markerStyles.memberNamePill}>
        <Text style={markerStyles.memberNameText} numberOfLines={1}>
          {member.name}
        </Text>
      </View>
    </View>
  );
});

// ── Main component ─────────────────────────────────────────────────────────────
const MapplsMapView: React.FC<MapplsMapViewProps> = ({
  location,
  userLocation,
  userHeading = 0,
  destination,
  routeCoords = [],
  isRideActive = false,
  onMapReady,
  geofenceRadius = 0,
  members = [],
  style,
  isDarkTheme = true,
}) => {
  const mapRef = useRef<MapView>(null);
  const [mapReady, setMapReady] = useState(false);
  const initialCenterDone = useRef(false);

  const tileUrl = isDarkTheme ? TILE_DARK : TILE_LIGHT;

  // ── Map ready callback ──────────────────────────────────────────────────
  const handleMapReady = useCallback(() => {
    setMapReady(true);
    onMapReady?.();
  }, [onMapReady]);

  // ── Follow user location ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !location) return;

    if (!initialCenterDone.current) {
      // First fix: animate to user location at street zoom
      mapRef.current?.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.010,
          longitudeDelta: 0.010,
        },
        900
      );
      initialCenterDone.current = true;
    } else if (isRideActive) {
      // During active ride: camera follows user heading
      const cam: Camera = {
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        heading: (location as any).heading ?? 0,
        zoom: 16,
        pitch: 0,
        altitude: 0,
      };
      mapRef.current?.animateCamera(cam, { duration: 600 });
    }
  }, [location, mapReady, isRideActive]);

  // ── Fit map to show user + destination when route arrives or destination changes ──
  useEffect(() => {
    if (!mapReady) return;

    if (routeCoords.length > 1) {
      // Best case: show the whole route
      mapRef.current?.fitToCoordinates(routeCoords, {
        edgePadding: { top: 100, right: 50, bottom: 220, left: 50 },
        animated: true,
      });
    } else if (destination && location) {
      // Second best: show user and destination pin
      mapRef.current?.fitToCoordinates(
        [
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: destination.latitude, longitude: destination.longitude }
        ],
        {
          edgePadding: { top: 100, right: 80, bottom: 220, left: 80 },
          animated: true,
        }
      );
    } else if (destination) {
      // Fallback: zoom to destination
      mapRef.current?.animateToRegion({
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 800);
    }
  }, [routeCoords, destination, location, mapReady]);

  // ── Default region (India) shown before GPS fix ─────────────────────────
  const initialRegion: Region = {
    latitude: location?.latitude ?? 20.5937,
    longitude: location?.longitude ?? 78.9629,
    latitudeDelta: location ? 0.012 : 14,
    longitudeDelta: location ? 0.012 : 14,
  };

  // ── Filter members with valid GPS ───────────────────────────────────────
  const activeMembers = members.filter(
    (m) => typeof m.latitude === 'number' && typeof m.longitude === 'number' && m.isOnline !== false
  );

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onMapReady={handleMapReady}
        mapType="none"          // must be 'none' to use custom UrlTile
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        rotateEnabled={true}
        pitchEnabled={false}
        moveOnMarkerPress={false}
      >
        {/* ── OSM / CartoDB tile layer ───────────────────────────── */}
        <UrlTile
          urlTemplate={tileUrl}
          maximumZ={19}
          minimumZ={3}
          tileSize={256}
          flipY={false}
        // Attribution is required by OSM + CartoDB licenses
        // (shown in the attribution overlay below)
        />

        {/* ── Route polyline (Rendered first so markers are on top) ─────── */}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#10B981"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        )}

        {/* ── Geofence circle around destination ────────────────── */}
        {destination && geofenceRadius > 0 && (
          <Circle
            center={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            radius={geofenceRadius}
            strokeColor="rgba(16,185,129,0.7)"
            strokeWidth={2}
            fillColor="rgba(16,185,129,0.10)"
            zIndex={2}
          />
        )}

        {/* ── User location marker (Always at real GPS) ─────────── */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            tracksViewChanges={false}
            zIndex={10}
          >
            <UserMarker
              heading={userHeading}
              isRideActive={isRideActive}
            />
          </Marker>
        )}

        {/* ── Start marker (if manual or previewing) ──────────────── */}
        {!isRideActive && routeCoords.length > 0 && (
          <Marker
            coordinate={routeCoords[0]}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            zIndex={5}
          >
            <View style={markerStyles.destWrap}>
              <View style={[markerStyles.endLabel, { backgroundColor: '#3B82F6' }]}>
                <Text style={markerStyles.labelText}>START</Text>
              </View>
              <View style={[markerStyles.pinHead, { backgroundColor: '#3B82F6' }]}>
                <View style={markerStyles.pinInner} />
              </View>
              <View style={[markerStyles.pinTip, { borderTopColor: '#3B82F6' }]} />
            </View>
          </Marker>
        )}

        {/* ── Destination marker ─────────────────────────────────── */}
        {destination && (
          <Marker
            coordinate={{
              latitude: destination.latitude,
              longitude: destination.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            zIndex={6}
          >
            <DestinationMarker />
          </Marker>
        )}

        {/* ── Group member markers ────────────────────────────────── */}
        {activeMembers.map((member) => (
          <Marker
            key={member.id}
            coordinate={{
              latitude: member.latitude!,
              longitude: member.longitude!,
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
            zIndex={8}
          >
            <MemberMarker member={member} />
          </Marker>
        ))}
      </MapView>

      {/* ── Attribution (required by OSM + CartoDB licenses) ───────── */}
      <View
        style={[
          styles.attribution,
          isDarkTheme ? styles.attributionDark : styles.attributionLight,
        ]}
        pointerEvents="none"
      >
        <Text style={styles.attributionText}>
          © OpenStreetMap contributors{isDarkTheme ? ' © CARTO' : ''}
        </Text>
      </View>
    </View>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  attribution: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  attributionDark: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  attributionLight: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  attributionText: {
    fontSize: 8,
    color: '#ccc',
  },
});

const markerStyles = StyleSheet.create({
  // ── User marker (Nav Arrow) ──────────────────────────────────────
  userWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  navArrowContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrowMain: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFD700', // Premium Gold
    transform: [{ translateY: -2 }],
  },
  navArrowShadow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 24,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(0,0,0,0.25)',
    transform: [{ translateY: 1 }, { scale: 1.05 }],
    zIndex: -1,
  },
  userCoreDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    elevation: 3,
  },

  // ── Destination marker (Premium 3D Pin) ───────────────────────────
  destWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 80,
  },
  premiumPinContainer: {
    alignItems: 'center',
  },
  pinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  pinInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -5,
  },
  pinShadow: {
    width: 14,
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 7,
    marginTop: 2,
    transform: [{ scaleX: 2 }],
  },
  startLabel: {
    position: 'absolute',
    top: -28,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 4,
  },
  endLabel: {
    position: 'absolute',
    top: 5,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 4,
  },
  labelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  // ── Member marker ────────────────────────────────────────────────
  memberWrap: {
    alignItems: 'center',
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 4,
  },
  memberImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  memberInitials: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: 'bold',
  },
  memberNamePill: {
    marginTop: 3,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    maxWidth: 100,
  },
  memberNameText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default MapplsMapView;
