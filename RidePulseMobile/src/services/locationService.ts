/**
 * locationService.ts — Real-time GPS Location Tracking
 *
 * Uses expo-location for continuous location updates.
 * Stores current location to Firestore under users/{uid}/location.
 */

import * as Location from 'expo-location';
import { db } from '../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Coordinate } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LocationUpdate {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
    altitude: number;
    accuracy: number;
    timestamp: number;
}

export interface LocationServiceConfig {
    accuracy?: Location.Accuracy;
    timeInterval?: number;      // ms between updates
    distanceInterval?: number;  // metres between updates
}

const DEFAULT_CONFIG: LocationServiceConfig = {
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 2000,
    distanceInterval: 5,
};

// ── State ─────────────────────────────────────────────────────────────────────
let _locationSubscription: Location.LocationSubscription | null = null;
let _headingSubscription: Location.LocationSubscription | null = null;
let _currentLocation: Coordinate | null = null;
let _currentHeading: number = 0;
let _firestoreThrottleTimer: ReturnType<typeof setTimeout> | null = null;

// ── Permissions ───────────────────────────────────────────────────────────────
export const requestLocationPermission = async (): Promise<boolean> => {
    try {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') {
            console.warn('[LocationService] Foreground location permission denied');
            return false;
        }
        // Optionally request background — non-blocking
        try {
            await Location.requestBackgroundPermissionsAsync();
        } catch {
            // Background permission is optional
        }
        return true;
    } catch (err) {
        console.error('[LocationService] Permission request error:', err);
        return false;
    }
};

// ── Get Current Location (one-shot) ───────────────────────────────────────────
export const getCurrentLocation = async (): Promise<Coordinate | null> => {
    try {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) return null;

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });

        const coords: Coordinate = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading ?? 0,
            speed: location.coords.speed ?? 0,
            altitude: location.coords.altitude ?? 0,
            accuracy: location.coords.accuracy ?? 0,
        };

        _currentLocation = coords;
        return coords;
    } catch (err) {
        console.error('[LocationService] getCurrentLocation error:', err);
        return null;
    }
};

// ── Start Continuous Tracking ─────────────────────────────────────────────────
export const startLocationTracking = async (
    onLocationUpdate: (location: LocationUpdate) => void,
    config: LocationServiceConfig = DEFAULT_CONFIG
): Promise<void> => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
        console.warn('[LocationService] Cannot start tracking — no permission');
        return;
    }

    // Stop any existing subscription first
    stopLocationTracking();

    _locationSubscription = await Location.watchPositionAsync(
        {
            accuracy: config.accuracy ?? Location.Accuracy.BestForNavigation,
            timeInterval: config.timeInterval ?? 2000,
            distanceInterval: config.distanceInterval ?? 5,
        },
        (newLocation) => {
            const update: LocationUpdate = {
                latitude: newLocation.coords.latitude,
                longitude: newLocation.coords.longitude,
                speed: newLocation.coords.speed ?? 0,
                heading: newLocation.coords.heading ?? 0,
                altitude: newLocation.coords.altitude ?? 0,
                accuracy: newLocation.coords.accuracy ?? 0,
                timestamp: newLocation.timestamp,
            };

            _currentLocation = {
                latitude: update.latitude,
                longitude: update.longitude,
                heading: update.heading,
                speed: update.speed,
                altitude: update.altitude,
                accuracy: update.accuracy,
            };

            onLocationUpdate(update);
        }
    );

    // Start heading (compass) tracking
    try {
        _headingSubscription = await Location.watchHeadingAsync((h) => {
            _currentHeading = h.trueHeading !== -1 ? h.trueHeading : h.magHeading;
        });
    } catch (e) {
        console.warn('[LocationService] Compass start error:', e);
    }

    console.log('[LocationService] Tracking started');
};

// ── Stop Tracking ─────────────────────────────────────────────────────────────
export const stopLocationTracking = (): void => {
    if (_locationSubscription) {
        _locationSubscription.remove();
        _locationSubscription = null;
    }
    if (_headingSubscription) {
        _headingSubscription.remove();
        _headingSubscription = null;
    }
    if (_firestoreThrottleTimer) {
        clearTimeout(_firestoreThrottleTimer);
        _firestoreThrottleTimer = null;
    }
    console.log('[LocationService] Tracking stopped');
};

// ── Store Location in Firestore ───────────────────────────────────────────────
/**
 * Writes the user's current location to Firestore: users/{uid}/location
 * Throttled to avoid excessive writes (max once per 3 seconds).
 */
export const storeLocationInFirestore = async (
    uid: string,
    location: LocationUpdate
): Promise<void> => {
    if (_firestoreThrottleTimer) return; // Throttle active

    _firestoreThrottleTimer = setTimeout(() => {
        _firestoreThrottleTimer = null;
    }, 3000);

    try {
        const locationRef = doc(db, 'users', uid, 'location', 'current');
        await setDoc(locationRef, {
            latitude: location.latitude,
            longitude: location.longitude,
            speed: location.speed,
            heading: location.heading,
            altitude: location.altitude,
            accuracy: location.accuracy,
            updatedAt: serverTimestamp(),
        }, { merge: true });
    } catch (err) {
        console.warn('[LocationService] Firestore write error:', err);
    }
};

// ── Getters ───────────────────────────────────────────────────────────────────
export const getLastKnownLocation = (): Coordinate | null => _currentLocation;
export const getCurrentHeading = (): number => _currentHeading;

// ── Default export ────────────────────────────────────────────────────────────
export const LocationService = {
    requestLocationPermission,
    getCurrentLocation,
    startLocationTracking,
    stopLocationTracking,
    storeLocationInFirestore,
    getLastKnownLocation,
    getCurrentHeading,
};
