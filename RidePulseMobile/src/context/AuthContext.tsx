import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPhoneNumber,
    GoogleAuthProvider,
    signInWithCredential,
    signInAnonymously,
    ApplicationVerifier,
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Alert } from 'react-native';
import { AppUser, AuthContextValue, AuthResult } from '../types';

// ── Firestore user-doc bootstrapper ───────────────────────────────────────────
const bootstrapUserDoc = async (firebaseUser: FirebaseUser): Promise<void> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snap = await getDoc(userDocRef);
    if (!snap.exists()) {
        const year = new Date().getFullYear();
        const randomId = Math.floor(100000 + Math.random() * 900000);
        await setDoc(userDocRef, {
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || 'Rider',
            profileImage: firebaseUser.photoURL || null,
            profile: {
                profileCompleted: false,
                riderId: `RP-${year}-${randomId}`,
                role: 'Rider',
            },
            provider: firebaseUser.providerData?.[0]?.providerId || 'email',
            createdAt: new Date().toISOString(),
        });
    } else {
        // Sync display name / photo URL from provider if blank
        const data = snap.data();
        const updates: Record<string, unknown> = {};
        if (!data.name && firebaseUser.displayName) updates.name = firebaseUser.displayName;
        if (!data.profileImage && firebaseUser.photoURL) updates.profileImage = firebaseUser.photoURL;
        if (Object.keys(updates).length > 0) {
            await updateDoc(userDocRef, updates);
        }
    }
};

export const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        console.log("AuthContext: Initializing...");
        let isCancelled = false;
        let unsubProfile: (() => void) | null = null;

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
            console.log("AuthContext: onAuthStateChanged triggered, user:", firebaseUser ? firebaseUser.uid : 'null');

            if (isCancelled) return;

            // Clean up any previous profile listener before setting up a new one
            if (unsubProfile) {
                unsubProfile();
                unsubProfile = null;
            }

            if (firebaseUser) {
                // Subscribe to real-time profile updates
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
                    if (isCancelled) return;

                    let userData: AppUser = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email || '',
                        name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Rider'),
                        profile: {
                            profileCompleted: false
                        }
                    };

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        userData = { ...userData, ...data } as AppUser;

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
                    if (!isCancelled) setLoading(false);
                });
            } else {
                setUser(null);
                AsyncStorage.removeItem('user').catch(() => { });
                setLoading(false);
            }
        });

        return () => {
            isCancelled = true;
            if (unsubProfile) unsubProfile();
            unsubscribe();
        };
    }, []);

    // Global Group Listener for "Toasts"
    useEffect(() => {
        if (user?.groupId) {
            const unsub = onSnapshot(doc(db, 'rides', user.groupId), (snapshot) => {
                const data = snapshot.data() as { lastMessage?: { senderId: string; senderName: string; text: string } } | undefined;
                if (data?.lastMessage && data.lastMessage.senderId !== user.id) {
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

    const login = async (email: string, password: string): Promise<AuthResult> => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            console.error("Login Error:", err.code, err.message);
            // Return err.code so LoginScreen's substring matching (e.g. 'auth/invalid-credential') works
            return { success: false, error: err.code || err.message };
        }
    };

    const register = async (email: string, password: string): Promise<AuthResult> => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, isNewUser: true };
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            console.error("Registration Error:", err.code, err.message);
            return { success: false, error: err.code || err.message };
        }
    };

    const loginWithPhone = async (phoneNumber: string, appVerifier: ApplicationVerifier): Promise<AuthResult> => {
        try {
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            return { success: true, result: confirmationResult };
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            console.error("Phone Auth Error:", err.code, err.message);
            return { success: false, error: err.message };
        }
    };

    /**
     * Sign in with a Google idToken or accessToken (or both).
     * At least one token must be non-null.
     * This is called by GoogleSignInButton after the OAuth flow completes.
     */
    const loginWithGoogleCredential = async (
        idToken: string | null,
        accessToken?: string | null
    ): Promise<AuthResult> => {
        try {
            if (!idToken && !accessToken) {
                return { success: false, error: 'No Google token provided' };
            }
            const credential = GoogleAuthProvider.credential(idToken ?? null, accessToken ?? null);
            await signInWithCredential(auth, credential);
            // User doc creation is handled by the onSnapshot listener in useEffect
            // — no need to call bootstrapUserDoc here (avoids race condition)
            return { success: true };
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            console.error('Google Auth Error:', err.code, err.message);
            return { success: false, error: err.code || err.message };
        }
    };

    const loginAnonymouslyAuth = async (): Promise<AuthResult> => {
        try {
            await signInAnonymously(auth);
            return { success: true };
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            console.error("Anonymous Auth Error:", err.code, err.message);
            return { success: false, error: err.code || err.message };
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
        } catch (e) {
            console.log(e);
        }
    };

    const updateProfileStatus = async (data: Record<string, unknown>): Promise<AuthResult> => {
        try {
            if (!user) return { success: false, error: "No user logged in" };
            const userRef = doc(db, 'users', user.id);
            await setDoc(userRef, data, { merge: true });
            return { success: true };
        } catch (e: unknown) {
            const err = e as { message?: string };
            console.error("Update Profile Error:", e);
            return { success: false, error: err.message };
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            loading,
            login,
            register,
            loginWithPhone,
            loginWithGoogleCredential,
            loginAnonymously: loginAnonymouslyAuth,
            logout,
            updateProfileStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};
