import React, { createContext } from 'react';
import { useColorScheme } from 'nativewind';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const { colorScheme, toggleColorScheme } = useColorScheme();

    return (
        <ThemeContext.Provider value={{ colorScheme, toggleColorScheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
