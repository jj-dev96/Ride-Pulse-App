/**
 * RiderMarker.tsx
 *
 * Displays a single group rider on overlying UI (used when react-native-maps
 * native markers are not available, e.g. inside a WebView map).
 *
 * For native react-native-maps usage, wrap in <Marker> and pass as children.
 *
 * Props:
 *   member   - AnimatedMember from useGroupTracking
 *   isHost   - renders a gold crown badge
 *   size     - avatar diameter (default 44)
 */

import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Animated,
    ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedMember } from '../hooks/useGroupTracking';

// ── Props ──────────────────────────────────────────────────────────────────────

interface RiderMarkerProps {
    member: AnimatedMember;
    isHost?: boolean;
    size?: number;
    style?: ViewStyle;
}

// ── Component ──────────────────────────────────────────────────────────────────

const RiderMarker: React.FC<RiderMarkerProps> = ({
    member,
    isHost = false,
    size = 44,
    style,
}) => {
    // Pulse animation for the ring
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.3,
                    duration: 900,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    const avatarSize = size;
    const ringSize = size + 10;
    const borderRadius = avatarSize / 2;
    const ringBorderRadius = ringSize / 2;

    const ringColor = isHost ? '#FFD700' : '#10B981';
    const statusColor = member.isOnline ? '#22C55E' : '#6B7280';

    return (
        <View style={[styles.container, style]}>
            {/* Pulsing ring */}
            <Animated.View
                style={[
                    styles.pulseRing,
                    {
                        width: ringSize,
                        height: ringSize,
                        borderRadius: ringBorderRadius,
                        borderColor: ringColor,
                        transform: [{ scale: pulseAnim }],
                    },
                ]}
            />

            {/* Avatar */}
            <View
                style={[
                    styles.avatarContainer,
                    {
                        width: avatarSize,
                        height: avatarSize,
                        borderRadius,
                        borderColor: ringColor,
                    },
                ]}
            >
                {member.profileImage ? (
                    <Image
                        source={{ uri: member.profileImage }}
                        style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius }]}
                        resizeMode="cover"
                    />
                ) : (
                    <View
                        style={[
                            styles.initialsContainer,
                            { width: avatarSize, height: avatarSize, borderRadius },
                        ]}
                    >
                        <Text style={[styles.initials, { fontSize: avatarSize * 0.35 }]}>
                            {getInitials(member.name)}
                        </Text>
                    </View>
                )}

                {/* Online status dot */}
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />

                {/* Host crown badge */}
                {isHost && (
                    <View style={styles.crownBadge}>
                        <MaterialIcons name="star" size={10} color="#0F111A" />
                    </View>
                )}
            </View>

            {/* Name label */}
            <View style={styles.namePill}>
                <Text style={styles.nameText} numberOfLines={1}>
                    {member.name || 'Rider'}
                </Text>
                {typeof member.speed === 'number' && member.speed > 0 && (
                    <Text style={styles.speedText}> · {Math.round(member.speed)} km/h</Text>
                )}
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
        alignItems: 'center',
    },
    pulseRing: {
        position: 'absolute',
        borderWidth: 2,
        opacity: 0.4,
    },
    avatarContainer: {
        borderWidth: 2.5,
        overflow: 'visible',
    },
    avatar: {},
    initialsContainer: {
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    statusDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#0F111A',
    },
    crownBadge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#FFD700',
        borderRadius: 8,
        width: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    namePill: {
        flexDirection: 'row',
        marginTop: 4,
        backgroundColor: 'rgba(0,0,0,0.72)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
        maxWidth: 120,
    },
    nameText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '700',
    },
    speedText: {
        color: '#9CA3AF',
        fontSize: 9,
    },
});

export default RiderMarker;
