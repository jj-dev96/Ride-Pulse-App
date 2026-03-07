/**
 * routingService.ts — Unified Routing Gateway
 *
 * This service now wraps the MapService (OSRM) to provide a 
 * consistent API for the app while fulfilling the user's 
 * request for an open-source, OSRM-based navigation stack.
 */

import { Coordinate, RouteResult } from '../types';
import { MapService } from './mapService';

/**
 * Fetches a route using OSRM through MapService.
 */
export const getRoute = async (
    start: Coordinate,
    end: Coordinate,
    mode: 'drive' | 'bicycle' = 'drive'
): Promise<RouteResult | null> => {
    return MapService.getRoute(start, end, 'drive');
};

/**
 * Decides if a user has deviated significantly from the planned route.
 */
export const checkDeviation = (
    current: Coordinate,
    routeCoords: Coordinate[],
    thresholdMetres: number = 80
): boolean => {
    if (routeCoords.length === 0) return false;

    // Find closest point on polyline
    let minDistance = Infinity;
    for (const coord of routeCoords) {
        const d = MapService.getDistance(current, coord);
        if (d < minDistance) minDistance = d;
    }

    return minDistance > thresholdMetres;
};

/**
 * Returns a nicely formatted text like "12 min · 4.2 km"
 */
export const getETAText = (distanceMetres: number, durationSeconds: number): string => {
    const km = (distanceMetres / 1000).toFixed(1);
    const mins = Math.ceil(durationSeconds / 60);

    if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m · ${km} km`;
    }

    return `${mins} min · ${km} km`;
};

/**
 * Helper to recalculate route if deviated.
 */
export const recalculateRoute = async (
    current: Coordinate,
    destination: Coordinate
): Promise<RouteResult | null> => {
    return getRoute(current, destination);
};

export const RoutingService = {
    getRoute,
    checkDeviation,
    getETAText,
    recalculateRoute
};
