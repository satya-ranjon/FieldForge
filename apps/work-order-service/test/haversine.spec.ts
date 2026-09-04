import {
  calculateDistanceMeters,
  isWithinGeofence,
  GEOFENCE_TOLERANCE_METERS
} from '@fieldforge/common';

describe('Haversine Geofencing (FR-MOB-001 / H5)', () => {
  const jobSite = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco Market St

  it('calculates 0 meters for identical coordinates', () => {
    const distance = calculateDistanceMeters(jobSite, { ...jobSite });
    expect(distance).toBe(0);
    expect(isWithinGeofence(jobSite, jobSite)).toBe(true);
  });

  it('default tolerance is 200 meters per SRS FR-MOB-001', () => {
    expect(GEOFENCE_TOLERANCE_METERS).toBe(200);
  });

  it('accepts technician at 199 meters and rejects at 201 meters', () => {
    // 1 degree latitude = ~111,139 meters.
    // 199m = 199 / (6371000 * pi / 180) degrees = 199 / 111194.9266 degrees
    const metersPerDegreeLat = (6371e3 * Math.PI) / 180;
    const delta199 = 199 / metersPerDegreeLat;
    const delta201 = 201 / metersPerDegreeLat;

    const loc199 = {
      latitude: jobSite.latitude + delta199,
      longitude: jobSite.longitude
    };

    const loc201 = {
      latitude: jobSite.latitude + delta201,
      longitude: jobSite.longitude
    };

    const dist199 = calculateDistanceMeters(loc199, jobSite);
    const dist201 = calculateDistanceMeters(loc201, jobSite);

    expect(Math.round(dist199)).toBe(199);
    expect(Math.round(dist201)).toBe(201);

    expect(isWithinGeofence(loc199, jobSite, 200)).toBe(true);
    expect(isWithinGeofence(loc201, jobSite, 200)).toBe(false);
  });

  it('correctly calculates distance across negative / southern coordinates', () => {
    const sydney = { latitude: -33.8688, longitude: 151.2093 };
    const nearSydney = { latitude: -33.8679, longitude: 151.2093 }; // ~100m north

    const distance = calculateDistanceMeters(nearSydney, sydney);
    expect(distance).toBeGreaterThan(90);
    expect(distance).toBeLessThan(110);
    expect(isWithinGeofence(nearSydney, sydney, 200)).toBe(true);
  });

  it('safely handles NaN, null, or missing coordinates by returning infinity and failing geofence', () => {
    const invalidLoc = { latitude: NaN, longitude: -122.4194 };
    expect(calculateDistanceMeters(invalidLoc, jobSite)).toBe(Number.POSITIVE_INFINITY);
    expect(isWithinGeofence(invalidLoc, jobSite, 200)).toBe(false);

    // @ts-expect-error testing null safety
    expect(calculateDistanceMeters(null, jobSite)).toBe(Number.POSITIVE_INFINITY);
    // @ts-expect-error testing null safety
    expect(isWithinGeofence(null, jobSite, 200)).toBe(false);
  });
});
