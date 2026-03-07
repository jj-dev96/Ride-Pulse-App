import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RiderFormation } from '../services/FormationService';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GroupFormationPanelProps {
    formations: RiderFormation[];
}

export const GroupFormationPanel: React.FC<GroupFormationPanelProps> = ({ formations }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (formations.length === 0) return null;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    const leader = formations.find(f => f.isLeader);

    return (
        <View style={[styles.container, isExpanded && styles.containerExpanded]}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={toggleExpand}
                style={styles.header}
            >
                <View style={styles.pillIndicator}>
                    <MaterialIcons name="groups" size={16} color="#FFD700" />
                    <Text style={styles.headerText}>
                        {formations.length} Riders • {leader?.username || 'Group'} leading
                    </Text>
                    <MaterialIcons
                        name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                        size={20}
                        color="#9CA3AF"
                    />
                </View>
            </TouchableOpacity>

            {isExpanded && (
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title}>FORMATION SUMMARY</Text>
                    </View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {formations.map((rider, index) => (
                            <View key={rider.id} style={[styles.riderCard, rider.isLeader && styles.leaderCard]}>
                                <View style={[styles.colorBar, { backgroundColor: rider.color || '#374151' }]} />
                                <Text style={styles.rank}>{index + 1}️⃣</Text>
                                <View>
                                    <Text style={styles.username} numberOfLines={1}>{rider.username}</Text>
                                    <Text style={styles.distance}>
                                        {rider.isLeader ? 'Leader' : `${rider.distanceBehind}m behind`}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 155, // Clear search bar completely
        left: 20,
        right: 20,
        backgroundColor: 'rgba(22, 25, 37, 0.95)',
        borderRadius: 25, // Pill shape for collapsed
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        zIndex: 100,
        elevation: 10,
        overflow: 'hidden',
    },
    containerExpanded: {
        borderRadius: 16,
    },
    header: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    content: {
        padding: 12,
        paddingTop: 0,
    },
    titleRow: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        paddingTop: 8,
        marginBottom: 10,
    },
    title: {
        color: '#FFD700',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 2,
        textAlign: 'center',
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    riderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginRight: 10,
        minWidth: 110,
        overflow: 'hidden'
    },
    colorBar: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4
    },
    leaderCard: {
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    rank: {
        fontSize: 16,
        marginRight: 6,
    },
    username: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    distance: {
        color: '#9CA3AF',
        fontSize: 10,
    },
});
