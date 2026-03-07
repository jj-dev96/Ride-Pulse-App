/**
 * useGroupTracking.ts
 *
 * Dual responsibilities:
 *  1. Publish the current user's GPS to Firestore every 3 seconds into:
 *       rides/{groupId}/members/{userId}
 *  2. Subscribe to the entire members subcollection via onSnapshot.
 *  3. Animate each member's marker position smoothly with Animated.Value.
 *
 * Usage:
 *   const { members, publishLocation } = useGroupTracking(groupId, userId);
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { db } from '../config/firebase';
import {
    doc,
    updateDoc,
    collection,
    onSnapshot,
    serverTimestamp,
    Unsubscribe,
} from 'firebase/firestore';
import { GroupMember, Coordinate } from '../types';

// ── Exported types ─────────────────────────────────────────────────────────────

export interface AnimatedMember extends GroupMember {
    animLat: Animated.Value;
    animLng: Animated.Value;
}

interface UseGroupTrackingReturn {
    /** Live member array (excludes the current user) */
    members: AnimatedMember[];
    /** Call with the latest GPS fix. Will be pushed to Firestore every 3 seconds. */
    publishLocation: (coords: Coordinate) => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

const useGroupTracking = (
    groupId: string | null | undefined,
    userId: string | null | undefined
): UseGroupTrackingReturn => {
    const [members, setMembers] = useState<AnimatedMember[]>([]);

    const pendingCoordsRef = useRef<Coordinate | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const unsubRef = useRef<Unsubscribe | null>(null);
    // Stable map of id → AnimatedMember so we reuse Animated.Value instances
    const membersMapRef = useRef<Map<string, AnimatedMember>>(new Map());

    // ── Flush pending location to Firestore ────────────────────────────────────
    const flushLocation = useCallback(async () => {
        if (!groupId || !userId || !pendingCoordsRef.current) return;

        const { latitude, longitude, speed = 0, heading = 0 } = pendingCoordsRef.current;

        // Final guard against invalid coordinates
        if (typeof latitude !== 'number' || typeof longitude !== 'number') return;
        try {
            const memberRef = doc(db, 'rides', groupId, 'members', userId);
            await updateDoc(memberRef, {
                latitude,
                longitude,
                speed,
                heading,
                isOnline: true,
                lastUpdated: serverTimestamp(),
            });
        } catch (err) {
            console.warn('[useGroupTracking] flushLocation error:', err);
        }
    }, [groupId, userId]);

    // ── Store incoming GPS – actual write is debounced to interval ─────────────
    const publishLocation = useCallback((coords: Coordinate) => {
        pendingCoordsRef.current = coords;
    }, []);

    // ── 3-second publish interval ──────────────────────────────────────────────
    useEffect(() => {
        if (!groupId || !userId) return;
        intervalRef.current = setInterval(flushLocation, 3000);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [groupId, userId, flushLocation]);

    // ── Firestore real-time listener ───────────────────────────────────────────
    useEffect(() => {
        if (!groupId) {
            setMembers([]);
            return;
        }

        const membersCol = collection(db, 'rides', groupId, 'members');

        unsubRef.current = onSnapshot(
            membersCol,
            (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const data = change.doc.data() as GroupMember;
                    const id = change.doc.id;

                    // Safety Check: If data is missing or it's a removal
                    if (!data || change.type === 'removed' || data.isOnline === false) {
                        membersMapRef.current.delete(id);
                        return;
                    }

                    // Ensure ID is present in the object (Firestore data doesn't include doc ID automatically)
                    const memberData = { ...data, id };

                    const lat = typeof data.latitude === 'number' ? data.latitude : 0;
                    const lng = typeof data.longitude === 'number' ? data.longitude : 0;

                    if (membersMapRef.current.has(id)) {
                        const existing = membersMapRef.current.get(id)!;
                        // Smooth animated slide to new position
                        Animated.timing(existing.animLat, {
                            toValue: lat,
                            duration: 800,
                            useNativeDriver: false,
                        }).start();
                        Animated.timing(existing.animLng, {
                            toValue: lng,
                            duration: 800,
                            useNativeDriver: false,
                        }).start();

                        membersMapRef.current.set(id, {
                            ...memberData,
                            animLat: existing.animLat,
                            animLng: existing.animLng,
                        });
                    } else {
                        membersMapRef.current.set(id, {
                            ...memberData,
                            animLat: new Animated.Value(lat),
                            animLng: new Animated.Value(lng),
                        });
                    }
                });

                // Rebuild state array, excluding self
                const updated = Array.from(membersMapRef.current.values()).filter(
                    (m) => m.id !== userId && m.isOnline !== false
                );
                setMembers([...updated]);
            },
            (err) => {
                console.error('[useGroupTracking] onSnapshot error:', err);
            }
        );

        return () => {
            unsubRef.current?.();
            membersMapRef.current.clear();
            setMembers([]);
        };
    }, [groupId, userId]);

    return { members, publishLocation };
};

export default useGroupTracking;
