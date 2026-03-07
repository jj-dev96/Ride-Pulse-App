import { GroupMember, Coordinate } from '../types';
import { getDistance } from './mapService';

export interface RiderFormation {
    id: string;
    username: string;
    distanceBehind: number;
    color?: string;
    isLeader: boolean;
}

export const FormationService = {
    /**
     * Calculates the group formation order based on the leader (host).
     * Goal: Show which rider is leading and how far others are behind.
     */
    calculateFormation: (members: GroupMember[], hostId: string): RiderFormation[] => {
        const leader = members.find(m => m.id === hostId);
        if (!leader || typeof leader.latitude !== 'number') {
            return [];
        }

        const leaderCoord: Coordinate = {
            latitude: leader.latitude,
            longitude: leader.longitude
        };

        const formations = members.map(m => {
            let distance = 0;
            if (typeof m.latitude === 'number' && typeof m.longitude === 'number') {
                distance = getDistance(leaderCoord, {
                    latitude: m.latitude,
                    longitude: m.longitude
                });
            }

            return {
                id: m.id,
                username: m.username || m.name,
                distanceBehind: Math.round(distance),
                color: m.color,
                isLeader: m.id === hostId
            };
        });

        // Sort riders by distance: 0 (leader) first, then positive distances
        // (Assuming leader is ahead, others are behind). 
        // In a real route-based calc, we'd check distance along polyline.
        return formations.sort((a, b) => a.distanceBehind - b.distanceBehind);
    }
};
