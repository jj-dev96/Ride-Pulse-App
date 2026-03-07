import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Coordinate } from '../types';

export const LeaderRouteService = {
    /**
     * Feature 5: Leader shares route data with the group.
     * Followers fetch and display this route instead of requesting their own.
     */
    shareRouteWithGroup: async (
        rideId: string,
        destination: string,
        coords: Coordinate,
        routeGeometry: Coordinate[],
        distance: string,
        eta: string
    ) => {
        try {
            const rideRef = doc(db, 'rides', rideId);
            await updateDoc(rideRef, {
                destination,
                destinationCoordinates: coords, // As per spec
                routeGeometry,               // As per spec
                distance,
                eta,
                lastUpdated: new Date().toISOString()
            });
        } catch (error) {
            console.error('[LeaderRouteService] Failed to share route:', error);
        }
    }
};
