import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const quickMessages = [
    { id: 'fuel', icon: 'local-gas-station', label: 'Fuel', message: 'Stopping for fuel' },
    { id: 'brake', icon: 'warning', label: 'Brake', message: 'Brake check' },
    { id: 'left', icon: 'west', label: 'Left', message: 'Take left' },
    { id: 'right', icon: 'east', label: 'Right', message: 'Take right' },
    { id: 'slow', icon: 'speed', label: 'Slow', message: 'Slow down' },
    { id: 'speed', icon: 'fast-forward', label: 'Speed', message: 'Speed up' },
    { id: 'stop', icon: 'dangerous', label: 'SOS stop', message: 'Emergency stop' },
    { id: 'help', icon: 'help-outline', label: 'Help', message: 'Need help' },
    { id: 'regroup', icon: 'people', label: 'Regroup', message: 'Regroup' },
    { id: 'done', icon: 'check-circle', label: 'Arrived', message: 'Reached destination' },
];

interface QuickMessageSheetProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (message: string) => void;
}

const QuickMessageSheet: React.FC<QuickMessageSheetProps> = ({ visible, onClose, onSelect }) => {
    const [customMsg, setCustomMsg] = useState('');

    if (!visible) return null;

    const handleSendCustom = () => {
        if (customMsg.trim()) {
            onSelect(customMsg.trim());
            setCustomMsg('');
            onClose();
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <View style={styles.overlay}>
                    <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                    <View style={styles.sheet}>
                        <View style={styles.header}>
                            <Text style={styles.title}>QUICK ACTIONS</Text>
                            <TouchableOpacity onPress={onClose}>
                                <MaterialIcons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.grid}>
                            {quickMessages.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.gridItem}
                                    onPress={() => {
                                        onSelect(item.message);
                                        onClose();
                                    }}
                                >
                                    <View style={styles.iconCircle}>
                                        <MaterialIcons name={item.icon as any} size={28} color="#FFD700" />
                                    </View>
                                    <Text style={styles.iconLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.customContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Type custom message..."
                                placeholderTextColor="#9CA3AF"
                                value={customMsg}
                                onChangeText={setCustomMsg}
                                onSubmitEditing={handleSendCustom}
                            />
                            <TouchableOpacity
                                style={[styles.sendBtn, !customMsg.trim() && { opacity: 0.5 }]}
                                onPress={handleSendCustom}
                                disabled={!customMsg.trim()}
                            >
                                <MaterialIcons name="send" size={24} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    sheet: {
        backgroundColor: '#161925',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderWidth: 1,
        borderColor: '#374151',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    gridItem: {
        width: '18%',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1F2937',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#374151',
        marginBottom: 8,
    },
    iconLabel: {
        color: '#9CA3AF',
        fontSize: 10,
        fontWeight: '600',
    },
    customContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: '#374151',
    },
    input: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        paddingHorizontal: 12,
        height: 48,
    },
    sendBtn: {
        width: 40,
        height: 40,
        backgroundColor: '#FFD700',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
});

export default QuickMessageSheet;
