import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { LineChart } from 'react-native-chart-kit';

const DashboardScreen = ({ navigation }) => {
    const { user } = useContext(AuthContext);
    const screenWidth = Dimensions.get('window').width;

    const chartConfig = {
        backgroundGradientFrom: "#1E2923",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#08130D",
        backgroundGradientToOpacity: 0,
        color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`, // Gold
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false
    };

    const data = {
        labels: ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25"],
        datasets: [
            {
                data: [0, 45, 28, 80, 99, 43],
                color: (opacity = 1) => `rgba(255, 215, 0, ${opacity})`,
                strokeWidth: 2
            }
        ],
        legend: ["Speed (km/h)"]
    };

    return (
        <ScrollView className="flex-1 bg-background-light dark:bg-background-dark">
            {/* Header */}
            <View className="px-6 pt-12 pb-4 flex-row justify-between items-center bg-white dark:bg-card-dark shadow-sm">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full items-center justify-center border border-primary">
                        <Text className="text-xl font-bold text-gray-700 dark:text-gray-300">
                            {user?.name?.charAt(0).toUpperCase() || 'R'}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-xl font-bold text-gray-800 dark:text-white">
                            Ride<Text className="text-primary">Pulse</Text>
                        </Text>
                        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider">
                            TELEMETRY ANALYTICS
                        </Text>
                    </View>
                </View>
                <View className="flex-row gap-3">
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ZoneMode')}
                        className="w-10 h-10 bg-red-500/10 rounded-full items-center justify-center border border-red-500/50"
                    >
                        <MaterialIcons name="speed" size={24} color="#EF4444" />
                    </TouchableOpacity>
                    <TouchableOpacity className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700">
                        <MaterialIcons name="notifications-none" size={24} color={user ? "#FFD700" : "#9CA3AF"} />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="p-4 space-y-6">
                {/* Live Session Replay Card */}
                <View className="bg-white dark:bg-card-dark rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-800">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-base font-bold text-gray-700 dark:text-gray-200 flex-row items-center">
                            <MaterialIcons name="history" size={18} color="#FFD700" style={{ marginRight: 8 }} />
                            Live Session Replay
                        </Text>
                        <View className="px-2 py-1 bg-red-500/10 rounded border border-red-500/20">
                            <Text className="text-red-500 text-[10px] font-bold">LIVE</Text>
                        </View>
                    </View>

                    {/* Chart Container */}
                    <View className="items-center justify-center overflow-hidden rounded-lg bg-gray-900 mb-4 h-48">
                        <LineChart
                            data={data}
                            width={screenWidth - 64}
                            height={180}
                            chartConfig={chartConfig}
                            bezier
                            style={{
                                borderRadius: 8
                            }}
                            withDots={false}
                            withInnerLines={false}
                            withOuterLines={false}
                        />
                    </View>

                    {/* Controls */}
                    <View className="flex-row justify-center gap-6">
                        <TouchableOpacity><MaterialIcons name="replay-10" size={24} color="#9CA3AF" /></TouchableOpacity>
                        <TouchableOpacity className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center border border-primary">
                            <MaterialIcons name="pause" size={24} color="#FFD700" />
                        </TouchableOpacity>
                        <TouchableOpacity><MaterialIcons name="forward-10" size={24} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                </View>

                {/* Grid Stats */}
                <View className="flex-row gap-4">
                    {/* Lean Angle */}
                    <View className="flex-1 bg-white dark:bg-card-dark p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-gray-500 text-xs font-semibold">LEAN ANGLE</Text>
                            <MaterialIcons name="sync" size={16} color="#FFD700" />
                        </View>
                        <Text className="text-3xl font-bold dark:text-white">48°</Text>
                        <Text className="text-xs text-gray-400">Left</Text>
                    </View>

                    {/* G-Force */}
                    <View className="flex-1 bg-white dark:bg-card-dark p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-gray-500 text-xs font-semibold">MAX G-FORCE</Text>
                            <MaterialIcons name="explore" size={16} color="#FFD700" />
                        </View>
                        <Text className="text-3xl font-bold dark:text-white">1.2G</Text>
                        <Text className="text-xs text-gray-400">Braking</Text>
                    </View>
                </View>

                {/* Bike Status */}
                <View className="bg-white dark:bg-card-dark p-4 rounded-xl shadow-md border border-gray-100 dark:border-gray-800">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-base font-bold text-gray-700 dark:text-gray-200">
                            Machine Status
                        </Text>
                        <Text className="text-primary font-bold">YZF-R1M</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-gray-500 text-xs">Engine Temp</Text>
                                <Text className="text-gray-300 text-xs">89°C</Text>
                            </View>
                            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <View className="h-full w-3/4 bg-green-500 rounded-full" />
                            </View>
                        </View>
                        <View>
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-gray-500 text-xs">Fuel Level</Text>
                                <Text className="text-gray-300 text-xs">45%</Text>
                            </View>
                            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <View className="h-full w-[45%] bg-yellow-500 rounded-full" />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    );
};

export default DashboardScreen;
