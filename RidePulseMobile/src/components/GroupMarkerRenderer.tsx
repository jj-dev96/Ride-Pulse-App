import React, { memo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Marker as RNMarker } from 'react-native-maps';
import { GroupMember, GroupSOSAlert } from '../types';

interface GroupMarkerRendererProps {
    members: GroupMember[];
    userId: string;
    sosAlerts?: GroupSOSAlert[];
}

const GroupMemberMarker: React.FC<{ member: GroupMember; isSOS?: boolean }> = memo(({ member, isSOS }) => {
    const color = isSOS ? '#FF3B30' : (member.color || '#FF3B30');

    // Pulse animation for SOS
    const sosAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (isSOS) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(sosAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                    Animated.timing(sosAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            sosAnim.setValue(0);
        }
    }, [isSOS]);

    return (
        <View style={styles.memberWrap}>
            <View style={styles.labelContainer}>
                <Text style={styles.labelText}>{member.username || member.name}</Text>
            </View>
            <View style={[styles.motoCircle, { backgroundColor: color, borderColor: isSOS ? '#FFF' : '#FFF' }]}>
                {isSOS ? (
                    <Animated.View style={[styles.sosPulse, { opacity: sosAnim }]} />
                ) : (
                    <View style={styles.innerPulse} />
                )}
            </View>
        </View>
    );
});

export const GroupMarkerRenderer: React.FC<GroupMarkerRendererProps> = ({ members, userId, sosAlerts = [] }) => {
    // Exclude current user from the multiplayer markers if already rendered by local GPS marker
    const others = members.filter(m => m.id !== userId);

    return (
        <>
            {others.map(member => {
                const hasSOS = sosAlerts.some(a => a.triggeredBy === member.id && a.status === 'active');
                return member.latitude && member.longitude && (
                    <RNMarker
                        key={`rider-${member.id}`}
                        coordinate={{ latitude: member.latitude, longitude: member.longitude }}
                        tracksViewChanges={false}
                    >
                        <GroupMemberMarker member={member} isSOS={hasSOS} />
                    </RNMarker>
                );
            })}
        </>
    );
};

const styles = StyleSheet.create({
    memberWrap: { alignItems: 'center', justifyContent: 'center' },
    labelContainer: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    labelText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    motoCircle: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: 'white',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 3,
        justifyContent: 'center',
        alignItems: 'center'
    },
    innerPulse: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.8)'
    },
    sosPulse: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 59, 48, 0.5)',
        borderWidth: 2,
        borderColor: '#FF3B30',
    }
});
