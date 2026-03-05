/**
 * routingService.ts
 *
 * Routing via OpenRouteService (ORS) API — free, no Google Maps needed.
 *
 * Features:
 *  - getRoute()         → Polyline coordinates + distance (m) + duration (s) + steps
 *  - getETAText()       → Human "23 min · 12.4 km"
 *  - checkDeviation()   → Returns true if user has deviated > threshold metres
 *  - recalculateRoute() → Wrapper that calls getRoute and returns new RouteResult
 *
 * Register for a free API key at: https://openrouteservice.org/dev/#/signup
 * Set ORS_API_KEY in a .env file (loaded via expo-constants / babel transform).
 */

import axios, { AxiosError } from 'axios';
import { Coordinate, RouteResult, RouteStep } from '../types';

// ── Config ─────────────────────────────────────────────────────────────────────

// Replace with your actual ORS key or use an .env variable.
// For Expo, put this in app.json extra.orsApiKey and read via Constants.expoConfig.
const ORS_API_KEY =
    process.env.ORS_API_KEY ||
    '5b3ce3597851110001cf624893af52bb40c04f3cafed17ade0b4ac32'; // FREE demo key (rate limited)

const ORS_BASE = 'https://api.openrouteservice.org/v2';

// ── Haversine distance helper ──────────────────────────────────────────────────

export const haversineDistance = (a: Coordinate, b: Coordinate): number => {
    const R = 6371e3;
    const φ1 = (a.latitude * Math.PI) / 180;
    const φ2 = (b.latitude * Math.PI) / 180;
    const Δφ = ((b.latitude - a.latitude) * Math.PI) / 180;
    const Δλ = ((b.longitude - a.longitude) * Math.PI) / 180;
    const s =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

// ── Fetch route from ORS ───────────────────────────────────────────────────────

export type TravelMode = 'bicycle';
export const AVG_CYCLING_SPEED_KMH = 18;

const MODE_MAP: Record<TravelMode, string> = {
    'bicycle': 'cycling-regular',
};

export const getRoute = async (
    start: Coordinate,
    end: Coordinate,
    mode: TravelMode = 'bicycle'
): Promise<RouteResult | null> => {
    try {
        const profile = MODE_MAP[mode] || 'cycling-regular';
        const url = `${ORS_BASE}/directions/${profile}/geojson`;

        const { data } = await axios.post(
            url,
            {
                coordinates: [
                    [start.longitude, start.latitude],
                    [end.longitude, end.latitude],
                ],
                instructions: true,
                language: 'en',
            },
            {
                headers: {
                    Authorization: `Bearer ${ORS_API_KEY}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json, application/geo+json',
                },
                timeout: 15000,
            }
        );

        const feature = data?.features?.[0];
        if (!feature) return null;

        const geometry = feature.geometry; // GeoJSON LineString
        const props = feature.properties;
        const summary = props?.summary;

        // ── Coordinates ─────────────────────────────────────────────────────
        const coordinates: Coordinate[] = (geometry?.coordinates ?? []).map(
            ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
        );

        // ── Steps ────────────────────────────────────────────────────────────
        const steps: RouteStep[] = [];
        const segments: any[] = props?.segments ?? [];
        for (const seg of segments) {
            for (const step of seg.steps ?? []) {
                steps.push({
                    instruction: step.instruction ?? 'Continue',
                    name: step.name ?? '',
                    distance: step.distance ?? 0,
                    duration: step.duration ?? 0,
                    maneuver: step.type ?? 0,
                });
            }
        }

        return {
            coordinates,
            distance: summary?.distance ?? 0,   // metres
            duration: summary?.duration ?? 0,   // seconds
            steps,
        };
    } catch (err) {
        if (axios.isAxiosError(err)) {
            const ae = err as AxiosError;
            console.error('[routingService] ORS API error:', ae.response?.status, ae.response?.data);
        } else {
            console.error('[routingService] getRoute error:', err);
        }
        return null;
    }
};

// ── Recalculate route (alias with clear intent) ────────────────────────────────

export const recalculateRoute = async (
    currentPosition: Coordinate,
    destination: Coordinate
): Promise<RouteResult | null> => {
    return getRoute(currentPosition, destination);
};

// ── Deviation check ────────────────────────────────────────────────────────────

/**
 * Returns true if the user's current position is more than `thresholdMetres`
 * away from every point in the current route polyline.
 */
export const checkDeviation = (
    currentPosition: Coordinate,
    routeCoords: Coordinate[],
    thresholdMetres: number = 80
): boolean => {
    if (routeCoords.length === 0) return false;
    const minDist = routeCoords.reduce((min, coord) => {
        const d = haversineDistance(currentPosition, coord);
        return d < min ? d : min;
    }, Infinity);
    return minDist > thresholdMetres;
};

// ── ETA string ────────────────────────────────────────────────────────────────

/**
 * Returns a formatted string like "23 min · 12.4 km"
 */
export const getETAText = (distanceMetres: number, durationSeconds: number): string => {
    const km = (distanceMetres / 1000).toFixed(1);
    const mins = Math.ceil(durationSeconds / 60);
    if (mins >= 60) {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}min · ${km} km`;
    }
    return `${mins} min · ${km} km`;
};
