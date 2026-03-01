import { db } from '../config/firebase';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';

const generateGroupId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const GroupService = {
    // Create a new ride group
    createGroup: async (user, rideDetails = {}) => {
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
                status: 'waiting' // waiting, active, completed, cancelled
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
    joinGroup: async (groupId, user) => {
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

            return rideSnap.data();
        } catch (error) {
            console.error("Error joining ride:", error);
            throw error;
        }
    },

    // Leave ride
    leaveGroup: async (groupId, userId) => {
        try {
            const memberRef = doc(db, 'rides', groupId, 'members', userId);
            await updateDoc(memberRef, { isOnline: false });
            // In a real app, you might delete the doc or just set offline
            // For now let's delete to keep list clean
            // await deleteDoc(memberRef); 
        } catch (error) {
            console.error("Error leaving ride:", error);
        }
    },

    // Real-time subscription to Ride AND Members
    subscribeToGroup: (groupId, onUpdate) => {
        const rideRef = doc(db, 'rides', groupId);
        return onSnapshot(rideRef, (doc) => {
            if (doc.exists()) {
                onUpdate(doc.data());
            } else {
                onUpdate(null);
            }
        });
    },

    subscribeToMembers: (groupId, onUpdate) => {
        const membersRef = collection(db, 'rides', groupId, 'members');
        return onSnapshot(membersRef, (snapshot) => {
            const members = snapshot.docs.map(doc => doc.data());
            onUpdate(members);
        });
    },

    // Update ride status
    updateRideStatus: async (groupId, status) => {
        try {
            const rideRef = doc(db, 'rides', groupId);
            await updateDoc(rideRef, { status });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }
};
