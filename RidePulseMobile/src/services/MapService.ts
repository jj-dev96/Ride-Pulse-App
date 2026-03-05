/**
 * MapService.ts — Pure OSM Edition
 *
 * All Mappls references removed. Replaced with:
 *   Geocoding  →  Nominatim  (openstreetmap.org, free, no API key)
 *   Routing    →  OpenRouteService (ORS, free tier API)
 *
 * Nominatim ToS reminder:
 *   - Max 1 request/second
 *   - Must include a descriptive User-Agent header
 *   - Attribution: © OpenStreetMap contributors
 *
 * OpenRouteService:
 *   - Used for mode-specific routing (walking, biking, driving)
 *   - Free tier requires API key (included below)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    Coordinate,
    GeocodeResult,
    ReverseGeocodeResult,
    PlaceResult,
    RouteResult
} from '../types';

// ── Endpoints ──────────────────────────────────────────────────────────────────
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const ORS_BASE = 'https://api.openrouteservice.org/v2';
const ORS_API_KEY = process.env.ORS_API_KEY || '5b3ce3597851110001cf624893af52bb40c04f3cafed17ade0b4ac32'; // FREE demo key (rate limited)

export type TravelMode = 'drive';
export const AVG_DRIVE_SPEED_KMH = 35; // Default for motorized rides

const MODE_MAP: Record<TravelMode, string> = {
    'drive': 'driving-car'
};

// Required by Nominatim ToS — identify your app
const HEADERS: Record<string, string> = {
    'User-Agent': 'RidePulseApp/1.0 (contact@ridepulse.app)',
    'Accept-Language': 'en',
};

// ── Simple in-memory response cache ───────────────────────────────────────────
// Prevents duplicate Nominatim calls for the same query (rate-limit friendly)
const _geoCache = new Map<string, { data: any; ts: number }>();
const GEO_TTL = 2 * 60 * 1000; // 2 minutes

const cacheGet = (key: string): any | null => {
    const hit = _geoCache.get(key);
    if (hit && Date.now() - hit.ts < GEO_TTL) return hit.data;
    _geoCache.delete(key);
    return null;
};
const cacheSet = (key: string, data: any): void => {
    _geoCache.set(key, { data, ts: Date.now() });
};

// ── Geocode (address → lat/lng) ────────────────────────────────────────────────
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
    if (!address?.trim()) return null;
    const key = `gc_${address.toLowerCase()}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    try {
        // Removed countrycodes=in to be more flexible, Nominatim often works better without tight constraints
        const url = `${NOMINATIM}/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
            headers: HEADERS,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn('[MapService] geocodeAddress HTTP', res.status);
            return null;
        }

        const data: any[] = await res.json();
        if (!data?.length) return null;

        const first = data[0];
        const result: GeocodeResult = {
            latitude: parseFloat(first.lat),
            longitude: parseFloat(first.lon),
            displayName: first.display_name || address,
        };
        cacheSet(key, result);
        return result;
    } catch (err) {
        console.warn('[MapService] geocodeAddress error:', err);
        return null;
    }
};

// ── Reverse Geocode (lat/lng → address) ───────────────────────────────────────
export const reverseGeocode = async (
    latitude: number,
    longitude: number
): Promise<ReverseGeocodeResult | null> => {
    if (!latitude || !longitude) return null;
    const key = `rg_${latitude.toFixed(4)}_${longitude.toFixed(4)}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    try {
        const url = `${NOMINATIM}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
            headers: HEADERS,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn('[MapService] reverseGeocode HTTP', res.status);
            return null;
        }

        const data = await res.json();
        if (!data || data.error) return null;

        const addr = data.address ?? {};
        // Build short address from most useful fields
        const neighbourhood = addr.suburb || addr.neighbourhood || addr.village || addr.hamlet || '';
        const city = addr.city || addr.town || addr.county || addr.state_district || addr.state || '';
        const shortAddress = [neighbourhood, city].filter(Boolean).join(', ') || data.display_name || 'Unknown Location';

        const result: ReverseGeocodeResult = {
            fullAddress: data.display_name || `${latitude},${longitude}`,
            shortAddress,
            details: addr,
        };
        cacheSet(key, result);
        return result;
    } catch (err) {
        console.error('[MapService] reverseGeocode error:', err);
        return null;
    }
};

// ── Place Auto-Suggest (search as you type) ────────────────────────────────────
export const searchPlaces = async (query: string): Promise<PlaceResult[]> => {
    if (!query || query.length < 2) return [];
    const key = `sp_${query.toLowerCase()}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    try {
        const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=1`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(url, {
            headers: HEADERS,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            console.warn('[MapService] searchPlaces HTTP', res.status);
            return [];
        }

        const data: any[] = await res.json();
        if (!data?.length) return [];

        const results: PlaceResult[] = data
            .filter((item: any) => item.lat && item.lon)
            .map((item: any): PlaceResult => {
                const addr = item.address ?? {};
                const name =
                    item.name ||
                    addr.road ||
                    addr.suburb ||
                    addr.city ||
                    item.display_name?.split(',')[0] ||
                    'Unknown';
                const parts = [addr.suburb, addr.city || addr.town || addr.state]
                    .filter(Boolean).join(', ');
                return {
                    id: String(item.place_id),
                    name,
                    fullAddress: parts || item.display_name || '',
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                };
            });

        cacheSet(key, results);
        return results;
    } catch (err) {
        console.error('[MapService] searchPlaces error:', err);
        return [];
    }
};

// ── Routing (OpenRouteService — with fallback direct-line route) ──────────────
export const getRoute = async (
    start: Coordinate,
    end: Coordinate,
    mode: TravelMode = 'drive'
): Promise<RouteResult | null> => {
    // Try ORS API first
    try {
        const profile = MODE_MAP[mode] || 'cycling-regular';
        const url = `${ORS_BASE}/directions/${profile}/geojson`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ORS_API_KEY}`,
                'Accept': 'application/json, application/geo+json',
                'User-Agent': 'RidePulseApp/1.0'
            },
            body: JSON.stringify({
                coordinates: [
                    [start.longitude, start.latitude],
                    [end.longitude, end.latitude]
                ],
                instructions: true,
                language: 'en'
            }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn('[MapService] ORS HTTP', response.status, '- falling back to direct route');
            return _buildFallbackRoute(start, end);
        }

        const data = await response.json();
        const feature = data.features?.[0];
        if (!feature) {
            console.warn('[MapService] ORS no route - falling back');
            return _buildFallbackRoute(start, end);
        }

        const geometry = feature.geometry;
        const props = feature.properties;
        const summary = props.summary;

        // Parse GeoJSON LineString coordinates ([lng, lat] → {lat, lng})
        const coordinates: Coordinate[] = (geometry.coordinates ?? []).map(
            ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
        );

        // Parse turn-by-turn steps
        const steps = (props.segments ?? []).flatMap((seg: any) =>
            (seg.steps ?? []).map((step: any) => ({
                instruction: step.instruction || 'Continue',
                name: step.name || '',
                distance: step.distance || 0,
                duration: step.duration || 0,
                maneuver: step.type || 0,
            }))
        );

        return {
            coordinates,
            distance: summary.distance ?? 0,   // metres
            duration: summary.duration ?? 0,   // seconds
            steps,
        };
    } catch (err) {
        console.warn('[MapService] getRoute error - falling back to direct route:', err);
        return _buildFallbackRoute(start, end);
    }
};

/**
 * Fallback: builds a direct-line route between two points.
 * Generates intermediate points for a smooth polyline, and estimates
 * cycling time at AVG_CYCLING_SPEED_KMH (18 km/h).
 */
