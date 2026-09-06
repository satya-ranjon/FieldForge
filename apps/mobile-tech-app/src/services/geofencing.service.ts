import {
  Coordinates,
  GEOFENCE_TOLERANCE_METERS,
  calculateDistanceMeters,
  isWithinGeofence
} from '@fieldforge/contracts';

export type { Coordinates };
export { GEOFENCE_TOLERANCE_METERS, calculateDistanceMeters, isWithinGeofence };

export class GeofenceService {
  /**
   * Calculate Haversine distance in meters between tech GPS and job location
   */
  static calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
    return calculateDistanceMeters(coord1, coord2);
  }

  /**
   * Client-side UX check for geofence proximity (SRS FR-MOB-001).
   * Note: The authoritative security boundary is enforced server-side.
   * Default radius is 200m per SRS FR-MOB-001.
   */
  static isWithinGeofence(
    techLocation: Coordinates,
    jobLocation: Coordinates,
    radiusMeters: number = GEOFENCE_TOLERANCE_METERS
  ): boolean {
    return isWithinGeofence(techLocation, jobLocation, radiusMeters);
  }
}
