import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    type: 'rider' // Default type
                };
                setUser(userData);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
            } else {
                setUser(null);
                await AsyncStorage.removeItem('user');
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (e) {
            console.error("Login Error:", e.code, e.message);
            return { success: false, error: e.message };
        }
    };

    const register = async (email, password) => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (e) {
            console.error("Registration Error:", e.code, e.message);
            return { success: false, error: e.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
