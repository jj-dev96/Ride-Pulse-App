/**
 * mapbox.ts — Mapbox GL Native Configuration
 *
 * Initializes @rnmapbox/maps with the access token from environment variables.
 */

// We use require to prevent top-level import side-effects
let MapboxGL: any = null;
try {
    MapboxGL = require('@rnmapbox/maps');
} catch (e) {
    console.warn('[Mapbox] Failed to load module:', e);
}

// ── Access Token ─────────────────────────────────────────────────────────────
const MAPBOX_ACCESS_TOKEN =
    process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ||
    'pk.eyJ1IjoicmlkZXB1bHNlIiwiYSI6ImNtN3p4bTlicTBhNHEycnE0N2VnMXRrZmMifQ.placeholder_token';

// ── Map Style URLs ───────────────────────────────────────────────────────────
export const MAP_STYLES = {
    dark: 'mapbox://styles/mapbox/dark-v11',
    light: 'mapbox://styles/mapbox/light-v11',
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    navigation_day: 'mapbox://styles/mapbox/navigation-day-v1',
    navigation_night: 'mapbox://styles/mapbox/navigation-night-v1',
} as const;

// ── Initialization ───────────────────────────────────────────────────────────
let _initialized = false;

export const isMapboxSupported = (): boolean => {
    try {
        return !!(MapboxGL && MapboxGL.setAccessToken && typeof MapboxGL.setAccessToken === 'function');
    } catch {
        return false;
    }
};

export const initializeMapbox = (): void => {
    if (_initialized || !isMapboxSupported()) return;

    try {
        MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
        MapboxGL.setTelemetryEnabled(false);
        _initialized = true;
        console.log('[Mapbox] SDK initialized');
    } catch (error) {
        console.error('[Mapbox] Initialization failed:', error);
    }
};

export const getMapboxToken = (): string => MAPBOX_ACCESS_TOKEN;

export default MapboxGL;
