import React, { createContext, ReactNode, useState, useCallback } from 'react';
import { ThemeContextValue } from '../types';

// Safely import useColorScheme from nativewind — falls back to manual state
// if NativeWind isn't fully configured (prevents app crash on startup).
let useNativeWindColorScheme: (() => { colorScheme: 'light' | 'dark' | undefined; toggleColorScheme: () => void }) | null = null;
try {
    const nw = require('nativewind');
    if (nw && typeof nw.useColorScheme === 'function') {
        useNativeWindColorScheme = nw.useColorScheme;
    }
} catch {
    // NativeWind not available — we'll use the manual fallback below
}

export const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // Try NativeWind hook first; fall back to manual dark mode state
    const [manualScheme, setManualScheme] = useState<'light' | 'dark'>('dark');
    const manualToggle = useCallback(() => {
        setManualScheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    }, []);

    let colorScheme: 'light' | 'dark' | undefined;
    let toggleColorScheme: () => void;

    if (useNativeWindColorScheme) {
        const nw = useNativeWindColorScheme();
        colorScheme = nw.colorScheme;
        toggleColorScheme = nw.toggleColorScheme;
    } else {
        colorScheme = manualScheme;
        toggleColorScheme = manualToggle;
    }

    return (
        <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
