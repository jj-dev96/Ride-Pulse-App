import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Lazy load MapView to prevent Web crash
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const RideProgressScreen = ({ navigation }) => {
    const [speed, setSpeed] = useState(118);
    const [isSOSActive, setIsSOSActive] = useState(false);

    // Mock speed fluctuation
    useEffect(() => {
        const interval = setInterval(() => {
            setSpeed(prev => {
                const change = Math.random() > 0.5 ? 1 : -1;
                return prev + change;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleSOS = () => {
        setIsSOSActive(!isSOSActive);
    };

    return (
        <View className="flex-1 bg-black relative">
            {Platform.OS !== 'web' && MapView ? (
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFill}
                    customMapStyle={mapDarkStyle}
                    initialRegion={{
                        latitude: 34.0522,
                        longitude: -118.2437,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                >
                    <Marker coordinate={{ latitude: 34.0522, longitude: -118.2437 }}>
                        <View className="bg-primary/50 p-2 rounded-full border border-primary">
                            <MaterialIcons name="two-wheeler" size={24} color="#FFD700" />
                        </View>
                    </Marker>
                </MapView>
            ) : (
                <View className="absolute inset-0 bg-gray-900 justify-center items-center">
                    <MaterialIcons name="map" size={80} color="#333" />
                    <Text className="text-gray-500 mt-4 font-bold">MAP VIEW UNAVAILABLE ON WEB</Text>
                    <Text className="text-gray-600 text-xs mt-1">Please use the mobile app for full experience</Text>
                </View>
            )}

            {/* Gradient Overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                className="absolute inset-0 pointer-events-none"
            />

            {/* HUD Content */}
            <View className="absolute inset-0 z-10 p-4 justify-between pb-12">
                {/* Top Bar */}
                <View className="flex-row justify-between items-start pt-8">
                    <View className="bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-md">
                        <Text className="text-gray-400 text-xs font-bold uppercase mb-1">Leaderboard</Text>
                        <View className="space-y-1">
                            <View className="flex-row justify-between w-32">
                                <Text className="text-primary text-sm font-bold">1. Alex</Text>
                                <Text className="text-primary text-sm">124 km/h</Text>
                            </View>
                            <View className="flex-row justify-between w-32">
                                <Text className="text-white text-sm font-bold">2. You</Text>
                                <Text className="text-white text-sm">118 km/h</Text>
                            </View>
                        </View>
                    </View>

                    <View className="bg-black/60 rounded-full px-4 py-2 flex-row items-center border border-white/10">
                        <MaterialIcons name="music-note" size={20} color="#FFD700" />
                        <View className="ml-2">
                            <Text className="text-white text-xs font-bold">Born to be Wild</Text>
                            <Text className="text-gray-400 text-[10px]">Steppenwolf</Text>
                        </View>
                    </View>
                </View>

                {/* Center Speed */}
                <View className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center">
                    <Text className="text-8xl font-black text-white italic tracking-tighter" style={{ textShadowColor: 'rgba(255, 215, 0, 0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>
                        {speed}
                    </Text>
                    <Text className="text-primary text-xl font-bold uppercase tracking-[0.4em] -mt-2">km/h</Text>
                </View>

                {/* Right Actions */}
                <View className="absolute right-4 bottom-32 items-end space-y-4">
                    <TouchableOpacity
                        onPress={toggleSOS}
                        className={`w-12 h-12 rounded-full items-center justify-center border ${isSOSActive ? 'bg-red-500 border-red-500 animate-pulse' : 'bg-black/60 border-red-500/50'}`}
                    >
                        <MaterialIcons name="warning" size={24} color={isSOSActive ? 'white' : '#EF4444'} />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-12 h-12 bg-black/60 rounded-full items-center justify-center border border-white/20">
                        <MaterialIcons name="my-location" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Bottom Controls */}
                <View className="flex-row justify-between items-end">
                    <TouchableOpacity className="w-14 h-14 bg-black/60 rounded-full items-center justify-center border border-primary/50 shadow-lg shadow-primary/20">
                        <MaterialIcons name="smart-toy" size={28} color="#FFD700" />
                    </TouchableOpacity>

                    {/* End Ride Button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="flex-1 mx-4 h-14 bg-white/10 rounded-full border border-white/20 items-center justify-center flex-row"
                    >
                        <Text className="text-white font-bold tracking-widest uppercase ml-2">End Ride</Text>
                        <MaterialIcons name="stop" size={24} color="white" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TouchableOpacity className="w-14 h-14 bg-black/60 rounded-full items-center justify-center border border-white/20">
                        <MaterialIcons name="chat" size={24} color="white" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const mapDarkStyle = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#263c3f" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#6b9a76" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#1f2835" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#515c6d" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#17263c" }]
    }
];

export default RideProgressScreen;
