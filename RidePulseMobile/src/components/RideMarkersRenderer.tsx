import React, { memo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Marker as RNMarker } from 'react-native-maps';
import { GroupMember, GroupSOSAlert } from '../types';
import { getColorForUser } from '../services/GroupRideManager';

interface RideMarkersRendererProps {
    members: GroupMember[];
    userId: string;
    sosAlerts?: GroupSOSAlert[];
    leaderId?: string;
}

/**
 * Prominent colored name-tag marker for each rider.
 * Shows a bold pill with the rider's unique color + name,
 * and a triangular pointer beneath it.
 */
const RiderTagMarker: React.FC<{
    member: GroupMember;
    isSOS?: boolean;
    isLeader?: boolean;
}> = memo(({ member, isSOS, isLeader }) => {
    // Per-rider color from Firestore, with hash fallback
    const riderColor = member.color || getColorForUser(member.id);
    const tagColor = isSOS ? '#FF3B30' : riderColor;

    // SOS flashing glow
    const sosAnim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
        if (isSOS) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(sosAnim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
                    Animated.timing(sosAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                ])
            ).start();
        } else {
            sosAnim.setValue(1);
        }
    }, [isSOS]);

    const displayName = member.username || member.name || '?';
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <Animated.View style={[styles.tagWrapper, { opacity: isSOS ? sosAnim : 1 }]}>
            {/* ── Main colored tag pill ── */}
            <View style={[
                styles.tagPill,
                {
                    backgroundColor: tagColor,
                    paddingHorizontal: isLeader ? 14 : 10,
                    paddingVertical: isLeader ? 8 : 6,
                    borderWidth: isLeader ? 2.5 : 1.5,
                },
            ]}>
                {/* Round avatar circle with initial */}
                <View style={[
                    styles.tagAvatar,
                    {
                        width: isLeader ? 26 : 22,
                        height: isLeader ? 26 : 22,
                        borderRadius: isLeader ? 13 : 11,
                    },
                ]}>
                    <Text style={[
                        styles.tagAvatarText,
                        { fontSize: isLeader ? 12 : 10 },
                    ]}>
                        {isLeader ? '👑' : initial}
                    </Text>
                </View>

                {/* Name text */}
                <Text
                    style={[
                        styles.tagName,
                        { fontSize: isLeader ? 13 : 11 },
                    ]}
                    numberOfLines={1}
                >
                    {displayName}
                </Text>

                {/* SOS badge */}
                {isSOS && (
                    <View style={styles.sosBadge}>
                        <Text style={styles.sosBadgeText}>SOS</Text>
                    </View>
                )}
            </View>

            {/* ── Downward arrow pointer ── */}
            <View style={[
                styles.tagArrow,
                {
                    borderTopColor: tagColor,
                    borderTopWidth: isLeader ? 10 : 8,
                    borderLeftWidth: isLeader ? 8 : 6,
                    borderRightWidth: isLeader ? 8 : 6,
                },
            ]} />
        </Animated.View>
    );
});

export const RideMarkersRenderer: React.FC<RideMarkersRendererProps> = ({
    members,
    userId,
    sosAlerts = [],
    leaderId,
}) => {
    // Show all members except ourselves
    const others = members.filter(m => m.id !== userId);

    return (
        <>
            {others.map(member => {
                const hasSOS = sosAlerts.some(
                    a => a.triggeredBy === member.id && a.status === 'active'
                );

                if (!member.latitude || !member.longitude) return null;

                const isLeader =
                    member.id === leaderId ||
                    member.role === 'host' ||
                    member.role === 'leader';

                return (
                    <RNMarker
                        key={`rider-${member.id}`}
                        coordinate={{
                            latitude: member.latitude,
                            longitude: member.longitude,
                        }}
                        tracksViewChanges={isSOS(member, sosAlerts)}
                        anchor={{ x: 0.5, y: 1 }}
                    >
                        <RiderTagMarker
                            member={member}
                            isSOS={hasSOS}
                            isLeader={isLeader}
                        />
                    </RNMarker>
                );
            })}
        </>
    );
};

/** Helper to decide if we need view tracking (only for SOS animate) */
function isSOS(member: GroupMember, alerts: GroupSOSAlert[]): boolean {
    return alerts.some(a => a.triggeredBy === member.id && a.status === 'active');
}

const styles = StyleSheet.create({
    tagWrapper: {
        alignItems: 'center',
    },
    tagPill: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        borderColor: 'rgba(255,255,255,0.9)',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        gap: 6,
    },
    tagAvatar: {
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagAvatarText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    tagName: {
        color: '#fff',
        fontWeight: 'bold',
        maxWidth: 90,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    tagArrow: {
        width: 0,
        height: 0,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -1,
    },
    sosBadge: {
        backgroundColor: '#fff',
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 1,
        marginLeft: 2,
    },
    sosBadgeText: {
        color: '#FF3B30',
        fontSize: 8,
        fontWeight: 'bold',
    },
});
