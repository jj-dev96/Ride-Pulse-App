import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, Unsubscribe, getDocs, writeBatch } from 'firebase/firestore';
import { GroupSOSAlert, Coordinate } from '../types';

export const SOSAlertService = {
    /**
     * Feature 9: SOS Broadcast System.
     * Triggers an emergency alert visible to all ride members.
     */
    broadcastSOS: async (rideId: string, userId: string, username: string, location: Coordinate) => {
        try {
            const alertsCol = collection(db, 'rides', rideId, 'alerts');
            await addDoc(alertsCol, {
                triggeredBy: userId,
                username,
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: serverTimestamp(),
                status: 'active'
            });
        } catch (error) {
            console.error('[SOSAlertService] Broadcast failed:', error);
        }
    },

    /**
     * Resolves and stops the SOS broadcast globally.
     */
    cancelSOS: async (rideId: string, userId: string) => {
        try {
            const alertsCol = collection(db, 'rides', rideId, 'alerts');
            const q = query(alertsCol, where('status', '==', 'active'), where('triggeredBy', '==', userId));
            const snapshot = await getDocs(q);

            if (snapshot.empty) return;

            const batch = writeBatch(db);
            snapshot.docs.forEach(docSnap => {
                batch.update(docSnap.ref, { status: 'resolved' });
            });
            await batch.commit();
        } catch (error) {
            console.error('[SOSAlertService] Cancel failed:', error);
        }
    },

    /**
     * Listen for active SOS alerts in the ride group.
     */
    listenForSOS: (rideId: string, onAlert: (alerts: GroupSOSAlert[]) => void): Unsubscribe => {
        const alertsCol = collection(db, 'rides', rideId, 'alerts');
        const q = query(alertsCol, where('status', '==', 'active'));

        return onSnapshot(q, (snapshot) => {
            const alerts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as GroupSOSAlert));
            onAlert(alerts);
        });
    }
};
