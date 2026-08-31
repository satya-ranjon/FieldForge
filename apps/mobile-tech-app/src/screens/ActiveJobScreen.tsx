import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { GpsRadar } from '../components/GpsRadar';
import { GeofenceService } from '../services/geofencing.service';

export const ActiveJobScreen: React.FC = () => {
  const [isOnSite, setIsOnSite] = useState(false);

  const jobLocation = { latitude: 37.7749, longitude: -122.4194 };
  const mockTechLocation = { latitude: 37.7751, longitude: -122.4193 }; // ~25m away

  const distance = GeofenceService.calculateDistanceMeters(mockTechLocation, jobLocation);
  const canCheckIn = GeofenceService.isWithinGeofence(mockTechLocation, jobLocation, 100);

  const handleCheckIn = () => {
    if (canCheckIn) {
      setIsOnSite(true);
      Alert.alert('Checked In', 'GPS location verified. State transitioned to ON_SITE.');
    } else {
      Alert.alert('Geofence Error', 'You must be within 100 meters of the job location to check in.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Active Gig #WO-8910</Text>
      <Text style={styles.subtitle}>Emergency POS Terminal Swap</Text>

      <GpsRadar distanceMeters={distance} isVerified={canCheckIn} />

      <TouchableOpacity
        style={[styles.button, canCheckIn ? styles.buttonActive : styles.buttonDisabled]}
        onPress={handleCheckIn}
        disabled={!canCheckIn}
      >
        <Text style={styles.buttonText}>{isOnSite ? 'Currently On Site' : 'Geofence Check-In'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  title: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonActive: {
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    backgroundColor: '#334155',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
