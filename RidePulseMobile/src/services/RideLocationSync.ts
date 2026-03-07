import * as Location from 'expo-location';
import { db } from '../config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDistance } from './mapService';
import { Coordinate } from '../types';

let _lastUploadedLocation: Coordinate | null = null;
let _locationInterval: ReturnType<typeof setInterval> | null = null;

export const RideLocationSync = {
    /**
     * Broadcasts rider location every 2 seconds to Firestore.
     * Only updates if distance > 5m to optimize performance.
     */
    startLocationBroadcasting: (groupId: string, userId: string, username: string, color: string) => {
        RideLocationSync.stopLocationBroadcasting();

        _locationInterval = setInterval(async () => {
            try {
                const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                const current: Coordinate = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    heading: loc.coords.heading ?? 0,
                    speed: loc.coords.speed ?? 0
                };

                // Feature 3 & 11: Optimized broadcast (5m threshold)
                if (_lastUploadedLocation) {
                    const distanceMoved = getDistance(_lastUploadedLocation, current);
                    if (distanceMoved < 5) return;
                }

                _lastUploadedLocation = current;

                // Feature 3: Update Firestore rides/{rideId}/members/{uid}
                const memberRef = doc(db, 'rides', groupId, 'members', userId);
                await updateDoc(memberRef, {
                    uid: userId,
                    username,
                    latitude: current.latitude,
                    longitude: current.longitude,
                    heading: current.heading,
                    speed: Math.round(current.speed * 3.6),
                    color,
                    timestamp: serverTimestamp()
                });
            } catch (error) {
                console.error('[RideLocationSync] Broadcast failed:', error);
            }
        }, 2000);
    },

    stopLocationBroadcasting: () => {
        if (_locationInterval) {
            clearInterval(_locationInterval);
            _locationInterval = null;
        }
        _lastUploadedLocation = null;
    }
};
