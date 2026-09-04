export interface Coordinates {
  latitude: number;
  longitude: number;
}

export class GeofenceService {
  /**
   * Calculate Haversine distance in meters between tech GPS and job location
   */
  static calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Client-side UX check for geofence proximity (SRS FR-MOB-001).
   * Note: The authoritative security boundary is enforced server-side.
   */
  static isWithinGeofence(
    techLocation: Coordinates,
    jobLocation: Coordinates,
    radiusMeters = 200
  ): boolean {
    const distance = this.calculateDistanceMeters(techLocation, jobLocation);
    return distance <= radiusMeters;
  }
}
