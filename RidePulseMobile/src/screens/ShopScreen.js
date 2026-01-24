import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ShopScreen = () => {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F111A', '#161925', '#0F111A']}
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <FontAwesome5 name="shopping-bag" size={60} color="#FFD700" />
                    <View style={styles.iconGlow} />
                </View>

                <Text style={styles.title}>RIDER STORE</Text>
                <Text style={styles.subtitle}>Gear up for your next adventure.</Text>

                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>COMING SOON</Text>
                </View>

                <Text style={styles.description}>
                    We are building a premium marketplace for riders.
                    Expect exclusive gear, parts, and accessories tailored for your machine.
                </Text>

                <TouchableOpacity style={styles.notifyButton}>
                    <MaterialIcons name="notifications-active" size={20} color="black" />
                    <Text style={styles.notifyButtonText}>NOTIFY ME WHEN LIVE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconGlow: {
        position: 'absolute',
        width: 100,
        height: 100,
        backgroundColor: '#FFD700',
        borderRadius: 50,
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 2,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: 30,
        textAlign: 'center',
    },
    badgeContainer: {
        backgroundColor: '#FFD70020',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
        marginBottom: 30,
    },
    badgeText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
        letterSpacing: 1,
    },
    description: {
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        fontSize: 14,
    },
    notifyButton: {
        flexDirection: 'row',
        backgroundColor: '#FFD700',
        paddingVertical: 16,
        paddingHorizontal: 30,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    notifyButtonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 10,
        letterSpacing: 1,
    }
});

export default ShopScreen;
