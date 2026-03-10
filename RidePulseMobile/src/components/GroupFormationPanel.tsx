import React, { useState } from 'react';
import { Modal } from 'react-native';
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
        <>
            <View style={styles.iconOnlyContainer}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={toggleExpand}
                    style={styles.iconButton}
                    accessibilityLabel="Show group info"
                >
                    <MaterialIcons name="groups" size={32} color="#FFD700" />
                </TouchableOpacity>
            </View>
            <Modal
                visible={isExpanded}
                transparent
                animationType="fade"
                onRequestClose={toggleExpand}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.container, styles.containerExpanded, styles.modalPanel]}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={toggleExpand}
                            style={[styles.header, styles.headerTouchable]}
                        >
                            <View style={styles.pillIndicator}>
                                <MaterialIcons name="groups" size={16} color="#FFD700" />
                                <Text style={styles.headerText}>
                                    {formations.length} {formations.length === 1 ? 'Rider' : 'Riders'} • {leader?.username || 'Group'} leading
                                </Text>
                                <MaterialIcons
                                    name={isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </View>
                        </TouchableOpacity>
                        <View style={styles.content}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title}>FORMATION SUMMARY</Text>
                                <TouchableOpacity
                                    onPress={toggleExpand}
                                    style={styles.closeButton}
                                    accessibilityLabel="Collapse group panel"
                                >
                                    <MaterialIcons name="close" size={18} color="#FFD700" />
                                </TouchableOpacity>
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
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    iconOnlyContainer: {
        position: 'absolute',
        top: 160, // Move higher to avoid collision
        left: 20,
        zIndex: 100,
        elevation: 12,
        backgroundColor: 'transparent',
        borderRadius: 24,
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(22, 25, 37, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#FFD700',
        elevation: 12,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        marginBottom: 2,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalPanel: {
        width: '90%',
        maxWidth: 400,
        borderRadius: 18,
        paddingBottom: 12,
        backgroundColor: 'rgba(22, 25, 37, 0.98)',
        elevation: 16,
    },
    container: {
        position: 'absolute',
        top: 210, // Clear search bar and suggestions completely
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
    headerTouchable: {
        borderRadius: 25,
        backgroundColor: 'rgba(22, 25, 37, 0.95)',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.2)',
        marginBottom: 2,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(31, 41, 55, 0.7)',
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
