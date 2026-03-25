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
    deleteField,
    Unsubscribe
} from 'firebase/firestore';
import { AppUser, RideDetails, RideGroup, RideMember, GroupData } from '../types';
import { RIDER_PALETTE } from './GroupRideManager';

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
                rideId: groupId,        // As per spec
                hostId: user.id,
                leaderId: user.id,      // As per spec
                hostName: user.name,
                username: user.name,
                rideName: rideDetails.name || `${user.name}'s Ride`,
                startLocation: rideDetails.startLocation || 'My Location',
                destination: rideDetails.destination || 'TBD',
                rideType: rideDetails.rideType || 'Outbound',
                createdAt: serverTimestamp(),
                status: 'waiting' as const,
                rideStatus: 'waiting'    // As per spec
            };

            await setDoc(doc(db, 'rides', groupId), rideData);

            // Add host as first member in subcollection
            const color = RIDER_PALETTE[0]; // Host always red
            const memberRef = doc(db, 'rides', groupId, 'members', user.id);
            await setDoc(memberRef, {
                id: user.id,
                name: user.name,
                profileImage: user.profileImage || null,
                vehicle: user.vehicle || null,
                isOnline: true,
                role: 'host',
                color,
                joinedAt: serverTimestamp()
            });

            // Link group ID to user profile for persistent state
            await updateDoc(doc(db, 'users', user.id), { groupId });

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
                const colorsCol = collection(db, 'rides', groupId, 'members');
                const membersSnap = await getDocs(colorsCol);
                const takenColors = membersSnap.docs.map(d => d.data().color).filter(Boolean);
                const color = RIDER_PALETTE.find(c => !takenColors.includes(c)) || RIDER_PALETTE[0];

                await setDoc(memberRef, {
                    id: user.id,
                    name: user.name,
                    profileImage: user.profileImage || null,
                    vehicle: user.vehicle || null,
                    isOnline: true,
                    role: 'member',
                    color,
                    joinedAt: serverTimestamp()
                });
            } else {
                await updateDoc(memberRef, { isOnline: true });
            }

            // Link group ID to user profile for persistent state
            await updateDoc(doc(db, 'users', user.id), { groupId });

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

            // CRITICAL: Clear groupId from user profile to prevent stale session on reload
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { groupId: null });
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
            const updateData: Record<string, any> = { status };
            // Save a startedAt timestamp when ride goes active so all members can sync timers
            if (status === 'active') {
                updateData.startedAt = new Date().toISOString();
            }
            await updateDoc(rideRef, updateData);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    },

    /**
     * Complete a ride: marks status as "completed", clears every participant's
     * groupId so they can immediately create or join a new ride.
     */
    completeRide: async (groupId: string): Promise<void> => {
        try {
            // 1. Mark ride document as completed
            const rideRef = doc(db, 'rides', groupId);
            await updateDoc(rideRef, {
                status: 'completed',
                rideStatus: 'completed',
                completedAt: serverTimestamp()
            });

            // 2. Clear groupId from every participant's user document
            const membersSnap = await getDocs(collection(db, 'rides', groupId, 'members'));
            const clearPromises = membersSnap.docs.map(memberDoc => {
                const userId = memberDoc.id;
                const userRef = doc(db, 'users', userId);
                return updateDoc(userRef, { groupId: deleteField() }).catch(err =>
                    console.warn(`[completeRide] Failed to clear groupId for ${userId}:`, err)
                );
            });
            await Promise.all(clearPromises);

            // 3. Mark all members as offline
            const offlinePromises = membersSnap.docs.map(memberDoc => {
                const memberRef = doc(db, 'rides', groupId, 'members', memberDoc.id);
                return updateDoc(memberRef, { isOnline: false }).catch(() => { });
            });
            await Promise.all(offlinePromises);
        } catch (error) {
            console.error("Error completing ride:", error);
            throw error;
        }
    },

    // Get the active group for a user
    getUserActiveGroup: async (userId: string): Promise<GroupData | null> => {
        try {
            // 1. Check user doc for current groupId first
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            const currentGid = userSnap.data()?.groupId;

            if (currentGid) {
                const rideRef = doc(db, 'rides', currentGid);
                const rideSnap = await getDoc(rideRef);

                if (rideSnap.exists()) {
                    const rideData = rideSnap.data();

                    // Staleness check: if group is in 'waiting' for > 4 hours, consider it abandoned
                    const createdAt = rideData.createdAt?.toDate ? rideData.createdAt.toDate() : (rideData.createdAt ? new Date(rideData.createdAt) : new Date());
                    const isStale = rideData.status === 'waiting' && (Date.now() - createdAt.getTime() > 4 * 60 * 60 * 1000);

                    const isActive = (rideData.status === 'waiting' || rideData.status === 'active' || rideData.rideStatus === 'active') && !isStale;

                    if (isActive) {
                        // IMPORTANT: verify the user is actually in the members subcollection
                        const memberRef = doc(db, 'rides', currentGid, 'members', userId);
                        const memberSnap = await getDoc(memberRef);

                        if (memberSnap.exists()) {
                            return { id: rideSnap.id, ...rideData } as GroupData;
                        }

                        // User is NOT a member — stale groupId, clean it up
                        console.warn(`[getUserActiveGroup] User ${userId} has groupId=${currentGid} but is not in members. Clearing.`);
                        await updateDoc(userRef, { groupId: deleteField() }).catch(() => { });
                        return null;
                    }

                    // Ride exists but is completed, cancelled or stale — auto-clear stale groupId
                    console.log(`[getUserActiveGroup] Cleaning up inactive/stale group: ${currentGid}`);
                    await updateDoc(userRef, { groupId: deleteField() }).catch(() => { });
                } else {
                    // Ride doc doesn't exist at all — clear the dangling pointer
                    await updateDoc(userRef, { groupId: deleteField() }).catch(() => { });
                }
            }

            // If we reach here the user has no valid group — make sure groupId is clean
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

    // Update ride destination & route for all members
    updateRideDestination: async (
        groupId: string,
        destination: string,
        coords: { latitude: number; longitude: number },
        routeCoords?: any[],
        distance?: string,
        eta?: string
    ): Promise<void> => {
        try {
            const rideRef = doc(db, 'rides', groupId);
            await updateDoc(rideRef, {
                destination,
                destinationCoords: coords,
                destinationCoordinates: coords, // As per spec
                routeCoords: routeCoords || [],
                routeGeometry: routeCoords || [], // As per spec
                distance: distance || '',
                eta: eta || ''
            });
        } catch (error) {
            console.error("Error updating ride destination:", error);
        }
    }
};
