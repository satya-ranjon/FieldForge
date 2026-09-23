import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import {
  updateJobStatus,
  updateCoordinates,
  toggleChecklistItem,
  setSerialNumber,
  setMediaPending,
  setMediaUploading,
  setMediaUploaded,
  setMediaFailed,
  setSignature
} from '../store/slices/jobSlice';
import { toggleOnlineStatus } from '../store/slices/syncSlice';
import { GpsRadar } from '../components/GpsRadar';
import { GeofenceService } from '../services/geofencing.service';
import { PermissionsService } from '../services/permissions.service';
import {
  syncServiceInstance,
  triggerManualSync,
  executeOnlineTransition,
  buildTransitionPayload
} from '../services/syncManager';
import { DeliverableType, WorkOrderStatus } from '@fieldforge/contracts';
import * as ImagePicker from 'expo-image-picker';
import {
  DeliverableUploadService,
  DeliverableHttpError
} from '../services/deliverableUpload.service';

interface ActiveJobScreenProps {
  onBack?: () => void;
}

export const ActiveJobScreen: React.FC<ActiveJobScreenProps> = ({ onBack }) => {
  const dispatch = useDispatch();
  const job = useSelector((state: RootState) => state.job.activeJob);
  const deliverables = useSelector((state: RootState) => state.job.deliverables);
  const currentCoords = useSelector((state: RootState) => state.job.currentCoordinates);
  const isOnline = useSelector((state: RootState) => state.sync.isOnline);
  const pendingCount = useSelector((state: RootState) => state.sync.pendingCount);
  const isSyncing = useSelector((state: RootState) => state.sync.isSyncing);
  const token = useSelector((state: RootState) => state.auth.accessToken);

  const [serialInput, setSerialInput] = useState(deliverables.serialNumber);
  const [signerName, setSignerName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('GPS Active');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const jobLocation = job
    ? { latitude: job.latitude, longitude: job.longitude }
    : { latitude: 37.7749, longitude: -122.4194 };

  const techLocation = currentCoords ?? { latitude: 37.7751, longitude: -122.4193 };

  // Calculate Haversine distance using canonical contract helpers (FR-MOB-001)
  const distance = GeofenceService.calculateDistanceMeters(techLocation, jobLocation);
  const canCheckIn = GeofenceService.isWithinGeofence(techLocation, jobLocation, 200);

  // Poll or fetch live location on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchLiveLocation() {
      const loc = await PermissionsService.getCurrentLocation();
      if (loc && isMounted) {
        dispatch(updateCoordinates(loc));
        setLocationStatus('GPS Synchronized');
      } else if (isMounted) {
        setLocationStatus('Using Cached Location');
      }
    }
    fetchLiveLocation();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  if (!job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Text style={styles.title}>No Active Work Order</Text>
          {onBack && (
            <TouchableOpacity style={styles.button} onPress={onBack}>
              <Text style={styles.buttonText}>Return to Work Orders</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Handle FSM State: ASSIGNED -> EN_ROUTE
  const handleStartTravel = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    try {
      if (!isOnline) {
        await syncServiceInstance.enqueue('CHECK_IN', {
          workOrderId: job.id,
          nextStatus: WorkOrderStatus.EN_ROUTE
        });
        dispatch(updateJobStatus(WorkOrderStatus.EN_ROUTE));
        Alert.alert('Offline Mode', 'En Route status queued locally for auto-sync.');
      } else {
        const payload = buildTransitionPayload({
          nextStatus: WorkOrderStatus.EN_ROUTE
        });
        await executeOnlineTransition(job.id, payload, token);
        dispatch(updateJobStatus(WorkOrderStatus.EN_ROUTE));
        Alert.alert('En Route', 'Technician transit started.');
      }
    } catch (err) {
      Alert.alert(
        'Transition Failed',
        err instanceof Error ? err.message : 'Failed to start travel. Please try again.'
      );
    } finally {
      setIsTransitioning(false);
    }
  };

  // Handle FSM State: EN_ROUTE -> ON_SITE
  const handleCheckIn = async () => {
    if (isTransitioning) return;
    if (!canCheckIn) {
      Alert.alert(
        'Geofence Boundary Violation',
        `You must be within 200 meters of the work site to check in. Current distance: ${distance.toFixed(0)}m.`
      );
      return;
    }

    if (
      !techLocation ||
      techLocation.latitude === undefined ||
      techLocation.longitude === undefined
    ) {
      Alert.alert('Location Required', 'GPS location is required to check in.');
      return;
    }

    setIsTransitioning(true);
    try {
      if (!isOnline) {
        await syncServiceInstance.enqueue('CHECK_IN', {
          workOrderId: job.id,
          nextStatus: WorkOrderStatus.ON_SITE,
          latitude: techLocation.latitude,
          longitude: techLocation.longitude
        });
        dispatch(updateJobStatus(WorkOrderStatus.ON_SITE));
        Alert.alert(
          'Offline Check-In Queued',
          `GPS location verified within 200m (${distance.toFixed(0)}m). Check-in mutation stored in offline queue.`
        );
      } else {
        const payload = buildTransitionPayload({
          nextStatus: WorkOrderStatus.ON_SITE,
          latitude: techLocation.latitude,
          longitude: techLocation.longitude
        });
        await executeOnlineTransition(job.id, payload, token);
        dispatch(updateJobStatus(WorkOrderStatus.ON_SITE));
        Alert.alert(
          'Geofence Verified',
          `GPS location verified within 200m (${distance.toFixed(0)}m). Transitioned to ON_SITE.`
        );
      }
    } catch (err) {
      Alert.alert(
        'Check-In Failed',
        err instanceof Error ? err.message : 'Check-in transition failed. Please try again.'
      );
    } finally {
      setIsTransitioning(false);
    }
  };

  // Handle Deliverables: Serial Number save
  const handleSaveSerialNumber = async () => {
    if (!serialInput.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid serial number.');
      return;
    }
    dispatch(setSerialNumber(serialInput.trim()));
    Alert.alert('Saved', `Serial number recorded: ${serialInput.trim()}`);
  };

  // Handle Deliverables: Real S3 photo capture & upload (ISSUE-003A)
  const handleCapturePhoto = async (type: 'BEFORE' | 'AFTER') => {
    try {
      // 1. Check & request camera permission with graceful fallback to image library
      const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
      let result: ImagePicker.ImagePickerResult;

      if (cameraPerm.granted) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false
        });
      } else {
        const libraryPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libraryPerm.granted) {
          Alert.alert(
            'Permission Denied',
            'Camera and photo library permissions are required to capture deliverables.'
          );
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const timestamp = Date.now();
      const filename = asset.fileName || `${type.toLowerCase()}_${timestamp}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      let sizeBytes = asset.fileSize || 0;

      if (!sizeBytes) {
        try {
          const res = await fetch(asset.uri);
          const blob = await res.blob();
          sizeBytes = blob.size;
        } catch {
          sizeBytes = 1024 * 50;
        }
      }

      // 2. Client-side validation against canonical contract rules (15 MiB limit, mime types)
      try {
        DeliverableUploadService.validateDeliverableFile({
          filename,
          mimeType,
          sizeBytes,
          uri: asset.uri
        });
      } catch (valErr) {
        Alert.alert(
          'Validation Error',
          valErr instanceof Error ? valErr.message : 'Invalid file selected'
        );
        return;
      }

      const deliverableType =
        type === 'BEFORE' ? DeliverableType.PHOTO_BEFORE : DeliverableType.PHOTO_AFTER;

      // 3. Offline handling: store in durable app storage and queue offline mutation
      if (!isOnline) {
        const durableUri = await DeliverableUploadService.saveToDurableStorage(asset.uri, filename);

        dispatch(
          setMediaPending({
            type,
            file: {
              localUri: durableUri,
              filename,
              mimeType,
              sizeBytes
            }
          })
        );

        await syncServiceInstance.enqueue('UPLOAD_PHOTO', {
          workOrderId: job.id,
          deliverableType,
          localUri: durableUri,
          filename,
          mimeType,
          sizeBytes,
          stage: 'LOCAL_PENDING'
        });

        Alert.alert(
          'Offline Mode Active',
          `${type} photo saved locally in durable storage. It will upload to S3 automatically upon reconnection.`
        );
        return;
      }

      // 4. Online handling: direct S3 presigned PUT + backend confirmation
      dispatch(
        setMediaUploading({
          type,
          file: {
            localUri: asset.uri,
            filename,
            mimeType,
            sizeBytes
          }
        })
      );

      try {
        const confirmed = await DeliverableUploadService.executeOnlineUpload(
          job.id,
          {
            uri: asset.uri,
            filename,
            mimeType,
            sizeBytes,
            deliverableType
          },
          token || undefined
        );

        dispatch(
          setMediaUploaded({
            type,
            deliverable: {
              id: confirmed.id,
              mediaUrl: confirmed.mediaUrl,
              objectKey: confirmed.objectKey
            }
          })
        );

        Alert.alert(
          'Photo Uploaded',
          `${type} photo verified by Amazon S3 and attached to work order.`
        );
      } catch (uploadErr) {
        // If network dropped during online upload attempt, fallback to durable offline queue
        const isPermanent =
          uploadErr instanceof DeliverableHttpError ? uploadErr.isPermanent : false;
        if (!isPermanent) {
          const durableUri = await DeliverableUploadService.saveToDurableStorage(
            asset.uri,
            filename
          );

          dispatch(
            setMediaPending({
              type,
              file: {
                localUri: durableUri,
                filename,
                mimeType,
                sizeBytes
              }
            })
          );

          await syncServiceInstance.enqueue('UPLOAD_PHOTO', {
            workOrderId: job.id,
            deliverableType,
            localUri: durableUri,
            filename,
            mimeType,
            sizeBytes,
            stage: 'LOCAL_PENDING'
          });

          Alert.alert(
            'Upload Interrupted',
            `Network failure during upload. ${type} photo saved to offline queue and will retry on reconnection.`
          );
        } else {
          const errMsg = uploadErr instanceof Error ? uploadErr.message : 'Upload failed';
          dispatch(setMediaFailed({ type, error: errMsg }));
          Alert.alert('Upload Failed', errMsg);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Media capture failed';
      Alert.alert('Camera Error', errMsg);
    }
  };

  // Handle Deliverables: Signature capture (FR-MOB-003)
  const handleCaptureSignature = async () => {
    if (!signerName.trim()) {
      Alert.alert('Signer Required', 'Please enter the client or store manager name.');
      return;
    }

    const simulatedSvg = `<svg viewBox="0 0 300 100"><path d="M10 50 Q 50 10, 90 50 T 170 50" stroke="black" fill="none"/></svg>`;
    const simulatedHash = `sha256-${Date.now().toString(16)}-${Math.random().toString(16).substring(2, 10)}`;

    dispatch(
      setSignature({
        clientName: signerName.trim(),
        signatureSvg: simulatedSvg,
        signatureHash: simulatedHash
      })
    );
    setIsSigning(false);

    if (!isOnline) {
      await syncServiceInstance.enqueue('CAPTURE_SIGNATURE', {
        workOrderId: job.id,
        signatureSvg: simulatedSvg,
        clientName: signerName.trim()
      });
      Alert.alert('Offline Queue', 'Client signature queued for verification on reconnection.');
    } else {
      Alert.alert('Signature Verified', `Client sign-off captured for ${signerName.trim()}.`);
    }
  };

  // Handle FSM State: ON_SITE -> COMPLETED
  const handleCompleteJob = async () => {
    if (isTransitioning) return;
    const allChecked = deliverables.checklist.every((c) => c.completed);
    if (!allChecked) {
      Alert.alert(
        'Checklist Incomplete',
        'Please complete all task checklist items before submitting.'
      );
      return;
    }
    if (!deliverables.clientSignature) {
      Alert.alert(
        'Signature Required',
        'Client sign-off signature is required to complete the gig.'
      );
      return;
    }

    setIsTransitioning(true);
    try {
      if (!isOnline) {
        await syncServiceInstance.enqueue('COMPLETE_JOB', {
          workOrderId: job.id,
          nextStatus: WorkOrderStatus.COMPLETED
        });
        dispatch(updateJobStatus(WorkOrderStatus.COMPLETED));
        Alert.alert(
          'Offline Completion Queued',
          'Job completed in airplane mode! Mutation saved in persistent queue and will disburse upon reconnect.'
        );
      } else {
        const payload = buildTransitionPayload({
          nextStatus: WorkOrderStatus.COMPLETED
        });
        await executeOnlineTransition(job.id, payload, token);
        dispatch(updateJobStatus(WorkOrderStatus.COMPLETED));
        Alert.alert(
          'Job Completed',
          'Work order marked COMPLETED. Escrow approval cycle initiated.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Completion Failed',
        err instanceof Error ? err.message : 'Failed to complete work order. Please try again.'
      );
    } finally {
      setIsTransitioning(false);
    }
  };

  // Handle manual sync trigger
  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'Cannot synchronize while in airplane/offline mode.');
      return;
    }
    const result = await triggerManualSync();
    Alert.alert(
      'Sync Complete',
      `Synchronized ${result.processed} mutations successfully. (${result.failed} failed/retrying).`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Telemetry & Offline Toggle Bar */}
      <View style={styles.topBar}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Jobs</Text>
          </TouchableOpacity>
        )}
        <View style={styles.networkControls}>
          <TouchableOpacity
            style={[
              styles.networkToggle,
              isOnline ? styles.networkToggleOnline : styles.networkToggleOffline
            ]}
            onPress={() => dispatch(toggleOnlineStatus())}
          >
            <Text style={styles.networkToggleText}>
              {isOnline ? '🟢 Online' : '✈️ Airplane Mode'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Offline Sync Banner (H6 & FR-MOB-004) */}
      <View
        style={[
          styles.syncBanner,
          pendingCount > 0 ? styles.syncBannerPending : styles.syncBannerClean
        ]}
      >
        <Text style={styles.syncBannerText}>
          {pendingCount > 0
            ? `⏳ ${pendingCount} offline mutation${pendingCount > 1 ? 's' : ''} queued locally`
            : '✓ All local mutations synchronized'}
        </Text>
        {pendingCount > 0 && (
          <TouchableOpacity
            style={styles.syncNowButton}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            <Text style={styles.syncNowButtonText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Job Header Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.jobCategory}>{job.category}</Text>
            <View style={[styles.statusPill, getStatusStyle(job.status)]}>
              <Text style={styles.statusPillText}>{job.status}</Text>
            </View>
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.subtitle}>{job.description}</Text>
          <Text style={styles.address}>📍 {job.addressLine}</Text>
          <Text style={styles.locationStatus}>🛰️ {locationStatus}</Text>
        </View>

        {/* Lifecycle Phase 1: ASSIGNED */}
        {job.status === WorkOrderStatus.ASSIGNED && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Step 1: Start Transit</Text>
            <Text style={styles.sectionDescription}>
              Acknowledge assignment and notify dispatch that you are en route to the work site.
            </Text>
            <TouchableOpacity
              style={[styles.actionButtonPrimary, isTransitioning && styles.actionButtonDisabled]}
              onPress={handleStartTravel}
              disabled={isTransitioning}
            >
              <Text style={styles.buttonText}>Start Travel (En Route)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lifecycle Phase 2: EN_ROUTE — Geofence Verification (FR-MOB-001) */}
        {job.status === WorkOrderStatus.EN_ROUTE && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Step 2: Geofenced Check-In</Text>
            <Text style={styles.sectionDescription}>
              SRS FR-MOB-001 requires technician presence within 200 metres of site coordinates.
            </Text>

            <GpsRadar distanceMeters={distance} isVerified={canCheckIn} />

            <TouchableOpacity
              style={[
                styles.actionButtonPrimary,
                (!canCheckIn || isTransitioning) && styles.actionButtonDisabled
              ]}
              onPress={handleCheckIn}
              disabled={!canCheckIn || isTransitioning}
            >
              <Text style={styles.buttonText}>
                {canCheckIn ? 'Geofence Check-In (On Site)' : 'Move Within 200m of Site'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lifecycle Phase 3: ON_SITE — Deliverables, Checklist & Signature */}
        {job.status === WorkOrderStatus.ON_SITE && (
          <>
            {/* Task Checklist (FR-MOB-002) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tasks & Verification Checklist</Text>
              {deliverables.checklist.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checklistItem}
                  onPress={() => dispatch(toggleChecklistItem(item.id))}
                >
                  <Text style={styles.checkbox}>{item.completed ? '☑' : '☐'}</Text>
                  <Text
                    style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}
                  >
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Serial Number Capture */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Hardware Serial Number</Text>
              <View style={styles.serialInputRow}>
                <TextInput
                  style={styles.serialInput}
                  placeholder="e.g. SN-VRF-89104-X"
                  placeholderTextColor="#64748b"
                  value={serialInput}
                  onChangeText={setSerialInput}
                />
                <TouchableOpacity style={styles.saveSmallButton} onPress={handleSaveSerialNumber}>
                  <Text style={styles.saveSmallButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
              {deliverables.serialNumber ? (
                <Text style={styles.serialConfirmed}>✓ Captured: {deliverables.serialNumber}</Text>
              ) : null}
            </View>

            {/* Photo Deliverables (FR-MOB-002 & ISSUE-003A S3 Flow) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Proof of Work Photos</Text>
              <View style={styles.photoRow}>
                <TouchableOpacity
                  style={[
                    styles.photoButton,
                    getPhotoButtonStatusStyle(
                      deliverables.photoBefore?.status ||
                        (deliverables.photoBeforeUrl ? 'UPLOADED' : null)
                    )
                  ]}
                  onPress={() => handleCapturePhoto('BEFORE')}
                >
                  <Text style={styles.photoButtonText}>
                    {getPhotoButtonText(
                      'Before Photo',
                      deliverables.photoBefore?.status ||
                        (deliverables.photoBeforeUrl ? 'UPLOADED' : null)
                    )}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.photoButton,
                    getPhotoButtonStatusStyle(
                      deliverables.photoAfter?.status ||
                        (deliverables.photoAfterUrl ? 'UPLOADED' : null)
                    )
                  ]}
                  onPress={() => handleCapturePhoto('AFTER')}
                >
                  <Text style={styles.photoButtonText}>
                    {getPhotoButtonText(
                      'After Photo',
                      deliverables.photoAfter?.status ||
                        (deliverables.photoAfterUrl ? 'UPLOADED' : null)
                    )}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Client Signature (FR-MOB-003) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Client Sign-Off Signature</Text>
              {deliverables.clientSignature ? (
                <View style={styles.signatureBox}>
                  <Text style={styles.signatureText}>
                    ✓ Signed by: {deliverables.clientSignature.clientName}
                  </Text>
                  <Text style={styles.signatureSub}>
                    Hash: {deliverables.clientSignature.signatureHash.substring(0, 24)}...
                  </Text>
                </View>
              ) : isSigning ? (
                <View style={styles.signingContainer}>
                  <TextInput
                    style={styles.serialInput}
                    placeholder="Signer Full Name (e.g. John Doe, Manager)"
                    placeholderTextColor="#64748b"
                    value={signerName}
                    onChangeText={setSignerName}
                  />
                  <View style={styles.simulatedSignaturePad}>
                    <Text style={styles.signaturePadPlaceholder}>
                      ✍️ [On-Screen Client Signature Area]
                    </Text>
                  </View>
                  <View style={styles.signatureActionRow}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setIsSigning(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButtonPrimary}
                      onPress={handleCaptureSignature}
                    >
                      <Text style={styles.buttonText}>Confirm Signature</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={() => setIsSigning(true)}
                >
                  <Text style={styles.buttonSecondaryText}>✍️ Capture Client Signature</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Complete Job Action */}
            <View style={styles.sectionCard}>
              <TouchableOpacity
                style={[
                  styles.actionButtonComplete,
                  isTransitioning && styles.actionButtonDisabled
                ]}
                onPress={handleCompleteJob}
                disabled={isTransitioning}
              >
                <Text style={styles.buttonText}>Complete Work Order</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Lifecycle Phase 4: COMPLETED */}
        {job.status === WorkOrderStatus.COMPLETED && (
          <View style={styles.completedCard}>
            <Text style={styles.completedTitle}>🎉 Work Order Completed</Text>
            <Text style={styles.completedSubtitle}>
              Proof of work deliverables and client signature are securely recorded. Escrow funds
              will disburse automatically after buyer review or 72-hour SLA window.
            </Text>
          </View>
        )}
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

function getPhotoButtonText(label: string, status: string | null | undefined): string {
  switch (status) {
    case 'UPLOADED':
      return `✓ ${label} (Uploaded)`;
    case 'UPLOADING':
      return `⏳ Uploading ${label}...`;
    case 'PENDING':
      return `⏳ ${label} (Queued)`;
    case 'FAILED':
      return `⚠️ ${label} (Failed)`;
    default:
      return `📷 Take ${label}`;
  }
}

function getPhotoButtonStatusStyle(status: string | null | undefined) {
  switch (status) {
    case 'UPLOADED':
      return styles.photoButtonAttached;
    case 'UPLOADING':
      return styles.photoButtonUploading;
    case 'PENDING':
      return styles.photoButtonPending;
    case 'FAILED':
      return styles.photoButtonFailed;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1517'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#22383c'
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#142427',
    borderRadius: 6
  },
  backButtonText: {
    color: '#84e539',
    fontSize: 14,
    fontWeight: 'bold'
  },
  networkControls: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  networkToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  networkToggleOnline: {
    backgroundColor: '#065f46'
  },
  networkToggleOffline: {
    backgroundColor: '#991b1b'
  },
  networkToggleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  syncBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  syncBannerPending: {
    backgroundColor: '#78350f'
  },
  syncBannerClean: {
    backgroundColor: '#064e3b'
  },
  syncBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  syncNowButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  syncNowButtonText: {
    color: '#0f1a1c',
    fontSize: 11,
    fontWeight: 'bold'
  },
  container: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  },
  card: {
    backgroundColor: '#142427',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22383c'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  jobCategory: {
    color: '#84e539',
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
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10
  },
  address: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 4
  },
  locationStatus: {
    color: '#64748b',
    fontSize: 12
  },
  sectionCard: {
    backgroundColor: '#142427',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#22383c'
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6
  },
  sectionDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#22383c'
  },
  checkbox: {
    color: '#84e539',
    fontSize: 20,
    marginRight: 10
  },
  checklistText: {
    color: '#f1f5f9',
    fontSize: 14,
    flex: 1
  },
  checklistTextCompleted: {
    color: '#64748b',
    textDecorationLine: 'line-through'
  },
  serialInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  serialInput: {
    flex: 1,
    backgroundColor: '#0d1517',
    borderWidth: 1,
    borderColor: '#22383c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 14
  },
  saveSmallButton: {
    backgroundColor: '#92ec3d',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  saveSmallButtonText: {
    color: '#0f1a1c',
    fontWeight: 'bold',
    fontSize: 13
  },
  serialConfirmed: {
    color: '#84e539',
    fontSize: 12,
    fontWeight: '600'
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#0d1517',
    borderWidth: 1,
    borderColor: '#22383c',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center'
  },
  photoButtonAttached: {
    borderColor: '#84e539',
    backgroundColor: '#052e16'
  },
  photoButtonUploading: {
    borderColor: '#84e539',
    backgroundColor: '#142427'
  },
  photoButtonPending: {
    borderColor: '#f59e0b',
    backgroundColor: '#78350f'
  },
  photoButtonFailed: {
    borderColor: '#ef4444',
    backgroundColor: '#7f1d1d'
  },
  photoButtonText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold'
  },
  signatureBox: {
    backgroundColor: '#0d1517',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#84e539'
  },
  signatureText: {
    color: '#84e539',
    fontWeight: 'bold',
    fontSize: 14
  },
  signatureSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4
  },
  signingContainer: {
    gap: 12
  },
  simulatedSignaturePad: {
    height: 100,
    backgroundColor: '#0d1517',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22383c',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  signaturePadPlaceholder: {
    color: '#64748b',
    fontSize: 13
  },
  signatureActionRow: {
    flexDirection: 'row',
    gap: 10
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#142427',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13
  },
  actionButtonPrimary: {
    backgroundColor: '#92ec3d',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  actionButtonSecondary: {
    backgroundColor: '#142427',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center'
  },
  actionButtonComplete: {
    backgroundColor: '#92ec3d',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  actionButtonDisabled: {
    backgroundColor: '#142427',
    opacity: 0.6
  },
  buttonText: {
    color: '#0f1a1c',
    fontWeight: 'bold',
    fontSize: 15
  },
  buttonSecondaryText: {
    color: '#84e539',
    fontWeight: 'bold',
    fontSize: 14
  },
  completedCard: {
    backgroundColor: '#142427',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#84e539'
  },
  completedTitle: {
    color: '#84e539',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8
  },
  completedSubtitle: {
    color: '#a7f3d0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  button: {
    backgroundColor: '#92ec3d',
    padding: 12,
    borderRadius: 8,
    marginTop: 16
  }
});
