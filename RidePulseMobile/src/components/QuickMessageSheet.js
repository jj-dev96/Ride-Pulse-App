import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const messages = [
    "Stopping for fuel",
    "Brake check",
    "Take left",
    "Take right",
    "Slow down",
    "Speed up",
    "Emergency stop",
    "Need help",
    "Regroup",
    "Reached destination"
];

const QuickMessageSheet = ({ visible, onClose, onSelect }) => {
    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>QUICK MESSAGES</Text>
                        <TouchableOpacity onPress={onClose}>
                            <MaterialIcons name="close" size={24} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                        {messages.map((msg, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.msgItem}
                                onPress={() => {
                                    onSelect(msg);
                                    onClose();
                                }}
                            >
                                <MaterialIcons name="chat-bubble-outline" size={20} color="#FFD700" />
                                <Text style={styles.msgText}>{msg}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    sheet: {
        backgroundColor: '#161925',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        maxHeight: '60%',
        borderWidth: 1,
        borderColor: '#374151',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    list: {
        paddingBottom: 20,
    },
    msgItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    msgText: {
        color: 'white',
        fontSize: 16,
        marginLeft: 15,
    },
});

export default QuickMessageSheet;
