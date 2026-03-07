import * as Location from 'expo-location';
import { db } from '../config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getDistance } from './mapService';
import { Coordinate } from '../types';

let _lastUploadedLocation: Coordinate | null = null;
let _locationInterval: ReturnType<typeof setInterval> | null = null;

export const GroupLocationSync = {
    /**
     * Starts broadcasting the current user's location to the group every 2 seconds.
     * Only updates Firestore if distance moved > 5 meters to optimize performance.
     */
    startSync: (groupId: string, userId: string, username: string, color: string) => {
        GroupLocationSync.stopSync();

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

                // Apply 5m threshold check
                if (_lastUploadedLocation) {
                    const distanceMoved = getDistance(_lastUploadedLocation, current);
                    if (distanceMoved < 5) return;
                }

                _lastUploadedLocation = current;

                const memberRef = doc(db, 'rides', groupId, 'members', userId);
                await updateDoc(memberRef, {
                    id: userId,
                    username,
                    color,
                    latitude: current.latitude,
                    longitude: current.longitude,
                    heading: current.heading,
                    speed: current.speed,
                    timestamp: serverTimestamp()
                });
            } catch (error) {
                console.error('[GroupLocationSync] Update failed:', error);
            }
        }, 2000);
    },

    stopSync: () => {
        if (_locationInterval) {
            clearInterval(_locationInterval);
            _locationInterval = null;
        }
        _lastUploadedLocation = null;
    }
};
