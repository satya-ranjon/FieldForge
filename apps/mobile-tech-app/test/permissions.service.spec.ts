import { PermissionsService } from '../src/services/permissions.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LocationMock = require('expo-location');

describe('PermissionsService (L7)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checks location permissions returning granted state', async () => {
    LocationMock.getForegroundPermissionsAsync.mockResolvedValueOnce({
      granted: true,
      canAskAgain: true,
      status: 'granted'
    });

    const result = await PermissionsService.checkLocationPermission();
    expect(result.granted).toBe(true);
    expect(result.status).toBe('granted');
  });

  it('requests location permissions and returns user response', async () => {
    LocationMock.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      granted: true,
      canAskAgain: true,
      status: 'granted'
    });

    const result = await PermissionsService.requestLocationPermission();
    expect(result.granted).toBe(true);
    expect(LocationMock.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('fetches high accuracy device coordinates when permission is granted', async () => {
    LocationMock.getForegroundPermissionsAsync.mockResolvedValueOnce({
      granted: true,
      canAskAgain: true,
      status: 'granted'
    });

    const coords = await PermissionsService.getCurrentLocation();
    expect(coords).not.toBeNull();
    expect(coords?.latitude).toBe(37.7751);
    expect(coords?.longitude).toBe(-122.4193);
  });

  it('returns null if permission is denied', async () => {
    LocationMock.getForegroundPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      canAskAgain: false,
      status: 'denied'
    });
    LocationMock.requestForegroundPermissionsAsync.mockResolvedValueOnce({
      granted: false,
      canAskAgain: false,
      status: 'denied'
    });

    const coords = await PermissionsService.getCurrentLocation();
    expect(coords).toBeNull();
  });
});
