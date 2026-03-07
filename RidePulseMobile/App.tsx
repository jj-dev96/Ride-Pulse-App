import 'react-native-gesture-handler';
import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeMapbox } from './src/config/mapbox';

// Initialize Mapbox SDK before rendering any map component
initializeMapbox();

export default function App(): React.ReactElement {
    return (
        <AuthProvider>
            <ThemeProvider>
                <StatusBar style="auto" />
                <AppNavigator />
            </ThemeProvider>
        </AuthProvider>
    );
}
