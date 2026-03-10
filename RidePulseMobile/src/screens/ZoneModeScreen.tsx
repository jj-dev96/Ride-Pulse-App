import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ZoneMode'>;

const ZoneModeScreen: React.FC<Props> = ({ navigation }) => {
    const [speed, setSpeed] = useState<number>(142);

    useEffect(() => {
        const interval = setInterval(() => {
            setSpeed(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                return prev + change;
            });
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <LinearGradient
                colors={['transparent', 'rgba(255, 0, 0, 0.1)', 'transparent']}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.topInfo}>
                <View>
                    <Text style={styles.label}>Mode</Text>
                    <Text style={styles.modeValue}>HYPER-FOCUS</Text>
                </View>
                <View style={styles.rightAlign}>
                    <Text style={styles.label}>Time</Text>
                    <Text style={styles.timeValue}>09:42</Text>
                </View>
            </View>

            <View style={styles.centerSpeed}>
                <Text style={styles.speedValue}>{speed}</Text>
                <Text style={styles.speedUnit}>km/h</Text>
            </View>

            <View style={styles.bottomTech}>
                <View style={styles.rpmBarContainer}>
                    <LinearGradient
                        colors={['#333', '#FF0000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.rpmGradient}
                    />
                </View>
                <View style={styles.rpmLabels}>
                    <Text style={styles.rpmLabelText}>0</Text>
                    <Text style={styles.rpmLabelText}>5</Text>
                    <Text style={styles.rpmLabelText}>10</Text>
                    <Text style={styles.rpmLabelTextWhite}>15</Text>
                </View>

                <View style={styles.exitContainer}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.exitButton}
                    >
                        <Text style={styles.exitText}>Exit Zone</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    topInfo: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, zIndex: 10 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    modeValue: { fontSize: 20, fontWeight: 'bold', fontStyle: 'italic', color: '#ef4444', textTransform: 'uppercase' },
    rightAlign: { alignItems: 'flex-end' },
    timeValue: { fontSize: 20, color: 'white' },
    centerSpeed: { position: 'absolute', top: '40%', alignSelf: 'center', alignItems: 'center', zIndex: 10 },
    speedValue: { fontSize: 120, fontWeight: '900', color: 'white' },
    speedUnit: { fontSize: 30, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 8, color: '#6b7280', marginTop: -10 },
    bottomTech: { position: 'absolute', bottom: 0, width: '100%', padding: 32, zIndex: 10 },
    rpmBarContainer: { width: '100%', height: 32, backgroundColor: '#111827', borderColor: '#1f2937', borderWidth: 1, overflow: 'hidden', transform: [{ skewX: '-20deg' }] },
    rpmGradient: { height: '100%', width: '85%' },
    rpmLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    rpmLabelText: { fontSize: 12, color: '#ef4444' },
    rpmLabelTextWhite: { fontSize: 12, color: 'white', fontWeight: 'bold' },
    exitContainer: { alignItems: 'center', marginTop: 48 },
    exitButton: { paddingHorizontal: 48, paddingVertical: 16, borderColor: '#1f2937', borderWidth: 1 },
    exitText: { color: '#6b7280', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase' },
});

export default ZoneModeScreen;
