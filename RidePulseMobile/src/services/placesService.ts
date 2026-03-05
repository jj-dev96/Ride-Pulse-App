/**
 * placesService.ts
 *
 * Fetches nearby points of interest using the Overpass API (OpenStreetMap data).
 * Free, no API key required.
 *
 * Supported categories:
 *   - fuel      → Petrol / CNG / EV stations
 *   - food      → Restaurants, cafes, fast food
 *   - hospital  → Hospitals, clinics, pharmacies
 *
 * Uses axios with a 12-second timeout and caches results to avoid hammering the API.
 */

import axios from 'axios';
import { Coordinate } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────

export type POICategory = 'fuel' | 'food' | 'hospital';

export interface NearbyPlace {
    id: string;
    name: string;
    category: POICategory;
    latitude: number;
    longitude: number;
    /** Distance in metres from the query origin, if available */
    distance?: number;
    /** Raw OSM tags */
    tags?: Record<string, string>;
}

// ── Config ─────────────────────────────────────────────────────────────────────

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
// Fallback mirror
const OVERPASS_MIRROR = 'https://overpass.kumi.systems/api/interpreter';

// Simple in-memory cache: key = `${category}_${lat.toFixed(3)}_${lng.toFixed(3)}_${radius}`
const cache = new Map<string, { data: NearbyPlace[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Overpass query builders ────────────────────────────────────────────────────

const buildFuelQuery = (lat: number, lng: number, radius: number) =>
    `[out:json][timeout:10];
(
  node["amenity"="fuel"](around:${radius},${lat},${lng});
  node["amenity"="charging_station"](around:${radius},${lat},${lng});
  node["amenity"="compressed_natural_gas"](around:${radius},${lat},${lng});
);
out body;`;

const buildFoodQuery = (lat: number, lng: number, radius: number) =>
    `[out:json][timeout:10];
(
  node["amenity"="restaurant"](around:${radius},${lat},${lng});
  node["amenity"="cafe"](around:${radius},${lat},${lng});
  node["amenity"="fast_food"](around:${radius},${lat},${lng});
  node["amenity"="food_court"](around:${radius},${lat},${lng});
);
out body;`;

const buildHospitalQuery = (lat: number, lng: number, radius: number) =>
    `[out:json][timeout:10];
(
  node["amenity"="hospital"](around:${radius},${lat},${lng});
  node["amenity"="clinic"](around:${radius},${lat},${lng});
  node["amenity"="pharmacy"](around:${radius},${lat},${lng});
  node["amenity"="doctors"](around:${radius},${lat},${lng});
);
out body;`;

const queryBuilders: Record<POICategory, (lat: number, lng: number, radius: number) => string> = {
    fuel: buildFuelQuery,
    food: buildFoodQuery,
    hospital: buildHospitalQuery,
};

// ── Haversine (local, no import cycle) ────────────────────────────────────────

const haversine = (a: Coordinate, b: Coordinate): number => {
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

// ── Core fetch ────────────────────────────────────────────────────────────────

const fetchOverpass = async (query: string): Promise<any[]> => {
    const body = new URLSearchParams({ data: query }).toString();

    // Try primary, fall back to mirror
    for (const url of [OVERPASS_URL, OVERPASS_MIRROR]) {
        try {
            const { data } = await axios.post(url, body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 12000,
            });
            return data?.elements ?? [];
        } catch (err) {
            console.warn(`[placesService] Overpass ${url} failed, trying mirror…`);
        }
    }
    return [];
};

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch nearby places of a given category within `radiusMetres` of `origin`.
 * Results are sorted by distance ascending.
 */
export const fetchNearbyPlaces = async (
    origin: Coordinate,
    category: POICategory,
    radiusMetres: number = 3000
): Promise<NearbyPlace[]> => {
    const cacheKey = `${category}_${origin.latitude.toFixed(3)}_${origin.longitude.toFixed(3)}_${radiusMetres}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.data;
    }

    try {
        const buildQuery = queryBuilders[category];
        const query = buildQuery(origin.latitude, origin.longitude, radiusMetres);
        const elements = await fetchOverpass(query);

        const places: NearbyPlace[] = elements
            .filter((el: any) => el.type === 'node' && el.lat && el.lon)
            .map((el: any): NearbyPlace => {
                const tags: Record<string, string> = el.tags ?? {};
                const name =
                    tags.name ||
                    tags['name:en'] ||
                    tags.brand ||
                    tags.operator ||
                    categoryFallbackName(category);
                const coord: Coordinate = { latitude: el.lat, longitude: el.lon };
                return {
                    id: String(el.id),
                    name,
                    category,
                    latitude: el.lat,
                    longitude: el.lon,
                    distance: Math.round(haversine(origin, coord)),
                    tags,
                };
            })
            .sort((a: NearbyPlace, b: NearbyPlace) => (a.distance ?? 0) - (b.distance ?? 0));

        cache.set(cacheKey, { data: places, ts: Date.now() });
        return places;
    } catch (err) {
        console.error('[placesService] fetchNearbyPlaces error:', err);
        return [];
    }
};

/**
 * Fetch all three categories simultaneously.
 */
export const fetchAllNearbyPlaces = async (
    origin: Coordinate,
    radiusMetres: number = 3000
): Promise<NearbyPlace[]> => {
    const [fuel, food, hospital] = await Promise.allSettled([
        fetchNearbyPlaces(origin, 'fuel', radiusMetres),
        fetchNearbyPlaces(origin, 'food', radiusMetres),
        fetchNearbyPlaces(origin, 'hospital', radiusMetres),
    ]);

    return [
        ...(fuel.status === 'fulfilled' ? fuel.value : []),
        ...(food.status === 'fulfilled' ? food.value : []),
        ...(hospital.status === 'fulfilled' ? hospital.value : []),
    ].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
};

/** Clear the in-memory cache */
export const clearPlacesCache = (): void => cache.clear();

// ── Helpers ────────────────────────────────────────────────────────────────────

function categoryFallbackName(cat: POICategory): string {
    switch (cat) {
        case 'fuel': return 'Fuel Station';
        case 'food': return 'Restaurant';
        case 'hospital': return 'Medical';
    }
}
