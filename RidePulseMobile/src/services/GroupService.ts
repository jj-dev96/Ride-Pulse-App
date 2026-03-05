import { db } from '../config/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    query,
    where,
    getDocs,
    serverTimestamp,
    Unsubscribe
} from 'firebase/firestore';
import { AppUser, RideDetails, RideGroup, RideMember, GroupData } from '../types';

const generateGroupId = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const GroupService = {
    // Create a new ride group
    createGroup: async (user: AppUser, rideDetails: RideDetails = {}): Promise<string> => {
        // Validate profile completion
        if (!user?.profile?.profileCompleted) {
            throw new Error("Please complete your profile details before hosting a ride.");
        }
        try {
            let groupId = generateGroupId();
            let isUnique = false;

            while (!isUnique) {
                const docRef = doc(db, 'rides', groupId);
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    isUnique = true;
                } else {
                    groupId = generateGroupId();
                }
            }

            const rideData = {
                id: groupId,
                hostId: user.id,
                hostName: user.name,
                rideName: rideDetails.name || `${user.name}'s Ride`,
                startLocation: rideDetails.startLocation || 'My Location',
                destination: rideDetails.destination || 'TBD',
                rideType: rideDetails.rideType || 'Outbound',
                createdAt: serverTimestamp(),
                status: 'waiting' as const
            };

            await setDoc(doc(db, 'rides', groupId), rideData);

            // Add host as first member in subcollection
            const memberRef = doc(db, 'rides', groupId, 'members', user.id);
            await setDoc(memberRef, {
                id: user.id,
                name: user.name,
                profileImage: user.profileImage || null,
                vehicle: user.vehicle || null,
                isOnline: true,
                role: 'host',
                joinedAt: serverTimestamp()
            });

            return groupId;
        } catch (error) {
            console.error("Error creating ride:", error);
            throw error;
        }
    },

    // Join an existing ride
    joinGroup: async (groupId: string, user: AppUser): Promise<Record<string, unknown> | undefined> => {
        // Validate profile completion
        if (!user?.profile?.profileCompleted) {
            throw new Error("Please complete your profile details before joining a ride.");
        }
        try {
            const rideRef = doc(db, 'rides', groupId);
            const rideSnap = await getDoc(rideRef);

            if (!rideSnap.exists()) {
                throw new Error("Ride not found");
            }

            const memberRef = doc(db, 'rides', groupId, 'members', user.id);
            const memberSnap = await getDoc(memberRef);

            if (!memberSnap.exists()) {
                await setDoc(memberRef, {
                    id: user.id,
                    name: user.name,
                    profileImage: user.profileImage || null,
                    vehicle: user.vehicle || null,
                    isOnline: true,
                    role: 'member',
                    joinedAt: serverTimestamp()
                });
            } else {
                await updateDoc(memberRef, { isOnline: true });
            }

            return rideSnap.data() as Record<string, unknown>;
        } catch (error) {
            console.error("Error joining ride:", error);
            throw error;
        }
    },

    // Leave ride
    leaveGroup: async (groupId: string, userId: string): Promise<void> => {
        try {
            const memberRef = doc(db, 'rides', groupId, 'members', userId);
            await updateDoc(memberRef, { isOnline: false });
        } catch (error) {
            console.error("Error leaving ride:", error);
        }
    },

    // Real-time subscription to Ride
    subscribeToGroup: (groupId: string, onUpdate: (group: RideGroup | GroupData | null) => void): Unsubscribe => {
        const rideRef = doc(db, 'rides', groupId);
        return onSnapshot(rideRef, (snapshot) => {
            if (snapshot.exists()) {
                onUpdate(snapshot.data() as RideGroup);
            } else {
                onUpdate(null);
            }
        });
    },

    subscribeToMembers: (groupId: string, onUpdate: (members: RideMember[]) => void): Unsubscribe => {
        const membersRef = collection(db, 'rides', groupId, 'members');
        return onSnapshot(membersRef, (snapshot) => {
            const members = snapshot.docs.map(d => d.data() as RideMember);
            onUpdate(members);
        });
    },

    // Update ride status
    updateRideStatus: async (groupId: string, status: string): Promise<void> => {
        try {
            const rideRef = doc(db, 'rides', groupId);
            await updateDoc(rideRef, { status });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    },

    // Get the active group for a user
    getUserActiveGroup: async (userId: string): Promise<GroupData | null> => {
        try {
            const ridesRef = collection(db, 'rides');
            const q = query(ridesRef, where('status', 'in', ['waiting', 'active']));
            const snapshot = await getDocs(q);
            for (const docSnap of snapshot.docs) {
                const memberRef = doc(db, 'rides', docSnap.id, 'members', userId);
                const memberSnap = await getDoc(memberRef);
                if (memberSnap.exists() && memberSnap.data().isOnline) {
                    return { id: docSnap.id, ...docSnap.data() } as GroupData;
                }
            }
            return null;
        } catch (error) {
            console.error("Error getting active group:", error);
            return null;
        }
    },

    // Send a message to the group
    sendMessage: async (groupId: string, message: { id: string; sender: string; text: string; timestamp: string; senderId?: string }): Promise<void> => {
        try {
            const msgRef = doc(db, 'rides', groupId, 'messages', message.id);
            await setDoc(msgRef, {
                ...message,
                senderId: message.senderId || message.id,
                senderName: message.sender,
                createdAt: serverTimestamp(),
            });
            await updateDoc(doc(db, 'rides', groupId), {
                lastMessage: { senderId: message.senderId || message.id, senderName: message.sender, text: message.text }
            });
        } catch (error) {
            console.error("Error sending message:", error);
            throw error; // Propagate so the caller can handle
        }
    },

    // Update a member's real-time location
    updateMemberLocation: async (
        groupId: string,
        userId: string,
        location: { latitude: number; longitude: number; speed: number; heading: number }
    ): Promise<void> => {
        try {
            const memberRef = doc(db, 'rides', groupId, 'members', userId);
            await updateDoc(memberRef, { ...location, lastUpdated: serverTimestamp() });
        } catch (error) {
            console.error("Error updating member location:", error);
        }
    },

    // Broadcast a message to all group members
    broadcastMessage: async (
        groupId: string,
        message: { senderId: string; senderName: string; text: string; timestamp: string }
    ): Promise<void> => {
        try {
            const msgId = `broadcast_${Date.now()}`;
            const msgRef = doc(db, 'rides', groupId, 'messages', msgId);
            await setDoc(msgRef, { id: msgId, ...message });
        } catch (error) {
            console.error("Error broadcasting message:", error);
        }
    },
};
