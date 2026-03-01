import React, { useContext, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthContext } from '../context/AuthContext';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// Screens
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import StatsScreen from '../screens/StatsScreen';
import LobbyScreen from '../screens/LobbyScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

import ShopScreen from '../screens/ShopScreen';
import CartScreen from '../screens/CartScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import WishlistScreen from '../screens/WishlistScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SmartGarageScreen from '../screens/SmartGarageScreen';
import RideProgressScreen from '../screens/RideProgressScreen';
import ZoneModeScreen from '../screens/ZoneModeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const CustomTabBar = ({ state, descriptors, navigation }) => {
    return (
        <View style={styles.tabBarContainer}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name);
                    }
                };

                // Icons mapping
                const getIcon = (name, color) => {
                    switch (name) {
                        case 'Map': return <Ionicons name="map" size={24} color={color} />;
                        case 'Stats': return <Ionicons name="stats-chart" size={24} color={color} />;
                        case 'Shop': return <FontAwesome5 name="shopping-bag" size={20} color={color} />;
                        case 'Settings': return <Ionicons name="settings" size={24} color={color} />;
                        default: return <MaterialIcons name="help" size={24} color={color} />;
                    }
                };

                // Center logo route (Lobby)
                if (route.name === 'CenterLogo') {
                    return (
                        <TouchableOpacity
                            key={index}
                            style={styles.centerButtonContainer}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('CenterLogo')}
                        >
                            <View style={styles.centerButton}>
                                <FontAwesome5 name="motorcycle" size={24} color="black" />
                            </View>
                        </TouchableOpacity>
                    );
                }

                return (
                    <TouchableOpacity
                        key={index}
                        onPress={onPress}
                        style={styles.tabItem}
                        activeOpacity={0.7}
                    >
                        {getIcon(route.name, isFocused ? '#FFD700' : '#6B7280')}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

function MainTabs() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Map" component={DashboardScreen} />
            <Tab.Screen name="Stats" component={StatsScreen} />
            <Tab.Screen name="CenterLogo" component={LobbyScreen} />
            <Tab.Screen name="Shop" component={ShopScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading } = useContext(AuthContext);

    useEffect(() => {
        console.log("AppNavigator: Loading state:", loading, "User state:", user ? "Logged In" : "Not Logged In");
    }, [loading, user]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    <>
                        <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen name="ZoneMode" component={ZoneModeScreen} />
                        <Stack.Screen name="SmartGarage" component={SmartGarageScreen} />
                        <Stack.Screen name="RideProgress" component={RideProgressScreen} />
                        <Stack.Screen name="Cart" component={CartScreen} />
                        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
                        <Stack.Screen name="Wishlist" component={WishlistScreen} />
                    </>
                ) : (
                    <Stack.Screen name="Login" component={LoginScreen} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        flexDirection: 'row',
        backgroundColor: '#161925',
        height: 70,
        borderTopWidth: 1,
        borderTopColor: '#1F2937',
        alignItems: 'center',
        paddingHorizontal: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerButtonContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
    },
    centerButton: {
        width: 56,
        height: 56,
        backgroundColor: '#FFD700',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30, // Lifted up
        borderWidth: 4,
        borderColor: '#0F111A',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F111A',
    },
});
