import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { AppUser } from '../types';

export const RIDER_PALETTE = [
    '#FF5733', // Red-Orange
    '#33FF57', // Green
    '#3357FF', // Blue
    '#FF33A8', // Pink
    '#33FFF6', // Cyan
    '#FFD433', // Yellow
    '#8E33FF', // Purple
];

/**
 * Deterministic fallback: hash a userId to a palette index so the same user
 * always gets the same colour even if the Firestore `color` field is missing.
 */
export const getColorForUser = (userId: string): string => {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return RIDER_PALETTE[Math.abs(hash) % RIDER_PALETTE.length];
};

export const GroupRideManager = {
    /**
     * Assigns a unique color to a rider joining a group.
     * Checks existing members to find the next available color from the palette.
     */
    assignRiderColor: async (groupId: string): Promise<string> => {
        try {
            const membersCol = collection(db, 'rides', groupId, 'members');
            const snapshot = await getDocs(membersCol);
            const takenColors = snapshot.docs.map(d => d.data().color).filter(Boolean);

            // Find first color not in takenColors
            const availableColor = RIDER_PALETTE.find(c => !takenColors.includes(c)) || RIDER_PALETTE[0];
            return availableColor;
        } catch (error) {
            console.error('[GroupRideManager] Error assigning color:', error);
            return RIDER_PALETTE[0];
        }
    },

    /**
     * Checks if group ride features should be active for the current user.
     */
    isGroupModeEnabled: (user: AppUser | null): boolean => {
        return !!(user && user.groupId);
    }
};
