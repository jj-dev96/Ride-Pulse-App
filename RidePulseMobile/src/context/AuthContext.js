import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPhoneNumber, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("AuthContext: Initializing...");
        let isCancelled = false;

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log("AuthContext: onAuthStateChanged triggered");

            if (isCancelled) return;
            if (firebaseUser) {
<<<<<<< HEAD
                // Fetch from firestore
                import('firebase/firestore').then(({ doc, getDoc }) => {
                    const userRef = doc(db, 'users', firebaseUser.uid);
                    getDoc(userRef).then(docSnap => {
                        let additionalData = {};
                        if (docSnap.exists()) {
                            additionalData = docSnap.data();
                        }

                        const userData = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                            type: 'rider',
                            profileCompleted: additionalData.profileCompleted || false,
                            skipProfileSetup: additionalData.skipProfileSetup || false,
                            ...additionalData
                        };

                        setUser(userData);
                        AsyncStorage.setItem('user', JSON.stringify(userData)).catch(e =>
                            console.error("AuthContext: Failed to save user to storage", e)
                        );
                        setLoading(false);
                    }).catch(err => {
                        console.error("AuthContext: Error fetching user data", err);
                        // Fallback
                        const userData = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                            type: 'rider',
                            profileCompleted: false,
                            skipProfileSetup: false
                        };
                        setUser(userData);
                        setLoading(false);
                    });
                });
            } else {
                setUser(null);
                AsyncStorage.removeItem('user').catch(e =>
                    console.error("AuthContext: Failed to remove user", e)
                );
=======
                // Subscribe to real-time profile updates
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
                    let userData = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Rider'),
                        profile: {
                            profileCompleted: false
                        }
                    };

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        userData = { ...userData, ...data };

                        // Generate Rider ID if missing
                        if (!userData.profile?.riderId) {
                            const year = new Date().getFullYear();
                            const randomId = Math.floor(100000 + Math.random() * 900000);
                            const newRiderId = `RP-${year}-${randomId}`;

                            try {
                                await updateDoc(userDocRef, {
                                    "profile.riderId": newRiderId
                                });
                                // Local update to avoid waiting for next snapshot
                                if (!userData.profile) userData.profile = {};
                                userData.profile.riderId = newRiderId;
                            } catch (err) {
                                console.error("Error saving Rider ID:", err);
                            }
                        }
                    } else {
                        // Initialize user doc if it doesn't exist
                        const year = new Date().getFullYear();
                        const randomId = Math.floor(100000 + Math.random() * 900000);
                        const initialRiderId = `RP-${year}-${randomId}`;

                        await setDoc(userDocRef, {
                            email: userData.email,
                            name: userData.name,
                            profile: {
                                profileCompleted: false,
                                riderId: initialRiderId,
                                role: 'Rider'
                            },
                            createdAt: new Date().toISOString()
                        });
                        userData.profile.riderId = initialRiderId;
                        userData.profile.role = 'Rider';
                    }

                    setUser(userData);
                    AsyncStorage.setItem('user', JSON.stringify(userData)).catch(() => { });
                    setLoading(false);
                }, (error) => {
                    console.error("AuthContext: Profile Snapshot Error", error);
                    setLoading(false);
                });

                return unsubProfile;
            } else {
                setUser(null);
                AsyncStorage.removeItem('user').catch(() => { });
>>>>>>> feb14-version
                setLoading(false);
            }
        });

        return () => {
            isCancelled = true;
            unsubscribe();
        };
    }, []);

    // Global Group Listener for "Toasts"
    useEffect(() => {
        if (user?.groupId) {
            const unsub = onSnapshot(doc(db, 'groups', user.groupId), (snapshot) => {
                const data = snapshot.data();
                if (data?.lastMessage && data.lastMessage.senderId !== user.id) {
                    // We'd ideally store lastMsgId in state to avoid re-triggering on local updates
                    Alert.alert(
                        `Ride Alert: ${data.lastMessage.senderName}`,
                        data.lastMessage.text,
                        [{ text: "OK" }]
                    );
                }
            });
            return unsub;
        }
    }, [user?.groupId]);

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
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // New user, will need profile setup
            return { success: true, isNewUser: true };
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
            const credential = GoogleAuthProvider.credential(idToken);
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

<<<<<<< HEAD
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

    const updateProfileStatus = async (data) => {
        try {
            if (!user) return { success: false, error: "No user logged in" };
            const { doc, setDoc } = await import('firebase/firestore');
            const userRef = doc(db, 'users', user.id);
            await setDoc(userRef, data, { merge: true });

            const newUserData = { ...user, ...data };
            setUser(newUserData);
            await AsyncStorage.setItem('user', JSON.stringify(newUserData));
            return { success: true };
        } catch (e) {
            console.error("Update Profile Error:", e);
            return { success: false, error: e.message };
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginWithPhone, loginWithGoogleCredential, loginAnonymously, logout, updateProfileStatus }}>
=======
    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            loading,
            login,
            register,
            loginWithPhone,
            loginWithGoogleCredential,
            logout
        }}>
>>>>>>> feb14-version
            {children}
        </AuthContext.Provider>
    );
};
