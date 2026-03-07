import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { GroupSOSAlert as SOSAlertType } from '../types';
import { MaterialIcons } from '@expo/vector-icons';

interface GroupSOSAlertProps {
    alert: SOSAlertType;
    onNavigate: () => void;
    onDismiss: () => void;
}

export const GroupSOSAlert: React.FC<GroupSOSAlertProps> = ({ alert, onNavigate, onDismiss }) => {
    const flashAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(flashAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(flashAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [flashAnim]);

    const backgroundColor = flashAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(239, 68, 68, 0.9)', 'rgba(239, 68, 68, 0.4)']
    });

    return (
        <Animated.View style={[styles.container, { backgroundColor }]}>
            <View style={styles.iconContainer}>
                <MaterialIcons name="warning" size={24} color="white" />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>SOS ALERT: {alert.username}</Text>
                <Text style={styles.subtitle}>Emergency reported at rider location</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity style={styles.navBtn} onPress={onNavigate}>
                    <MaterialIcons name="directions" size={18} color="black" />
                    <Text style={styles.navBtnText}>NAVIGATE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
                    <MaterialIcons name="close" size={20} color="white" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 110,
        left: 20,
        right: 20,
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1000,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        elevation: 15,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    subtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: 11,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 6,
        marginRight: 8,
    },
    navBtnText: {
        color: 'black',
        fontSize: 10,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    dismissBtn: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
