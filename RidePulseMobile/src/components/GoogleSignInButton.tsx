/**
 * GoogleSignInButton.tsx
 *
 * Self-contained Google Sign-In button that handles:
 *  - expo-auth-session / expo-auth-session/providers/google OAuth flow
 *  - Token extraction (handles both id_token and access_token paths)
 *  - Firebase credential creation & sign-in
 *  - Loading state + error feedback
 *
 * Usage:
 *   <GoogleSignInButton onSuccess={() => {}} onError={(e) => {}} />
 */

import React, { useEffect, useState } from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    View,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import {
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// REQUIRED: Complete auth session so WebBrowser redirects work on Android
WebBrowser.maybeCompleteAuthSession();

// ── Client IDs (Recommended: Move to .env for production) ───────────────
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '861623260957-cprhvegl89rp4626a17am1737iluvrju.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// ── Props ──────────────────────────────────────────────────────────────────────

interface GoogleSignInButtonProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
    label?: string;
}

// ── Component ──────────────────────────────────────────────────────────────────

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    onSuccess,
    onError,
    label = 'Continue with Google',
}) => {
    const [loading, setLoading] = useState(false);

    // ── Auth request ──────────────────────────────────────────────────────────
    const [request, response, promptAsync] = Google.useAuthRequest({
        webClientId: WEB_CLIENT_ID,
        androidClientId: ANDROID_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
        scopes: ['profile', 'email'],
        // Explicitly provide redirectUri to avoid 400 error due to mismatch
        redirectUri: makeRedirectUri({
            scheme: 'ridepulse',
            preferLocalhost: false,
        }),
    });

    // ── Handle OAuth response ─────────────────────────────────────────────────
    useEffect(() => {
        if (!response) return;

        if (response.type === 'success') {
            handleSuccessResponse(response as any);
        } else if (response.type === 'error') {
            const msg = response.error?.message || 'Google Sign-In was cancelled or failed';
            setLoading(false);
            onError?.(msg);
        } else if (response.type === 'cancel' || response.type === 'dismiss') {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [response]);

    // ── Process successful OAuth response ─────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSuccessResponse = async (resp: any) => {
        setLoading(true);
        try {
            // expo-auth-session puts tokens in authentication (TokenResponse) or params
            const authentication = resp?.authentication;
            const params = resp?.params ?? {};

            // Priority 1: id_token (signed JWT — best for Firebase)
            const idToken: string | undefined =
                authentication?.idToken ?? params?.id_token;

            // Priority 2: access_token as fallback
            const accessToken: string | undefined =
                authentication?.accessToken ?? params?.access_token;

            if (!idToken && !accessToken) {
                throw new Error('No token received from Google. Check your OAuth client configuration.');
            }

            // Build Firebase credential
            const credential = GoogleAuthProvider.credential(
                idToken ?? null,
                accessToken ?? null
            );

            await signInWithCredential(auth, credential);
            // User doc creation is handled by AuthContext's onSnapshot listener
            // — no need to create it here (avoids race condition / duplicate writes)

            onSuccess?.();
        } catch (err: any) {
            console.error('[GoogleSignInButton] Firebase sign-in error:', err);
            const msg = mapFirebaseError(err?.code, err?.message);
            Alert.alert('Google Sign-In Failed', msg);
            onError?.(msg);
        } finally {
            setLoading(false);
        }
    };

    // ── Map common Firebase error codes to user-friendly messages ─────────────
    const mapFirebaseError = (code?: string, fallback?: string): string => {
        switch (code) {
            case 'auth/account-exists-with-different-credential':
                return 'An account already exists with a different sign-in method. Try email/password login.';
            case 'auth/invalid-credential':
                return 'Google credential is invalid or expired. Please try again.';
            case 'auth/network-request-failed':
                return 'Network error. Check your internet connection and try again.';
            case 'auth/user-disabled':
                return 'This account has been disabled. Contact support.';
            case '400':
                return 'Invalid request to Google. Please check your device time, network, and try again.';
            default:
                return fallback || 'Google Sign-In failed. Please try again.';
        }
    };

    // ── Trigger flow ──────────────────────────────────────────────────────────
    const handlePress = async () => {
        if (!request) {
            Alert.alert(
                'Not Ready',
                'Google Sign-In is initialising. Please wait a moment and try again.'
            );
            return;
        }
        setLoading(true);
        try {
            await promptAsync();
        } catch (err: any) {
            setLoading(false);
            console.error('[GoogleSignInButton] promptAsync error:', err);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handlePress}
            disabled={loading || !request}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
                <View style={styles.inner}>
                    <Ionicons name="logo-google" size={20} color="#FFFFFF" />
                    <Text style={styles.label}>{label}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1F2433',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#374151',
        minHeight: 50,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    label: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
});

export default GoogleSignInButton;
