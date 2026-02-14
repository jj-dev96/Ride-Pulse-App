import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPhoneNumber, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("AuthContext: Initializing...");
        let isCancelled = false;

        // Safety timeout: Reduced to 4s.
        const timeoutId = setTimeout(async () => {
            if (!isCancelled && loading) {
                console.warn("AuthContext: Firebase init slow. Force unlocking UI.");
                try {
                    // Try to read generic user from a non-awaited source if possible, or just default to null
                    // For now, let's just assume no user if we timed out to let them login
                    setLoading(false);
                } catch (e) {
                    console.error("AuthContext: Timeout handling error", e);
                }
            }
        }, 4000);

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log("AuthContext: onAuthStateChanged triggered");
            clearTimeout(timeoutId);

            if (isCancelled) return;
            if (firebaseUser) {
                const userData = {
                    id: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    type: 'rider'
                };

                // 1. Update State IMMEDIATELY to unblock UI
                setUser(userData);

                // 2. Persist in background (don't await)
                AsyncStorage.setItem('user', JSON.stringify(userData)).catch(e =>
                    console.error("AuthContext: Failed to save user to storage", e)
                );
            } else {
                setUser(null);
                AsyncStorage.removeItem('user').catch(e =>
                    console.error("AuthContext: Failed to remove user", e)
                );
            }

            // 3. Unlock loading screen IMMEDIATELY
            setLoading(false);
        });

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
            unsubscribe();
        };
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

    const loginWithPhone = async (phoneNumber, appVerifier) => {
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            return { success: true, result: confirmationResult };
        } catch (e) {
            console.error("Phone Auth Error:", e.code, e.message);
            return { success: false, error: e.message };
        }
    };

    const loginWithGoogleCredential = async (idToken) => {
        try {
            //Create a Google credential with the token
            const credential = GoogleAuthProvider.credential(idToken);
            // Sign-in with credential from the Google user.
            await signInWithCredential(auth, credential);
            return { success: true };
        } catch (e) {
            console.error("Google Auth Error:", e.code, e.message);
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

    const loginAnonymously = async () => {
        try {
            await import('firebase/auth').then(({ signInAnonymously }) => {
                return signInAnonymously(auth);
            });
            return { success: true };
        } catch (e) {
            console.error("Anonymous Auth Error:", e.code, e.message);
            return { success: false, error: e.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginWithPhone, loginWithGoogleCredential, loginAnonymously, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
