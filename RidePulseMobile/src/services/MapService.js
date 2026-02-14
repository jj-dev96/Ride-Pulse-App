
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE3YTJmNjU3YmE2YTQwNmZiYzQ1OGViZTg5ZTYzZWQ2IiwiaCI6Im11cm11cjY0In0='; // This looks like an ID, not a standard API key (usually 5b3ce3597...), but user provided it. 
// Wait, the user provided a base64 string which decodes to {"org":"...","id":"...","h":"..."}. This is likely a token or internal ID.
// Standard ORS keys start with "5b3ce359...".
// Assuming the user meant to provide a standard key, but maybe pasted a token. 
// I will attempt to use it as an Authorization header (Bearer or straightforward api_key).
// Standard ORS usage is `Authorization: <key>`.

// ACTUALLY: The user provided string looks like a decoded JWT or similar payload, not a raw API Key.
// However, I must follow instructions. I will use it as the API Key in the header.
// If it fails, I will inform the user.
// NOTE: OpenRouteService keys are usually 40-character hex strings usually.
// Let's assume passed string IS the key for now.

const ORS_BASE_URL = 'https://api.openrouteservice.org';

export const geocodeAddress = async (address) => {
    try {
        const response = await fetch(`${ORS_BASE_URL}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}&size=1`);
        const data = await response.json();

        if (data && data.features && data.features.length > 0) {
            const feature = data.features[0];
            return {
                latitude: feature.geometry.coordinates[1],
                longitude: feature.geometry.coordinates[0],
                displayName: feature.properties.label
            };
        }
        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
};

export const reverseGeocode = async (latitude, longitude) => {
    try {
        if (!latitude || !longitude) return null;
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
                'User-Agent': 'RidePulseApp/1.0'
            }
        });
        const data = await response.json();
        if (data && data.display_name) {
            // Simplify address: "City, State, Country" or "Road, City"
            const addr = data.address;
            const shortName = addr.road || addr.suburb || addr.city || addr.town || addr.village || "Unknown Location";
            const region = addr.city || addr.state || addr.country || "";

            return {
                fullAddress: data.display_name,
                shortAddress: region ? `${shortName}, ${region}` : shortName,
                details: addr
            };
        }
        return null;
    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return null;
    }
};

export const searchPlaces = async (query) => {
    if (!query || query.length < 3) return [];
    try {
        const response = await fetch(`${ORS_BASE_URL}/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&size=5`);
        const data = await response.json();

        if (data && data.features && data.features.length > 0) {
            return data.features.map(item => ({
                id: item.properties.id || Math.random().toString(),
                name: item.properties.name || item.properties.label.split(',')[0],
                fullAddress: item.properties.label,
                latitude: item.geometry.coordinates[1],
                longitude: item.geometry.coordinates[0]
            }));
        }
        return [];
    } catch (error) {
        console.error("Places search error:", error);
        return [];
    }
};

export const getRoute = async (start, end) => {
    try {
        // OpenRouteService Directions V2
        const url = `${ORS_BASE_URL}/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start.longitude},${start.latitude}&end=${end.longitude},${end.latitude}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.features && data.features.length > 0) {
            const feature = data.features[0];
            // Decode geometry (if encoded polyline) or use geojson
            // Default is geojson linestring
            const coordinates = feature.geometry.coordinates.map(coord => ({
                latitude: coord[1],
                longitude: coord[0]
            }));

            const props = feature.properties;
            const segments = props.segments[0]; // Assuming 1 segment

            const steps = segments.steps.map(step => ({
                instruction: step.instruction,
                name: step.name || "Unknown Road",
                distance: step.distance,
                duration: step.duration,
                maneuver: step.type // ORS maneuver types
            }));

            return {
                coordinates,
                distance: segments.distance, // meters
                duration: segments.duration, // seconds
                steps: steps
            };
        }
        return null;
    } catch (error) {
        console.error("Routing error:", error);
        return null;
    }
};

export const getDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return 0;

    const R = 6371e3; // metres
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

export const cacheLocation = async (location) => {
    try {
        await AsyncStorage.setItem('last_known_location', JSON.stringify(location));
    } catch (e) {
        console.log("Failed to cache location", e);
    }
};

export const getCachedLocation = async () => {
    try {
        const json = await AsyncStorage.getItem('last_known_location');
        return json ? JSON.parse(json) : null;
    } catch (e) {
        return null;
    }
};

export const MAP_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
