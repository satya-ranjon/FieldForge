import {
  GeofenceService,
  GEOFENCE_TOLERANCE_METERS,
  calculateDistanceMeters,
  isWithinGeofence
} from '../src/services/geofencing.service';

describe('GeofenceService (FR-MOB-001 & Standardized 200m Boundary)', () => {
  const siteLocation = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco City Hall

  it('standardizes geofence tolerance to 200 metres', () => {
    expect(GEOFENCE_TOLERANCE_METERS).toBe(200);
  });

  it('calculates 0m for identical coordinates', () => {
    const dist = GeofenceService.calculateDistanceMeters(siteLocation, siteLocation);
    expect(dist).toBe(0);
    expect(GeofenceService.isWithinGeofence(siteLocation, siteLocation)).toBe(true);
  });

  it('accepts coordinates within the 200m threshold (199m verified)', () => {
    // Offset by ~0.00179 degrees latitude (~199 metres)
    const withinLocation = {
      latitude: siteLocation.latitude + 0.00178,
      longitude: siteLocation.longitude
    };

    const dist = GeofenceService.calculateDistanceMeters(withinLocation, siteLocation);
    expect(dist).toBeLessThan(200);
    expect(dist).toBeGreaterThan(190);
    expect(GeofenceService.isWithinGeofence(withinLocation, siteLocation)).toBe(true);
  });

  it('accepts coordinates at exactly 200m or slightly less', () => {
    const nearLocation = {
      latitude: 37.7751,
      longitude: -122.4193 // ~25m away
    };
    const dist = calculateDistanceMeters(nearLocation, siteLocation);
    expect(dist).toBeLessThan(50);
    expect(isWithinGeofence(nearLocation, siteLocation, 200)).toBe(true);
  });

  it('rejects coordinates beyond the 200m threshold (201m+ verified)', () => {
    // Offset by ~0.0025 degrees latitude (~278 metres)
    const beyondLocation = {
      latitude: siteLocation.latitude + 0.0025,
      longitude: siteLocation.longitude
    };

    const dist = GeofenceService.calculateDistanceMeters(beyondLocation, siteLocation);
    expect(dist).toBeGreaterThan(200);
    expect(GeofenceService.isWithinGeofence(beyondLocation, siteLocation)).toBe(false);
  });

  it('handles invalid, NaN, or missing coordinates safely', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(GeofenceService.calculateDistanceMeters(null as any, siteLocation)).toBe(
      Number.POSITIVE_INFINITY
    );
    expect(
      GeofenceService.calculateDistanceMeters({ latitude: NaN, longitude: -122.4194 }, siteLocation)
    ).toBe(Number.POSITIVE_INFINITY);

    expect(GeofenceService.isWithinGeofence({ latitude: NaN, longitude: NaN }, siteLocation)).toBe(
      false
    );
  });
});
