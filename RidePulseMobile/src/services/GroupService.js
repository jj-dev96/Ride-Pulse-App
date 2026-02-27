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
    // Create a new group
    createGroup: async (user) => {
        try {
            let groupId = generateGroupId();
            let isUnique = false;

            // Ensure uniqueness (simple check)
            // In production, might want a more robust way or just handle collision
            while (!isUnique) {
                const docRef = doc(db, 'groups', groupId);
                const docSnap = await getDoc(docRef);
                if (!docSnap.exists()) {
                    isUnique = true;
                } else {
                    groupId = generateGroupId();
                }
            }

            const groupData = {
                id: groupId,
                hostId: user.id,
                hostName: user.name,
                members: [{
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    joinedAt: new Date().toISOString()
                }],
                createdAt: serverTimestamp(),
                status: 'waiting' // waiting, active, finished
            };

            await setDoc(doc(db, 'groups', groupId), groupData);
            return groupId;
        } catch (error) {
            console.error("Error creating group:", error);
            throw error;
        }
    },

    // Join an existing group
    joinGroup: async (groupId, user) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) {
                throw new Error("Group not found");
            }

            const groupData = groupSnap.data();

            // Check if already a member
            if (groupData.members.some(m => m.id === user.id)) {
                return groupData; // Already joined
            }

            const newMember = {
                id: user.id,
                name: user.name,
                email: user.email,
                joinedAt: new Date().toISOString()
            };

            await updateDoc(groupRef, {
                members: arrayUnion(newMember)
            });

            return { ...groupData, members: [...groupData.members, newMember] };
        } catch (error) {
            console.error("Error joining group:", error);
            throw error;
        }
    },

    // Leave group
    leaveGroup: async (groupId, userId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);

            if (!groupSnap.exists()) return;

            const groupData = groupSnap.data();
            const memberToRemove = groupData.members.find(m => m.id === userId);

            if (memberToRemove) {
                await updateDoc(groupRef, {
                    members: arrayRemove(memberToRemove)
                });
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            throw error;
        }
    },

    // Real-time subscription
    subscribeToGroup: (groupId, onUpdate) => {
        const groupRef = doc(db, 'groups', groupId);
        return onSnapshot(groupRef, (doc) => {
            if (doc.exists()) {
                onUpdate(doc.data());
            } else {
                onUpdate(null);
            }
        });
    },

    getUserActiveGroup: async (userId) => {
        try {
            const { collection, query, getDocs } = await import('firebase/firestore');
            const groupsRef = collection(db, 'groups');
            const q = query(groupsRef);
            const snapshot = await getDocs(q);

            let activeGroup = null;
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                if ((data.status === 'waiting' || data.status === 'active') && data.members.some(m => m.id === userId)) {
                    activeGroup = data;
                }
            });
            return activeGroup;
        } catch (error) {
            console.error(error);
            return null;
        }
    },

    kickMember: async (groupId, memberId) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            const groupSnap = await getDoc(groupRef);
            if (!groupSnap.exists()) return;
            const groupData = groupSnap.data();
            const memberToRemove = groupData.members.find(m => m.id === memberId);
            if (memberToRemove) {
                await updateDoc(groupRef, {
                    members: arrayRemove(memberToRemove)
                });
            }
        } catch (error) {
            console.error("Error kicking member:", error);
        }
    },

    sendMessage: async (groupId, messageObj) => {
        try {
            const groupRef = doc(db, 'groups', groupId);
            await updateDoc(groupRef, {
                messages: arrayUnion(messageObj)
            });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }
};
