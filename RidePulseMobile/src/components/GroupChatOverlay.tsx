import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { RideMessage } from '../services/RideChatService';
import { MaterialIcons } from '@expo/vector-icons';

interface GroupChatOverlayProps {
    messages: RideMessage[];
    onSendMessage: (text: string) => void;
    onClose: () => void;
    quickMessages?: string[];
}

export const GroupChatOverlay: React.FC<GroupChatOverlayProps> = ({
    messages,
    onSendMessage,
    onClose,
    quickMessages = ["Fueling", "Brake check", "Slow down", "Speed up", "Need help", "Regroup"]
}) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (text.trim()) {
            onSendMessage(text.trim());
            setText('');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardContainer}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>GROUP CHAT</Text>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialIcons name="close" size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={(item, index) => item.id || index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.messageRow}>
                            <Text style={styles.senderName}>{item.senderName}: </Text>
                            <Text style={styles.messageText}>{item.message}</Text>
                        </View>
                    )}
                    style={styles.list}
                    inverted={false}
                    contentContainerStyle={styles.listContent}
                />

                <View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickMsgsRow}>
                        {quickMessages.map((msg, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.quickMsgPill}
                                onPress={() => {
                                    onSendMessage(msg);
                                }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialIcons name="flash-on" size={14} color="#FFD700" style={{ marginRight: 4 }} />
                                    <Text style={styles.quickMsgText}>{msg}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#9CA3AF"
                        value={text}
                        onChangeText={setText}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                        <MaterialIcons name="send" size={20} color="black" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    keyboardContainer: {
        position: 'absolute',
        bottom: 150,
        left: 20,
        right: 20,
        zIndex: 100,
    },
    container: {
        backgroundColor: 'rgba(22, 25, 37, 0.95)',
        borderRadius: 16,
        padding: 16,
        height: 250,
        borderWidth: 1,
        borderColor: 'rgba(55, 65, 81, 0.5)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        elevation: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(55, 65, 81, 0.5)',
        paddingBottom: 8,
    },
    headerTitle: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    list: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 10,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 6,
        flexWrap: 'wrap',
    },
    senderName: {
        color: '#3B82F6',
        fontSize: 13,
        fontWeight: 'bold',
    },
    messageText: {
        color: 'white',
        fontSize: 13,
    },
    inputRow: {
        flexDirection: 'row',
        marginTop: 10,
        backgroundColor: 'rgba(31, 41, 55, 0.8)',
        borderRadius: 20,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        color: 'white',
        height: 40,
        fontSize: 14,
    },
    sendBtn: {
        width: 32,
        height: 32,
        backgroundColor: '#FFD700',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickMsgsRow: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(55, 65, 81, 0.3)',
    },
    quickMsgPill: {
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    quickMsgText: {
        color: '#93C5FD',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
