/**
 * Geographical calculation helpers and domain constants.
 * Canonical implementation shared across backend microservices and mobile clients.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Standard geofence tolerance in meters per SRS FR-MOB-001
 */
export const GEOFENCE_TOLERANCE_METERS = 200;

/**
 * Calculate the great-circle distance between two points on the Earth surface
 * using the Haversine formula.
 *
 * @param coord1 First coordinate (latitude, longitude in degrees)
 * @param coord2 Second coordinate (latitude, longitude in degrees)
 * @returns Distance in meters
 */
export function calculateDistanceMeters(coord1: Coordinates, coord2: Coordinates): number {
  if (
    !coord1 ||
    !coord2 ||
    typeof coord1.latitude !== 'number' ||
    typeof coord1.longitude !== 'number' ||
    typeof coord2.latitude !== 'number' ||
    typeof coord2.longitude !== 'number' ||
    isNaN(coord1.latitude) ||
    isNaN(coord1.longitude) ||
    isNaN(coord2.latitude) ||
    isNaN(coord2.longitude)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const R = 6371e3; // Earth's mean radius in meters
  const phi1 = (coord1.latitude * Math.PI) / 180;
  const phi2 = (coord2.latitude * Math.PI) / 180;
  const deltaPhi = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLambda = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Determine whether a technician location falls within the allowed geofence
 * radius of the target job site.
 *
 * @param techLocation Current GPS coordinates reported by the technician
 * @param jobLocation Stored coordinates of the work order site
 * @param radiusMeters Maximum allowed distance in meters (defaults to 200m per SRS FR-MOB-001)
 */
export function isWithinGeofence(
  techLocation: Coordinates,
  jobLocation: Coordinates,
  radiusMeters: number = GEOFENCE_TOLERANCE_METERS
): boolean {
  const distance = calculateDistanceMeters(techLocation, jobLocation);
  return distance <= radiusMeters;
}
