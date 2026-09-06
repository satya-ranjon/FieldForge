import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GpsRadarProps {
  distanceMeters: number;
  isVerified: boolean;
}

export const GpsRadar: React.FC<GpsRadarProps> = ({ distanceMeters, isVerified }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>GPS Geofence Radar</Text>
      <Text style={[styles.status, isVerified ? styles.verified : styles.unverified]}>
        {isVerified
          ? '✅ Within Site Radius (<200m)'
          : `📍 ${distanceMeters.toFixed(0)}m from Site`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginVertical: 10
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  verified: {
    color: '#34d399'
  },
  unverified: {
    color: '#fbbf24'
  }
});
