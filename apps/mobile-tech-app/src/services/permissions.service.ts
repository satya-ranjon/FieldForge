import * as Location from 'expo-location';

export interface LocationPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus | 'undetermined';
}

export class PermissionsService {
  /**
   * Check current foreground location permission status
   */
  static async checkLocationPermission(): Promise<LocationPermissionState> {
    try {
      const response = await Location.getForegroundPermissionsAsync();
      return {
        granted: response.granted,
        canAskAgain: response.canAskAgain,
        status: response.status
      };
    } catch {
      return {
        granted: false,
        canAskAgain: true,
        status: 'undetermined'
      };
    }
  }

  /**
   * Request foreground location permissions from the user
   */
  static async requestLocationPermission(): Promise<LocationPermissionState> {
    try {
      const response = await Location.requestForegroundPermissionsAsync();
      return {
        granted: response.granted,
        canAskAgain: response.canAskAgain,
        status: response.status
      };
    } catch {
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED
      };
    }
  }

  /**
   * Get current device coordinates if permission is granted
   */
  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    const permission = await this.checkLocationPermission();
    if (!permission.granted) {
      const requested = await this.requestLocationPermission();
      if (!requested.granted) {
        return null;
      }
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    } catch {
      return null;
    }
  }
}
