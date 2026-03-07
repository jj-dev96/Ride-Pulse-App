import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, Unsubscribe } from 'firebase/firestore';

export interface GroupMessage {
    id?: string;
    senderId: string;
    senderName: string;
    message: string;
    timestamp: any;
}

export const GroupChatService = {
    /**
     * Send a lightweight group communication message.
     */
    sendMessage: async (groupId: string, senderId: string, senderName: string, message: string) => {
        try {
            const messagesCol = collection(db, 'rides', groupId, 'messages');
            await addDoc(messagesCol, {
                senderId,
                senderName,
                message,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('[GroupChatService] Send failed:', error);
        }
    },

    /**
     * Listen for real-time messages in the group.
     */
    listenForMessages: (groupId: string, onNewMessage: (messages: GroupMessage[]) => void): Unsubscribe => {
        const messagesCol = collection(db, 'rides', groupId, 'messages');
        const q = query(messagesCol, orderBy('timestamp', 'desc'), limit(50));

        return onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data()
            } as GroupMessage)).reverse();
            onNewMessage(msgs);
        });
    }
};