const _buildFallbackRoute = (
    start: Coordinate,
    end: Coordinate
): RouteResult => {
    const distanceMetres = getDistance(start, end);
    const distanceKm = distanceMetres / 1000;
    // Estimated: add 30% to straight-line distance for road winding
    const estimatedRoadDistance = distanceMetres * 1.3;
    const durationSeconds = (estimatedRoadDistance / 1000 / AVG_DRIVE_SPEED_KMH) * 3600;

    // Generate intermediate points for a smoother polyline
    const numPoints = Math.max(2, Math.min(Math.ceil(distanceKm * 2), 50));
    const coordinates: Coordinate[] = [];
    for (let i = 0; i <= numPoints; i++) {
        const t = i / numPoints;
        coordinates.push({
            latitude: start.latitude + (end.latitude - start.latitude) * t,
            longitude: start.longitude + (end.longitude - start.longitude) * t,
        });
    }

    return {
        coordinates,
        distance: estimatedRoadDistance,
        duration: durationSeconds,
        steps: [
            { instruction: 'Head towards destination', name: '', distance: estimatedRoadDistance, duration: durationSeconds, maneuver: 0 },
            { instruction: 'You have arrived', name: '', distance: 0, duration: 0, maneuver: 0 },
        ],
    };
};

// ── Human-readable maneuver labels ────────────────────────────────────────────
function humaniseManeuver(type: string, streetName?: string): string {
    const street = streetName ? ` onto ${streetName}` : '';
    switch (type) {
        case 'turn-left': return `Turn left${street}`;
        case 'turn-right': return `Turn right${street}`;
        case 'depart': return `Head${street}`;
        case 'arrive': return 'You have arrived';
        case 'roundabout': return `Enter roundabout${street}`;
        case 'merge': return `Merge${street}`;
        case 'fork': return `Keep${street}`;
        case 'end of road': return `At end of road${street}`;
        default: return `Continue${street}`;
    }
}

// ── Haversine Distance (unchanged) ────────────────────────────────────────────
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

// ── Location Cache (unchanged) ────────────────────────────────────────────────
export const cacheLocation = async (location: Coordinate): Promise<void> => {
    try {
        await AsyncStorage.setItem('last_known_location', JSON.stringify(location));
    } catch { }
};

export const getCachedLocation = async (): Promise<Coordinate | null> => {
    try {
        const json = await AsyncStorage.getItem('last_known_location');
        return json ? (JSON.parse(json) as Coordinate) : null;
    } catch {
        return null;
    }
};

// ── OSM tile URL exported for any WebView consumers still in the codebase ─────
export const MAP_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
