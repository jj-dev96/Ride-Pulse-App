import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AppUser } from '../types';

export const RideSessionManager = {
    /**
     * Feature 1: Initialize a session for the leader.
     */
    initializeLeaderSession: async (rideId: string, leader: AppUser) => {
        try {
            const rideRef = doc(db, 'rides', rideId);
            const rideData = {
                rideId,
                leaderId: leader.id,
                rideStatus: 'active',
                createdAt: serverTimestamp(),
                // Initial defaults
                destination: '',
                destinationCoordinates: null,
                routeGeometry: []
            };
            await setDoc(rideRef, rideData, { merge: true });
        } catch (error) {
            console.error('[RideSessionManager] Init failed:', error);
        }
    },

    /**
     * Feature 1: End ride session.
     */
    endRideSession: async (rideId: string) => {
        try {
            const rideRef = doc(db, 'rides', rideId);
            await updateDoc(rideRef, {
                rideStatus: 'completed',
                endedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('[RideSessionManager] End failed:', error);
        }
    }
};
