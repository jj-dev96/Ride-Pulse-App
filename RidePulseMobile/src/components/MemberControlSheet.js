import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GroupService } from '../services/GroupService';

const MemberControlSheet = ({ visible, onClose, group, user }) => {
    if (!visible || !group) return null;

    const isHost = group.hostId === user?.id;

    const handleRemove = async (memberId, memberName) => {
        if (!isHost) {
            Alert.alert("Permission Denied", "Only the host can remove members.");
            return;
        }

        Alert.alert(
            "Remove Member",
            `Are you sure you want to remove ${memberName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        await GroupService.kickMember(group.id, memberId);
                        // Send system message
                        await GroupService.sendMessage(group.id, {
                            id: Date.now().toString(),
                            sender: 'system',
                            text: `${memberName} has left the ride`,
                            timestamp: new Date().toISOString()
                        });
                        Alert.alert("Success", `${memberName} removed from ride.`);
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join my active ride on RidePulse! Use access code: ${group.id}`,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>MEMBER CONTROL</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.addMemberBtn} onPress={handleShare}>
                        <MaterialIcons name="person-add" size={24} color="black" />
                        <Text style={styles.addMemberText}>INVITE MIGHTY RIDERS</Text>
                    </TouchableOpacity>

                    <Text style={styles.sectionTitle}>ACTIVE MEMBERS ({group.members?.length || 0})</Text>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                        {group.members && group.members.map((member) => (
                            <View key={member.id} style={styles.memberItem}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{member.name ? member.name.charAt(0).toUpperCase() : 'U'}</Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{member.name} {member.id === group.hostId ? '(Host)' : ''}</Text>
                                    <Text style={styles.memberStatus}>Active</Text>
                                </View>

                                {isHost && member.id !== user.id && (
                                    <TouchableOpacity
                                        style={styles.removeBtn}
                                        onPress={() => handleRemove(member.id, member.name)}
                                    >
                                        <MaterialIcons name="person-remove" size={24} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    sheet: {
        backgroundColor: '#161925',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '70%',
        borderWidth: 1,
        borderColor: '#374151',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    addMemberBtn: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginBottom: 20,
    },
    addMemberText: {
        color: 'black',
        fontWeight: 'bold',
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    sectionTitle: {
        color: '#9CA3AF',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 10,
        letterSpacing: 1,
    },
    list: {
        paddingBottom: 20,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberStatus: {
        color: '#10B981',
        fontSize: 12,
    },
    removeBtn: {
        padding: 5,
    },
});

export default MemberControlSheet;
