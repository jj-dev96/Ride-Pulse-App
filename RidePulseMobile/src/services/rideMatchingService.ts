/**
 * rideService.ts — Enhanced Ride Matching & Tracking Service
 *
 * Extends the existing RideService with:
 *  - Ride request creation (rider → Firestore rideRequests collection)
 *  - Real-time ride request listener (for drivers)
 *  - Ride matching (driver accepts ride)
 *  - Nearby drivers fetch from Firestore
 *  - Active ride tracking with driver assignment
 */

import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    orderBy,
    limit,
    GeoPoint,
    Unsubscribe,
    DocumentData,
} from 'firebase/firestore';
import { Coordinate } from '../types';
import { getDistance } from './mapService';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RideRequest {
    id?: string;
    riderId: string;
    riderName: string;
    riderPhoto?: string;
    pickupLocation: Coordinate;
    pickupAddress: string;
    dropoffLocation: Coordinate;
    dropoffAddress: string;
    estimatedDistance: number;  // metres
    estimatedDuration: number; // seconds
    status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    driverId?: string;
    driverName?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface DriverLocation {
    id: string;
    name: string;
    profileImage?: string;
    vehicle?: string;
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    isAvailable: boolean;
    lastUpdated?: any;
}

// ── Ride Request (Rider creates a request) ────────────────────────────────────
export const createRideRequest = async (request: Omit<RideRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const rideRequestsRef = collection(db, 'rideRequests');
        const docRef = await addDoc(rideRequestsRef, {
            ...request,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log('[rideService] Ride request created:', docRef.id);
        return docRef.id;
    } catch (err) {
        console.error('[rideService] createRideRequest error:', err);
        throw err;
    }
};

// ── Listen to Ride Requests (Drivers subscribe) ───────────────────────────────
export const subscribeToRideRequests = (
    onUpdate: (requests: RideRequest[]) => void
): Unsubscribe => {
    const q = query(
        collection(db, 'rideRequests'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const requests: RideRequest[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
        } as RideRequest));
        onUpdate(requests);
    }, (error) => {
        console.error('[rideService] subscribeToRideRequests error:', error);
    });
};

// ── Accept a Ride Request (Driver accepts) ────────────────────────────────────
export const acceptRideRequest = async (
    requestId: string,
    driverId: string,
    driverName: string
): Promise<void> => {
    try {
        const requestRef = doc(db, 'rideRequests', requestId);
        await updateDoc(requestRef, {
            status: 'accepted',
            driverId,
            driverName,
            updatedAt: serverTimestamp(),
        });
        console.log('[rideService] Ride accepted by driver:', driverId);
    } catch (err) {
        console.error('[rideService] acceptRideRequest error:', err);
        throw err;
    }
};

// ── Cancel a Ride Request ─────────────────────────────────────────────────────
export const cancelRideRequest = async (requestId: string): Promise<void> => {
    try {
        const requestRef = doc(db, 'rideRequests', requestId);
        await updateDoc(requestRef, {
            status: 'cancelled',
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.error('[rideService] cancelRideRequest error:', err);
        throw err;
    }
};

// ── Complete a Ride ───────────────────────────────────────────────────────────
export const completeRideRequest = async (requestId: string): Promise<void> => {
    try {
        const requestRef = doc(db, 'rideRequests', requestId);
        await updateDoc(requestRef, {
            status: 'completed',
            updatedAt: serverTimestamp(),
        });
    } catch (err) {
        console.error('[rideService] completeRideRequest error:', err);
        throw err;
    }
};

// ── Subscribe to a specific ride request (for rider to watch status) ──────────
export const subscribeToRideRequest = (
    requestId: string,
    onUpdate: (request: RideRequest | null) => void
): Unsubscribe => {
    const requestRef = doc(db, 'rideRequests', requestId);
    return onSnapshot(requestRef, (snapshot) => {
        if (snapshot.exists()) {
            onUpdate({ id: snapshot.id, ...snapshot.data() } as RideRequest);
        } else {
            onUpdate(null);
        }
    });
};

// ── Update Driver Location ────────────────────────────────────────────────────
export const updateDriverLocation = async (
    driverId: string,
    location: Coordinate,
    driverName: string,
    vehicle?: string,
    profileImage?: string,
    isAvailable: boolean = true
): Promise<void> => {
    try {
        const driverRef = doc(db, 'driverLocations', driverId);
        await setDoc(driverRef, {
            name: driverName,
            profileImage: profileImage || null,
            vehicle: vehicle || null,
            latitude: location.latitude,
            longitude: location.longitude,
            heading: location.heading ?? 0,
            speed: location.speed ?? 0,
            isAvailable,
            lastUpdated: serverTimestamp(),
        }, { merge: true });
    } catch (err) {
        console.warn('[rideService] updateDriverLocation error:', err);
    }
};

// ── Fetch Nearby Drivers ──────────────────────────────────────────────────────
/**
 * Fetches all available drivers from the `driverLocations` collection.
 * Filters by distance from the given center coordinate within `radiusKm`.
 */
export const fetchNearbyDrivers = async (
    center: Coordinate,
    radiusKm: number = 10
): Promise<DriverLocation[]> => {
    try {
        const q = query(
            collection(db, 'driverLocations'),
            where('isAvailable', '==', true)
        );

        const snapshot = await getDocs(q);
        const allDrivers: DriverLocation[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
        } as DriverLocation));

        // Filter by distance client-side (Firestore doesn't natively support geo-queries)
        return allDrivers.filter((driver) => {
            const dist = getDistance(center, {
                latitude: driver.latitude,
                longitude: driver.longitude,
            });
            return dist <= radiusKm * 1000; // Convert km to metres
        });
    } catch (err) {
        console.error('[rideService] fetchNearbyDrivers error:', err);
        return [];
    }
};

// ── Subscribe to Nearby Drivers (real-time) ───────────────────────────────────
export const subscribeToNearbyDrivers = (
    center: Coordinate,
    radiusKm: number,
    onUpdate: (drivers: DriverLocation[]) => void
): Unsubscribe => {
    const q = query(
        collection(db, 'driverLocations'),
        where('isAvailable', '==', true)
    );

    return onSnapshot(q, (snapshot) => {
        const allDrivers: DriverLocation[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
        } as DriverLocation));

        // Filter by distance
        const nearby = allDrivers.filter((driver) => {
            const dist = getDistance(center, {
                latitude: driver.latitude,
                longitude: driver.longitude,
            });
            return dist <= radiusKm * 1000;
        });

        onUpdate(nearby);
    }, (error) => {
        console.error('[rideService] subscribeToNearbyDrivers error:', error);
    });
};

// ── Default export ────────────────────────────────────────────────────────────
export const rideMatchingService = {
    createRideRequest,
    subscribeToRideRequests,
    acceptRideRequest,
    cancelRideRequest,
    completeRideRequest,
    subscribeToRideRequest,
    updateDriverLocation,
    fetchNearbyDrivers,
    subscribeToNearbyDrivers,
};
