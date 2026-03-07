import { db } from '../config/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    limit,
    serverTimestamp,
    doc,
    updateDoc,
    getDoc,
    setDoc,
    DocumentData
} from 'firebase/firestore';
import { AchievementsMap, RideData, UserStats } from '../types';

export const RideService = {
    // Log a completed ride
    logRide: async (userId: string, rideData: RideData): Promise<string> => {
        try {
            // Final check on profile completeness
            const userSnap = await getDoc(doc(db, 'users', userId));
            if (!userSnap.exists() || !(userSnap.data() as DocumentData)?.profile?.profileCompleted) {
                throw new Error("Profile must be completed to log rides.");
            }
            const rideRef = collection(db, 'rides');
            const newRide = {
                userId,
                ...rideData,
                timestamp: serverTimestamp(),
                status: 'completed'
            };
            const docRef = await addDoc(rideRef, newRide);

            // Trigger stats update and achievement check
            await RideService.updateUserStats(userId, rideData);
            await RideService.checkAchievements(userId, rideData);

            return docRef.id;
        } catch (error) {
            console.error("Error logging ride:", error);
            throw error;
        }
    },

    // Update aggregated user stats
    updateUserStats: async (userId: string, rideData: RideData): Promise<void> => {
        try {
            const statsRef = doc(db, 'users', userId, 'stats', 'overall');
            const docSnap = await getDoc(statsRef);

            const { distance, duration, maxSpeed } = rideData;

            if (docSnap.exists()) {
                const currentStats = docSnap.data() as UserStats;
                await updateDoc(statsRef, {
                    totalDistance: (currentStats.totalDistance || 0) + distance,
                    totalRides: (currentStats.totalRides || 0) + 1,
                    totalDuration: (currentStats.totalDuration || 0) + duration,
                    maxSpeed: Math.max(currentStats.maxSpeed || 0, maxSpeed || 0),
                    longestRide: Math.max(currentStats.longestRide || 0, distance),
                    lastRide: rideData,
                    updatedAt: serverTimestamp()
                });
            } else {
                await setDoc(statsRef, {
                    totalDistance: distance,
                    totalRides: 1,
                    totalDuration: duration,
                    maxSpeed: maxSpeed || 0,
                    longestRide: distance,
                    lastRide: rideData,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error updating user stats:", error);
        }
    },

    // Get user stats
    getUserStats: async (userId: string): Promise<UserStats | null> => {
        try {
            const statsRef = doc(db, 'users', userId, 'stats', 'overall');
            const docSnap = await getDoc(statsRef);
            return docSnap.exists() ? (docSnap.data() as UserStats) : null;
        } catch (error) {
            console.error("Error fetching user stats:", error);
            return null;
        }
    },

    // Get recently completed rides
    getRideHistory: async (userId: string, limitCount: number = 5): Promise<RideData[]> => {
        try {
            const q = query(
                collection(db, 'rides'),
                where('userId', '==', userId),
                limit(50)
            );
            const querySnapshot = await getDocs(q);
            let rides = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as any));

            rides = rides.filter(r => r.status === 'completed');

            rides.sort((a, b) => {
                const tsA = a.timestamp as { toMillis?: () => number; seconds?: number } | undefined;
                const tsB = b.timestamp as { toMillis?: () => number; seconds?: number } | undefined;
                const timeA = tsA?.toMillis ? tsA.toMillis() : (tsA?.seconds ? tsA.seconds * 1000 : 0);
                const timeB = tsB?.toMillis ? tsB.toMillis() : (tsB?.seconds ? tsB.seconds * 1000 : 0);
                return timeB - timeA;
            });

            return rides.slice(0, limitCount);
        } catch (error) {
            console.error("Error fetching ride history:", error);
            return [];
        }
    },

    // Achievement logic
    checkAchievements: async (userId: string, lastRide: RideData): Promise<void> => {
        try {
            const stats = await RideService.getUserStats(userId);
            if (!stats) return;

            const achievementsRef = doc(db, 'users', userId, 'achievements', 'list');
            const achSnap = await getDoc(achievementsRef);
            const unlocked: AchievementsMap = achSnap.exists() ? (achSnap.data()?.unlocked ?? {}) : {};

            const newUnlocks: AchievementsMap = { ...unlocked };
            let hasNew = false;

            const checkAndUnlock = (id: string): boolean => {
                if (!newUnlocks[id]) {
                    newUnlocks[id] = { unlockedAt: new Date().toISOString() };
                    hasNew = true;
                    return true;
                }
                return false;
            };

            // Basic achievements
            if (stats.totalRides >= 1) checkAndUnlock('first_ride');
            if (stats.totalDistance >= 50) checkAndUnlock('50km_club');
            if (stats.totalDistance >= 100) checkAndUnlock('100km_rider');
            if (stats.totalRides >= 10) checkAndUnlock('10_rides');

            // Advanced achievements
            if (stats.longestRide > 200) checkAndUnlock('marathon_rider');
            if (stats.maxSpeed > 120) checkAndUnlock('speed_master');

            // Time based achievements
            const hour = new Date().getHours();
            if (hour >= 22 || hour <= 4) checkAndUnlock('night_rider');
            if (hour >= 5 && hour <= 7) checkAndUnlock('early_bird');

            if (hasNew) {
                await setDoc(achievementsRef, { unlocked: newUnlocks }, { merge: true });
            }
        } catch (error) {
            console.error("Error checking achievements:", error);
        }
    },

    getAchievements: async (userId: string): Promise<AchievementsMap> => {
        try {
            const achievementsRef = doc(db, 'users', userId, 'achievements', 'list');
            const achSnap = await getDoc(achievementsRef);
            return achSnap.exists() ? (achSnap.data()?.unlocked ?? {}) : {};
        } catch (error) {
            console.error("Error fetching achievements:", error);
            return {};
        }
    }
};
