import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import RideProgressScreen from '../screens/RideProgressScreen';
import ZoneModeScreen from '../screens/ZoneModeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1F2937',
                    borderTopColor: '#374151',
                },
                tabBarActiveTintColor: '#FFD700',
                tabBarInactiveTintColor: '#9CA3AF',
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarIcon: ({ color }) => <MaterialIcons name="dashboard" size={24} color={color} />
                }}
            />
            <Tab.Screen
                name="Ride"
                component={RideProgressScreen}
                options={{
                    tabBarIcon: ({ color }) => <MaterialIcons name="two-wheeler" size={24} color={color} />
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="ZoneMode" component={ZoneModeScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}
