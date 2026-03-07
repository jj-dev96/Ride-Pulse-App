/**
 * SearchBar.tsx — Destination Search Bar Component
 *
 * Uses Mapbox Geocoding API for place search.
 * Features:
 *  - Debounced autocomplete suggestions
 *  - Source + destination input
 *  - "Use My Location" toggle
 *  - Suggestion list with icons
 *  - Returns coordinates when user selects a place
 */

import React, { useState, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, FlatList,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { searchPlaces } from '../services/mapService';
import { PlaceResult, Coordinate } from '../types';

// ── Props ──────────────────────────────────────────────────────────────────────
interface SearchBarProps {
    onSelectDestination: (place: PlaceResult) => void;
    onSelectStart?: (place: PlaceResult) => void;
    onUseCurrentLocation?: () => void;
    useCurrentLocation?: boolean;
    currentLocationName?: string;
    startQuery?: string;
    destQuery?: string;
    onStartQueryChange?: (text: string) => void;
    onDestQueryChange?: (text: string) => void;
    loading?: boolean;
    isDarkTheme?: boolean;
    locked?: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────
const SearchBar: React.FC<SearchBarProps> = ({
    onSelectDestination,
    onSelectStart,
    onUseCurrentLocation,
    useCurrentLocation = true,
    currentLocationName = 'My Location',
    startQuery = '',
    destQuery = '',
    onStartQueryChange,
    onDestQueryChange,
    loading = false,
    isDarkTheme = true,
    locked = false,
}) => {
    const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
    const [activeInput, setActiveInput] = useState<'start' | 'dest' | null>(null);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Locked State Logic ───────────────────────────────────────────
    const isDestLocked = locked;

    // ── Debounced search ──────────────────────────────────────────────────
    const handleSearch = useCallback((text: string, type: 'start' | 'dest') => {
        if (type === 'start') {
            onStartQueryChange?.(text);
        } else {
            onDestQueryChange?.(text);
        }
        setActiveInput(type);

        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        if (text.trim().length > 2) {
            searchTimerRef.current = setTimeout(async () => {
                try {
                    const results = await searchPlaces(text);
                    setSuggestions(results);
                } catch (err) {
                    console.warn('[SearchBar] Search error:', err);
                }
            }, 500);
        } else {
            setSuggestions([]);
        }
    }, [onStartQueryChange, onDestQueryChange]);

    // ── Select a suggestion ───────────────────────────────────────────────
    const handleSelectSuggestion = useCallback((item: PlaceResult) => {
        setSuggestions([]);
        if (activeInput === 'start') {
            onSelectStart?.(item);
        } else {
            onSelectDestination(item);
        }
    }, [activeInput, onSelectStart, onSelectDestination]);

    // ── Render suggestion item ────────────────────────────────────────────
    const renderSuggestion = useCallback(({ item }: { item: PlaceResult }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleSelectSuggestion(item)}
            activeOpacity={0.7}
        >
            <MaterialIcons name="location-on" size={18} color="#FFD700" style={{ marginRight: 10 }} />
            <View style={styles.suggestionContent}>
                <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.suggestionName, !isDarkTheme && styles.suggestionNameLight]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.suggestionAddress, !isDarkTheme && styles.suggestionAddressLight]} numberOfLines={1}>{item.fullAddress}</Text>
            </View>
        </TouchableOpacity>
    ), [handleSelectSuggestion, isDarkTheme]);

    return (
        <View style={[styles.container, !isDarkTheme && styles.containerLight]}>
            {/* Source Input */}
            <View style={[styles.inputRow, !isDarkTheme && styles.inputRowLight, locked && styles.inputRowLocked]}>
                <TouchableOpacity onPress={onUseCurrentLocation} disabled={useCurrentLocation || locked}>
                    <MaterialIcons
                        name={useCurrentLocation ? "my-location" : "location-searching"}
                        size={18}
                        color={useCurrentLocation ? '#3B82F6' : (isDarkTheme ? '#9CA3AF' : '#64748b')}
                        style={{ marginRight: 10 }}
                    />
                </TouchableOpacity>
                <TextInput
                    style={[styles.textInput, !isDarkTheme && styles.textInputLight]}
                    placeholder="Starting point?"
                    placeholderTextColor={isDarkTheme ? "#9CA3AF" : "#64748b"}
                    value={useCurrentLocation ? currentLocationName : startQuery}
                    onChangeText={(t) => handleSearch(t, 'start')}
                    onFocus={() => setActiveInput('start')}
                    editable={!useCurrentLocation && !locked}
                />
                {!useCurrentLocation && !locked && (
                    <TouchableOpacity onPress={onUseCurrentLocation} style={styles.gpsResetBtn}>
                        <MaterialIcons name="gps-fixed" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={[styles.inputDivider, !isDarkTheme && styles.inputDividerLight]} />

            {/* Destination Input */}
            <View style={[styles.inputRow, !isDarkTheme && styles.inputRowLight, locked && styles.inputRowLocked]}>
                <MaterialIcons name="place" size={18} color="#EF4444" style={{ marginRight: 10 }} />
                <TextInput
                    style={[styles.textInput, !isDarkTheme && styles.textInputLight]}
                    placeholder="Where to?"
                    placeholderTextColor={isDarkTheme ? "#9CA3AF" : "#64748b"}
                    value={destQuery}
                    onChangeText={(t) => handleSearch(t, 'dest')}
                    onFocus={() => setActiveInput('dest')}
                    editable={!locked}
                />
                {loading && (
                    <ActivityIndicator size="small" color="#3B82F6" style={{ marginLeft: 8 }} />
                )}
                {!locked && destQuery.length > 0 && (
                    <TouchableOpacity onPress={() => onDestQueryChange?.('')}>
                        <MaterialIcons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Suggestions List */}
            {!isDestLocked && suggestions.length > 0 && (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSuggestion}
                    style={styles.suggestionsContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        margin: 15,
        backgroundColor: 'rgba(15,17,26,0.95)',
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1F2937',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    textInput: {
        flex: 1,
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    inputDivider: {
        height: 1,
        backgroundColor: '#374151',
        marginVertical: 8,
        marginHorizontal: 10,
        opacity: 0.5,
    },
    gpsResetBtn: {
        padding: 4,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 6,
    },
    suggestionsContainer: {
        backgroundColor: '#161925',
        borderRadius: 10,
        marginTop: 8,
        maxHeight: 250,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#374151',
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
    },
    suggestionContent: {
        flex: 1,
    },
    suggestionName: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    suggestionAddress: {
        color: '#9CA3AF',
        fontSize: 11,
        marginTop: 2,
    },
    inputRowLocked: {
        backgroundColor: '#161925',
        borderColor: '#374151',
        borderWidth: 1,
        opacity: 0.9,
    },
    lockedLabel: {
        color: '#FFD700',
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: -2,
        letterSpacing: 0.5,
    },
    // ── Light Theme Styles ──────────────────────────────────
    containerLight: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
    },
    inputRowLight: {
        backgroundColor: '#f1f5f9',
    },
    textInputLight: {
        color: '#0f172a',
    },
    inputDividerLight: {
        backgroundColor: '#e2e8f0',
    },
    suggestionsContainerLight: {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
    },
    suggestionNameLight: {
        color: '#0f172a',
    },
    suggestionAddressLight: {
        color: '#64748b',
    },
});

export default SearchBar;
