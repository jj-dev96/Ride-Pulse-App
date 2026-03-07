import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where, Unsubscribe } from 'firebase/firestore';
import { GroupSOSAlert, Coordinate } from '../types';

export const SOSBroadcastService = {
    /**
     * Write an SOS alert to the group's alerts collection.
     */
    triggerSOS: async (groupId: string, userId: string, username: string, location: Coordinate) => {
        try {
            const alertsCol = collection(db, 'rides', groupId, 'alerts');
            await addDoc(alertsCol, {
                triggeredBy: userId,
                username,
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: serverTimestamp(),
                status: 'active'
            });
        } catch (error) {
            console.error('[SOSBroadcastService] Trigger failed:', error);
        }
    },

    /**
     * Subscribe to all active alerts in the group.
     */
    subscribeToGroupSOS: (groupId: string, onAlert: (alerts: GroupSOSAlert[]) => void): Unsubscribe => {
        const alertsCol = collection(db, 'rides', groupId, 'alerts');
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
