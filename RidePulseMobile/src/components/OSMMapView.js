
import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const OSMMapView = ({
    location,
    destination,
    routeCoords = [],
    isRideActive,
    onMapReady,
    geofenceRadius, // in meters
    members = [], // Array of {id, latitude, longitude, name, active}
    style
}) => {
    const webViewRef = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Initial HTML content with Leaflet
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
            <style>
                body { margin: 0; padding: 0; background-color: #242f3e; }
                #map { height: 100vh; width: 100vw; }
                .leaflet-control-attribution { display: none; } /* Hide attribution for cleaner UI */
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                var map = L.map('map', { zoomControl: false }).setView([0, 0], 2);
                
                // Dark Theme Tiles (CartoDB Dark Matter) matches the app aesthetic better than standard OSM
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19
                }).addTo(map);

                var userMarker = null;
                var destMarker = null;
                var destCircle = null;
                var routePolyline = null;
                var userIcon = L.divIcon({
                    className: 'user-marker',
                    html: '<div style="background-color: #FFD700; width: 16px; height: 16px; border-radius: 50%; border: 2px solid black;"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                });

                var destIcon = L.divIcon({
                    className: 'dest-marker',
                    html: '<div style="background-color: #EF4444; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12]
                });

                // Function to update user location
                window.updateLocation = function(lat, lng, heading) {
                    if (!userMarker) {
                        userMarker = L.marker([lat, lng], {icon: userIcon}).addTo(map);
                        map.setView([lat, lng], 15);
                    } else {
                        userMarker.setLatLng([lat, lng]);
                    }
                };

                // Function to set destination with optional geofence
                window.setDestination = function(lat, lng, radius) {
                    if (destMarker) map.removeLayer(destMarker);
                    if (destCircle) map.removeLayer(destCircle);
                    
                    if (lat && lng) {
                        destMarker = L.marker([lat, lng], {icon: destIcon}).addTo(map);
                        
                        // Draw Geofence Circle
                        if (radius && radius > 0) {
                            destCircle = L.circle([lat, lng], {
                                color: '#10B981',
                                fillColor: '#10B981',
                                fillOpacity: 0.1,
                                radius: radius
                            }).addTo(map);
                        }

                        // Fit bounds to include both user and dest
                        if (userMarker) {
                            var group = new L.featureGroup([userMarker, destMarker]);
                            map.fitBounds(group.getBounds().pad(0.2));
                        }
                    }
                };

                // Function to draw route
                window.setRoute = function(coords) {
                    if (routePolyline) map.removeLayer(routePolyline);
                    if (coords && coords.length > 0) {
                        // Convert {latitude, longitude} array to [[lat, lng]]
                        var latlngs = coords.map(c => [c.latitude, c.longitude]);
                        routePolyline = L.polyline(latlngs, {
                            color: '#10B981',
                            weight: 5,
                            opacity: 0.8
                        }).addTo(map);
                        map.fitBounds(routePolyline.getBounds().pad(0.2));
                    }
                };
                
                // Function to update multiple members
                var memberMarkers = {};
                window.setMembers = function(members) {
                    // Remove markers for members no longer in the list or inactive
                    var currentIds = members.filter(m => m.active).map(m => m.id);
                    Object.keys(memberMarkers).forEach(function(id) {
                        if (currentIds.indexOf(id) === -1) {
                            map.removeLayer(memberMarkers[id]);
                            delete memberMarkers[id];
                        }
                    });

                    members.forEach(function(m) {
                        if (!m.active || !m.latitude || !m.longitude) return;
                        
                        var latlng = [m.latitude, m.longitude];
                        if (memberMarkers[m.id]) {
                            memberMarkers[m.id].setLatLng(latlng);
                        } else {
                            var icon = L.divIcon({
                                className: 'member-marker',
                                html: '<div style="background-color: #10B981; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;"><span style="color: white; font-size: 8px; font-weight: bold; position: absolute; top: 16px; background: rgba(0,0,0,0.5); padding: 2px 4px; border-radius: 4px; white-space: nowrap;">'+m.name+'</span></div>',
                                iconSize: [14, 14],
                                iconAnchor: [7, 7]
                            });
                            memberMarkers[m.id] = L.marker(latlng, {icon: icon}).addTo(map);
                        }
                    });
                };
                
                // Signal ready
                window.ReactNativeWebView.postMessage("MAP_READY");

            </script>
        </body>
        </html>
    `;

    // Handle updates via JS Injection
    useEffect(() => {
        if (mapLoaded && location) {
            const script = `window.updateLocation(${location.latitude}, ${location.longitude}, ${location.heading || 0}); true;`;
            webViewRef.current?.injectJavaScript(script);
        }
    }, [location, mapLoaded]);

    useEffect(() => {
        if (mapLoaded) {
            if (destination) {
                const radius = geofenceRadius || 0;
                const script = `window.setDestination(${destination.latitude}, ${destination.longitude}, ${radius}); true;`;
                webViewRef.current?.injectJavaScript(script);
            } else {
                webViewRef.current?.injectJavaScript(`
                    if(destMarker) map.removeLayer(destMarker); destMarker=null;
                    if(destCircle) map.removeLayer(destCircle); destCircle=null;
                    true;
                `);
            }
        }
    }, [destination, mapLoaded]);

    useEffect(() => {
        if (mapLoaded) {
            if (routeCoords && routeCoords.length > 0) {
                const coordsJson = JSON.stringify(routeCoords);
                const script = `window.setRoute(${coordsJson}); true;`;
                webViewRef.current?.injectJavaScript(script);
            } else {
                webViewRef.current?.injectJavaScript(`if(routePolyline) map.removeLayer(routePolyline); routePolyline=null; true;`);
            }
        }
    }, [routeCoords, mapLoaded]);

    useEffect(() => {
        if (mapLoaded) {
            const script = `window.setMembers(${JSON.stringify(members)}); true;`;
            webViewRef.current?.injectJavaScript(script);
        }
    }, [members, mapLoaded]);

    return (
        <View style={style}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={{ flex: 1, backgroundColor: '#242f3e' }}
                onMessage={(event) => {
                    if (event.nativeEvent.data === "MAP_READY") {
                        setMapLoaded(true);
                        if (onMapReady) onMapReady();
                    }
                }}
            />
            {!mapLoaded && (
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F111A' }]}>
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            )}
        </View>
    );
};

export default OSMMapView;
