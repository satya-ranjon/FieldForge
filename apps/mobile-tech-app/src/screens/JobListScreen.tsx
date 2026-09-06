import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setActiveJob, WorkOrderJob } from '../store/slices/jobSlice';
import { GeofenceService } from '../services/geofencing.service';

interface JobListScreenProps {
  onSelectJob: (job: WorkOrderJob) => void;
}

export const JobListScreen: React.FC<JobListScreenProps> = ({ onSelectJob }) => {
  const dispatch = useDispatch();
  const assignedJobs = useSelector((state: RootState) => state.job.assignedJobs);
  const currentCoords = useSelector((state: RootState) => state.job.currentCoordinates);
  const user = useSelector((state: RootState) => state.auth.user);
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  const pendingCount = useSelector((state: RootState) => state.sync.pendingCount);

  const handleJobPress = (job: WorkOrderJob) => {
    dispatch(setActiveJob(job));
    onSelectJob(job);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>FieldForge Dispatch</Text>
          <Text style={styles.headerSubtitle}>
            Technician: {user?.fullName ?? 'Technician'} ({user?.rating?.toFixed(2)} ★)
          </Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={[styles.networkBadge, isOnline ? styles.badgeOnline : styles.badgeOffline]}>
            <Text style={styles.networkBadgeText}>{isOnline ? 'ONLINE' : 'AIRPLANE MODE'}</Text>
          </View>
          {pendingCount > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{pendingCount} queued</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Assigned Work Orders ({assignedJobs.length})</Text>

        {assignedJobs.map((job) => {
          const distance = currentCoords
            ? GeofenceService.calculateDistanceMeters(currentCoords, {
                latitude: job.latitude,
                longitude: job.longitude
              })
            : null;

          const formattedPayout = (job.budgetAmountMinor / 100).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
          });

          return (
            <TouchableOpacity
              key={job.id}
              style={styles.card}
              onPress={() => handleJobPress(job)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.jobCategory}>{job.category}</Text>
                <View style={[styles.statusPill, getStatusStyle(job.status)]}>
                  <Text style={styles.statusPillText}>{job.status}</Text>
                </View>
              </View>

              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobDescription} numberOfLines={2}>
                {job.description}
              </Text>

              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.footerLabel}>Payout</Text>
                  <Text style={styles.payoutText}>{formattedPayout}</Text>
                </View>
                <View style={styles.rightFooter}>
                  <Text style={styles.footerLabel}>Distance</Text>
                  <Text style={styles.distanceText}>
                    {distance !== null ? `${distance.toFixed(0)}m` : 'Locating...'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionPrompt}>
                <Text style={styles.actionPromptText}>Tap to Open Active Gig →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

function getStatusStyle(status: string) {
  switch (status) {
    case 'ON_SITE':
      return { backgroundColor: '#16a34a' };
    case 'EN_ROUTE':
      return { backgroundColor: '#d97706' };
    case 'COMPLETED':
      return { backgroundColor: '#0284c7' };
    default:
      return { backgroundColor: '#475569' };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b'
  },
  headerTitle: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: 4
  },
  networkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  badgeOnline: {
    backgroundColor: '#065f46'
  },
  badgeOffline: {
    backgroundColor: '#991b1b'
  },
  networkBadgeText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: 'bold'
  },
  pendingBadge: {
    backgroundColor: '#b45309',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  pendingBadgeText: {
    color: '#fef3c7',
    fontSize: 9,
    fontWeight: 'bold'
  },
  container: {
    flex: 1
  },
  contentContainer: {
    padding: 20
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  jobCategory: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  statusPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  jobTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6
  },
  jobDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155'
  },
  footerLabel: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase'
  },
  payoutText: {
    color: '#34d399',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2
  },
  rightFooter: {
    alignItems: 'flex-end'
  },
  distanceText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2
  },
  actionPrompt: {
    marginTop: 12,
    alignItems: 'center'
  },
  actionPromptText: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '600'
  }
});
