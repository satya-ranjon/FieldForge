/* global jest */
module.exports = {
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined'
  },
  Accuracy: {
    High: 4,
    Balanced: 3,
    Low: 1
  },
  getForegroundPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    status: 'granted'
  })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({
    granted: true,
    canAskAgain: true,
    status: 'granted'
  })),
  getCurrentPositionAsync: jest.fn(async () => ({
    coords: {
      latitude: 37.7751,
      longitude: -122.4193,
      altitude: 10,
      accuracy: 5,
      heading: 0,
      speed: 0
    },
    timestamp: Date.now()
  }))
};
