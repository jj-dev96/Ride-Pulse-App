import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert, Share } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GroupService } from '../services/GroupService';
import { RideGroup, RideMember } from '../types';

interface MemberControlSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Pass either groupId+userId OR group+user for backward compatibility */
    group?: RideGroup | null;
    user?: { id: string;[key: string]: unknown } | null;
    groupId?: string;
    userId?: string;
    onOpenChat?: () => void;
    onOpenQuickMessages?: () => void;
}

const MemberControlSheet: React.FC<MemberControlSheetProps> = ({
    visible, onClose, group: groupProp, user: userProp,
    groupId: groupIdProp, userId: userIdProp,
    onOpenChat, onOpenQuickMessages
}) => {
    const [group, setGroup] = useState<RideGroup | null>(groupProp || null);

    // If groupId is provided instead of group object, load group data
    useEffect(() => {
        if (groupProp) {
            setGroup(groupProp);
            return;
        }
        if (groupIdProp && visible) {
            const unsub = GroupService.subscribeToGroup(groupIdProp, (data) => {
                if (data) setGroup(data as RideGroup);
            });
            return unsub;
        }
    }, [groupProp, groupIdProp, visible]);

    const resolvedUserId = userProp?.id || userIdProp;

    if (!visible || !group) return null;
    const isHost = group.hostId === resolvedUserId;

    const handleRemove = async (memberId: string, memberName: string): Promise<void> => {
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
                        await GroupService.leaveGroup(group.id, memberId);
                        Alert.alert("Success", `${memberName} removed from ride.`);
                    }
                }
            ]
        );
    };

    const handleShare = async (): Promise<void> => {
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

                    <View style={styles.primaryActions}>
                        <TouchableOpacity style={[styles.actionBox, { backgroundColor: '#FFD700' }]} onPress={handleShare}>
                            <MaterialIcons name="person-add" size={24} color="black" />
                            <Text style={styles.actionBoxText}>INVITE</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBox, { backgroundColor: '#3B82F6' }]} onPress={() => { onClose(); onOpenChat?.(); }}>
                            <MaterialIcons name="chat" size={24} color="white" />
                            <Text style={[styles.actionBoxText, { color: 'white' }]}>CHAT</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionBox, { backgroundColor: '#8B5CF6' }]} onPress={() => { onClose(); onOpenQuickMessages?.(); }}>
                            <MaterialIcons name="flash-on" size={24} color="white" />
                            <Text style={[styles.actionBoxText, { color: 'white' }]}>ALERTS</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionTitle}>ACTIVE MEMBERS ({group.members?.length || 0})</Text>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                        {group.members && group.members.map((member: RideMember) => (
                            <View key={member.id} style={styles.memberItem}>
                                <View style={styles.avatar}>
                                    <Text style={styles.avatarText}>{member.name ? member.name.charAt(0).toUpperCase() : 'U'}</Text>
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{member.name} {member.id === group.hostId ? '(Host)' : ''}</Text>
                                    <Text style={styles.memberStatus}>Active</Text>
                                </View>

                                {isHost && resolvedUserId && member.id !== resolvedUserId && (
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

                    <View style={styles.footer}>
                        {isHost ? (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                                onPress={() => {
                                    Alert.alert("End Ride", "Terminate group ride for all members?", [
                                        { text: "Cancel" },
                                        {
                                            text: "End Ride", onPress: async () => {
                                                await GroupService.updateRideStatus(group.id, 'completed');
                                                await GroupService.leaveGroup(group.id, resolvedUserId!);
                                                onClose();
                                            }
                                        }
                                    ]);
                                }}
                            >
                                <MaterialIcons name="stop" size={20} color="white" />
                                <Text style={styles.actionBtnText}>END GROUP RIDE</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: '#374151' }]}
                                onPress={() => {
                                    Alert.alert("Leave Ride", "Are you sure you want to leave this group?", [
                                        { text: "Cancel" },
                                        {
                                            text: "Leave", onPress: async () => {
                                                await GroupService.leaveGroup(group.id, resolvedUserId!);
                                                onClose();
                                            }
                                        }
                                    ]);
                                }}
                            >
                                <MaterialIcons name="exit-to-app" size={20} color="white" />
                                <Text style={styles.actionBtnText}>LEAVE RIDE</Text>
                            </TouchableOpacity>
                        )}
                    </View>
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
    primaryActions: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    actionBox: {
        flex: 1,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    actionBoxText: {
        color: 'black',
        fontWeight: '900',
        fontSize: 10,
        marginTop: 4,
        letterSpacing: 1,
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
    footer: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#374151',
        paddingTop: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 10,
    },
    actionBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    }
});

export default MemberControlSheet;
