/**
 * mapService.ts — Open Source Map Service (OSRM + Nominatim)
 *
 * Replaces Mapbox with Open Source alternatives:
 *   Geocoding  →  Nominatim API (OSM)
 *   Routing    →  OSRM API (Public)
 *
 * Usage of public APIs should be respectful (headers/rate-limiting).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Coordinate,
    GeocodeResult,
    ReverseGeocodeResult,
    PlaceResult,
    RouteResult,
} from '../types';

// ── Endpoints ──────────────────────────────────────────────────────────────────
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export type TravelMode = 'drive';
export const AVG_DRIVE_SPEED_KMH = 35;

// Required for Nominatim usage policy
const FETCH_HEADERS = {
    'User-Agent': 'RidePulseMobile/1.0',
    'Accept-Language': 'en',
};

// ── Simple in-memory response cache ───────────────────────────────────────────
const _geoCache = new Map<string, { data: any; ts: number }>();
const GEO_TTL = 5 * 60 * 1000; // 5 minutes

const cacheGet = (key: string): any | null => {
    const hit = _geoCache.get(key);
    if (hit && Date.now() - hit.ts < GEO_TTL) return hit.data;
    _geoCache.delete(key);
    return null;
};
const cacheSet = (key: string, data: any): void => {
    _geoCache.set(key, { data, ts: Date.now() });
};

// ── Geocode (address → lat/lng) — Nominatim ────────────────────────────────────
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
    if (!address?.trim()) return null;
    const key = `gc_${address.toLowerCase()}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    try {
        const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`;
        const res = await fetch(url, { headers: FETCH_HEADERS });

        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.length) return null;

        const first = data[0];
        const result: GeocodeResult = {
            latitude: parseFloat(first.lat),
            longitude: parseFloat(first.lon),
            displayName: first.display_name,
        };
        cacheSet(key, result);
        return result;
    } catch (err) {
        console.warn('[mapService] geocodeAddress error:', err);
        return null;
    }
};

// ── Reverse Geocode (lat/lng → address) — Nominatim ─────────────────────────────
export const reverseGeocode = async (
    latitude: number,
    longitude: number
): Promise<ReverseGeocodeResult | null> => {
    if (!latitude || !longitude) return null;
    const key = `rg_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    try {
        const url = `${NOMINATIM_BASE}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
        const res = await fetch(url, { headers: FETCH_HEADERS });

        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.address) return null;

        const addr = data.address;
        const road = addr.road || addr.pedestrian || addr.suburb || '';
        const city = addr.city || addr.town || addr.village || '';
        const shortAddress = [road, city].filter(Boolean).join(', ') || 'Unknown Location';

        const result: ReverseGeocodeResult = {
            fullAddress: data.display_name || `${latitude},${longitude}`,
            shortAddress,
            details: addr,
        };
        cacheSet(key, result);
        return result;
    } catch (err) {
        console.error('[mapService] reverseGeocode error:', err);
        return null;
    }
};

// ── Place Auto-Suggest — Nominatim ──────────────────────────────────────────────
export const searchPlaces = async (query: string): Promise<PlaceResult[]> => {
    if (!query || query.length < 2) return [];
    const key = `sp_${query.toLowerCase()}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    try {
        const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`;
        const res = await fetch(url, { headers: FETCH_HEADERS });

        if (!res.ok) return [];
        const data = await res.json();

        const results: PlaceResult[] = data.map((item: any): PlaceResult => ({
            id: String(item.place_id),
            name: item.display_name.split(',')[0],
            fullAddress: item.display_name,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
        }));

        cacheSet(key, results);
        return results;
    } catch (err) {
        console.error('[mapService] searchPlaces error:', err);
        return [];
    }
};

// ── Routing — OSRM API ──────────────────────────────────────────────────────────
export const getRoute = async (
    start: Coordinate,
    end: Coordinate,
    mode: TravelMode = 'drive'
): Promise<RouteResult | null> => {
    try {
        const coords = `${start.longitude},${start.latitude};${end.longitude},${end.latitude}`;
        const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson&steps=true`;

        const res = await fetch(url);
        if (!res.ok) return _buildFallbackRoute(start, end);

        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return _buildFallbackRoute(start, end);

        // OSRM returns [lng, lat]
        const coordinates: Coordinate[] = (route.geometry?.coordinates ?? []).map(
            ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
        );

        const steps = (route.legs ?? []).flatMap((leg: any) =>
            (leg.steps ?? []).map((step: any) => ({
                instruction: step.maneuver?.instruction || 'Continue',
                name: step.name || '',
                distance: step.distance || 0,
                duration: step.duration || 0,
                maneuver: 0,
            }))
        );

        return {
            coordinates,
            distance: route.distance ?? 0,   // metres
            duration: route.duration ?? 0,   // seconds
            steps,
        };
    } catch (err) {
        console.warn('[mapService] OSRM error, using fallback:', err);
        return _buildFallbackRoute(start, end);
    }
};

const _buildFallbackRoute = (start: Coordinate, end: Coordinate): RouteResult => {
    const distanceMetres = getDistance(start, end) * 1.3;
    const durationSeconds = (distanceMetres / 1000 / AVG_DRIVE_SPEED_KMH) * 3600;

    return {
        coordinates: [
            { latitude: start.latitude, longitude: start.longitude },
            { latitude: end.latitude, longitude: end.longitude },
        ],
        distance: distanceMetres,
        duration: durationSeconds,
        steps: [{ instruction: 'Direct route', name: '', distance: distanceMetres, duration: durationSeconds, maneuver: 0 }],
    };
};

// ── Haversine Distance ────────────────────────────────────────────────────────
export const getDistance = (
    coord1: Coordinate | null,
    coord2: Coordinate | null
): number => {
    if (!coord1 || !coord2) return 0;
    const R = 6371e3;
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Location Cache ────────────────────────────────────────────────────────────
export const cacheLocation = async (location: Coordinate): Promise<void> => {
    try {
        await AsyncStorage.setItem('last_known_location', JSON.stringify(location));
    } catch { }
};

export const getCachedLocation = async (): Promise<Coordinate | null> => {
    try {
        const json = await AsyncStorage.getItem('last_known_location');
        return json ? (JSON.parse(json) as Coordinate) : null;
    } catch (err) {
        return null;
    }
};

export const MapService = {
    geocodeAddress,
    reverseGeocode,
    searchPlaces,
    getRoute,
    getDistance,
};
