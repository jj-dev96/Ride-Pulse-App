import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
<<<<<<< HEAD
import { auth } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
=======
>>>>>>> 9a7a064b82aa983a9411bc3e80e0cf7ea74d8f05

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
<<<<<<< HEAD
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
=======
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    const login = async (id, name, type) => {
        try {
            const userData = { id, name, type: type || 'rider' };
            await AsyncStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return true;
        } catch (e) {
            return false;
>>>>>>> 9a7a064b82aa983a9411bc3e80e0cf7ea74d8f05
        }
    };

    const logout = async () => {
        try {
<<<<<<< HEAD
            await signOut(auth);
=======
            await AsyncStorage.removeItem('user');
            setUser(null);
>>>>>>> 9a7a064b82aa983a9411bc3e80e0cf7ea74d8f05
        } catch (e) {
            console.log(e);
        }
    };

    return (
<<<<<<< HEAD
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
=======
        <AuthContext.Provider value={{ user, loading, login, logout }}>
>>>>>>> 9a7a064b82aa983a9411bc3e80e0cf7ea74d8f05
            {children}
        </AuthContext.Provider>
    );
};
