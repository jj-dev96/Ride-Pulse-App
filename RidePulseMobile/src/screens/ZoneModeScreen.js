import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ZoneModeScreen = ({ navigation }) => {
    const [speed, setSpeed] = useState(142);

    useEffect(() => {
        const interval = setInterval(() => {
            setSpeed(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                return prev + change;
            });
        }, 100); // Faster updates for "Zone" fee
        return () => clearInterval(interval);
    }, []);

    return (
        <View className="flex-1 bg-black relative">
            <StatusBar hidden />

            {/* Scaning Line Animation (Simple Overlay for now, could be Reanimated) */}
            <LinearGradient
                colors={['transparent', 'rgba(255, 0, 0, 0.1)', 'transparent']}
                className="absolute inset-0 z-0"
            />

            {/* Top Info */}
            <View className="flex-row justify-between p-6 z-10">
                <View>
                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Mode</Text>
                    <Text className="text-xl font-bold italic text-red-500 uppercase">HYPER-FOCUS</Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Time</Text>
                    <Text className="text-xl font-mono text-white">09:42</Text>
                </View>
            </View>

            {/* Center Speed */}
            <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center w-full z-10">
                <Text className="text-9xl font-black text-white tracking-tighter" style={{ fontSize: 120 }}>
                    {speed}
                </Text>
                <Text className="text-3xl font-bold uppercase tracking-[0.5em] text-gray-500 -mt-4">km/h</Text>
            </View>

            {/* Bottom Tech */}
            <View className="absolute bottom-0 w-full p-8 z-10">
                {/* RPM Bar */}
                <View className="w-full h-8 bg-gray-900 border border-gray-800 relative overflow-hidden transform skew-x-[-20deg]">
                    <LinearGradient
                        colors={['#333', '#FF0000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="h-full w-[85%]"
                    />
                </View>
                <View className="flex-row justify-between mt-2 font-mono text-xs text-red-500">
                    <Text>0</Text>
                    <Text>5</Text>
                    <Text>10</Text>
                    <Text className="text-white font-bold">15</Text>
                </View>

                {/* Exit Button */}
                <View className="items-center mt-12">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="px-12 py-4 border border-gray-800 active:bg-red-500/10 active:border-red-500"
                    >
                        <Text className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase">Exit Zone</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default ZoneModeScreen;
