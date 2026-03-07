import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';

export interface RideMessage {
    id: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: any;
}

export const RideChatService = {
    /**
     * Feature 10: Enable lightweight group communication.
     */
    sendMessage: async (rideId: string, senderId: string, senderName: string, message: string) => {
        try {
            const chatCol = collection(db, 'rides', rideId, 'messages');
            await addDoc(chatCol, {
                senderId,
                senderName,
                message,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('[RideChatService] Send failed:', error);
        }
    },

    listenToChat: (rideId: string, onUpdate: (messages: RideMessage[]) => void): Unsubscribe => {
        const chatCol = collection(db, 'rides', rideId, 'messages');
        const q = query(chatCol, orderBy('timestamp', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as RideMessage));
            onUpdate(messages);
        });
    }
};
