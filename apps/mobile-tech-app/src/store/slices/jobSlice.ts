import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkOrderStatus } from '@fieldforge/contracts';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface WorkOrderJob {
  id: string;
  title: string;
  description: string;
  category: string;
  status: WorkOrderStatus;
  budgetAmountMinor: number;
  addressLine: string;
  latitude: number;
  longitude: number;
  scheduledStartTime: string;
  scheduledEndTime: string;
  slaExpirationTime: string;
}

export type DeliverableUploadStatus = 'PENDING' | 'UPLOADING' | 'UPLOADED' | 'FAILED';

export interface MediaDeliverableState {
  localUri?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  status: DeliverableUploadStatus;
  deliverableId?: string;
  mediaUrl?: string;
  objectKey?: string;
  error?: string;
}

export interface DeliverablesState {
  checklist: ChecklistItem[];
  serialNumber: string;
  photoBefore: MediaDeliverableState | null;
  photoAfter: MediaDeliverableState | null;
  photoBeforeUrl: string | null;
  photoAfterUrl: string | null;
  clientSignature: {
    clientName: string;
    signatureSvg: string;
    signatureHash: string;
    signedAt: string;
  } | null;
}

export interface JobState {
  activeJob: WorkOrderJob | null;
  assignedJobs: WorkOrderJob[];
  deliverables: DeliverablesState;
  currentCoordinates: {
    latitude: number;
    longitude: number;
  } | null;
}

const initialJob: WorkOrderJob = {
  id: 'wo-8910-pos-swap',
  title: 'Active Gig #WO-8910: Emergency POS Terminal Swap',
  description:
    'Replace faulty Verifone POS terminal and verify chip reader connectivity at Store #402.',
  category: 'RETAIL_HARDWARE',
  status: WorkOrderStatus.ASSIGNED,
  budgetAmountMinor: 35000,
  addressLine: '850 Market Street, San Francisco, CA 94102',
  latitude: 37.7749,
  longitude: -122.4194,
  scheduledStartTime: new Date(Date.now() + 3600000).toISOString(),
  scheduledEndTime: new Date(Date.now() + 10800000).toISOString(),
  slaExpirationTime: new Date(Date.now() + 14400000).toISOString()
};

const secondaryJob: WorkOrderJob = {
  id: 'wo-8911-cctv-repair',
  title: 'Gig #WO-8911: Axis CCTV Dome Camera Calibration',
  description: 'Recalibrate ceiling PTZ camera angle and replace PoE injector.',
  category: 'SECURITY_SURVEILLANCE',
  status: WorkOrderStatus.ASSIGNED,
  budgetAmountMinor: 45000,
  addressLine: '1200 Folsom Street, San Francisco, CA 94103',
  latitude: 37.7765,
  longitude: -122.4123,
  scheduledStartTime: new Date(Date.now() + 18000000).toISOString(),
  scheduledEndTime: new Date(Date.now() + 25200000).toISOString(),
  slaExpirationTime: new Date(Date.now() + 28800000).toISOString()
};

const initialState: JobState = {
  activeJob: initialJob,
  assignedJobs: [initialJob, secondaryJob],
  deliverables: {
    checklist: [
      { id: 'chk-1', title: 'Site check-in and merchant manager contact', completed: false },
      { id: 'chk-2', title: 'Disconnect power and unseat damaged hardware', completed: false },
      {
        id: 'chk-3',
        title: 'Install replacement terminal and verify ethernet link',
        completed: false
      },
      {
        id: 'chk-4',
        title: 'Run EMV chip reader and NFC contact test transactions',
        completed: false
      }
    ],
    serialNumber: '',
    photoBefore: null,
    photoAfter: null,
    photoBeforeUrl: null,
    photoAfterUrl: null,
    clientSignature: null
  },
  currentCoordinates: {
    latitude: 37.7751,
    longitude: -122.4193 // ~25m away from job site (well within 200m)
  }
};

export const jobSlice = createSlice({
  name: 'job',
  initialState,
  reducers: {
    setActiveJob: (state, action: PayloadAction<WorkOrderJob>) => {
      state.activeJob = action.payload;
    },
    updateJobStatus: (state, action: PayloadAction<WorkOrderStatus>) => {
      if (state.activeJob) {
        state.activeJob.status = action.payload;
      }
    },
    updateCoordinates: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      state.currentCoordinates = action.payload;
    },
    toggleChecklistItem: (state, action: PayloadAction<string>) => {
      const item = state.deliverables.checklist.find((c) => c.id === action.payload);
      if (item) {
        item.completed = !item.completed;
      }
    },
    setSerialNumber: (state, action: PayloadAction<string>) => {
      state.deliverables.serialNumber = action.payload;
    },
    setMediaPending: (
      state,
      action: PayloadAction<{
        type: 'BEFORE' | 'AFTER';
        file: {
          localUri: string;
          filename: string;
          mimeType: string;
          sizeBytes: number;
        };
      }>
    ) => {
      const mediaItem: MediaDeliverableState = {
        localUri: action.payload.file.localUri,
        filename: action.payload.file.filename,
        mimeType: action.payload.file.mimeType,
        sizeBytes: action.payload.file.sizeBytes,
        status: 'PENDING'
      };
      if (action.payload.type === 'BEFORE') {
        state.deliverables.photoBefore = mediaItem;
        state.deliverables.photoBeforeUrl = null;
      } else {
        state.deliverables.photoAfter = mediaItem;
        state.deliverables.photoAfterUrl = null;
      }
    },
    setMediaUploading: (
      state,
      action: PayloadAction<{
        type: 'BEFORE' | 'AFTER';
        file?: {
          localUri: string;
          filename: string;
          mimeType: string;
          sizeBytes: number;
        };
      }>
    ) => {
      const existing =
        action.payload.type === 'BEFORE'
          ? state.deliverables.photoBefore
          : state.deliverables.photoAfter;
      const mediaItem: MediaDeliverableState = {
        localUri: action.payload.file?.localUri || existing?.localUri,
        filename: action.payload.file?.filename || existing?.filename || 'photo.jpg',
        mimeType: action.payload.file?.mimeType || existing?.mimeType || 'image/jpeg',
        sizeBytes: action.payload.file?.sizeBytes || existing?.sizeBytes || 0,
        status: 'UPLOADING'
      };
      if (action.payload.type === 'BEFORE') {
        state.deliverables.photoBefore = mediaItem;
      } else {
        state.deliverables.photoAfter = mediaItem;
      }
    },
    setMediaUploaded: (
      state,
      action: PayloadAction<{
        type: 'BEFORE' | 'AFTER';
        deliverable: {
          id: string;
          mediaUrl: string;
          objectKey?: string | null;
        };
      }>
    ) => {
      const existing =
        action.payload.type === 'BEFORE'
          ? state.deliverables.photoBefore
          : state.deliverables.photoAfter;
      const mediaItem: MediaDeliverableState = {
        localUri: existing?.localUri,
        filename: existing?.filename || 'photo.jpg',
        mimeType: existing?.mimeType || 'image/jpeg',
        sizeBytes: existing?.sizeBytes || 0,
        status: 'UPLOADED',
        deliverableId: action.payload.deliverable.id,
        mediaUrl: action.payload.deliverable.mediaUrl,
        objectKey: action.payload.deliverable.objectKey || undefined
      };
      if (action.payload.type === 'BEFORE') {
        state.deliverables.photoBefore = mediaItem;
        state.deliverables.photoBeforeUrl = action.payload.deliverable.mediaUrl;
      } else {
        state.deliverables.photoAfter = mediaItem;
        state.deliverables.photoAfterUrl = action.payload.deliverable.mediaUrl;
      }
    },
    setMediaFailed: (
      state,
      action: PayloadAction<{
        type: 'BEFORE' | 'AFTER';
        error: string;
      }>
    ) => {
      const existing =
        action.payload.type === 'BEFORE'
          ? state.deliverables.photoBefore
          : state.deliverables.photoAfter;
      if (existing) {
        existing.status = 'FAILED';
        existing.error = action.payload.error;
      }
    },
    setPhotoBefore: (state, action: PayloadAction<string>) => {
      state.deliverables.photoBeforeUrl = action.payload;
      if (!state.deliverables.photoBefore) {
        state.deliverables.photoBefore = {
          filename: 'photo_before.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          status: 'UPLOADED',
          mediaUrl: action.payload
        };
      } else {
        state.deliverables.photoBefore.mediaUrl = action.payload;
        state.deliverables.photoBefore.status = 'UPLOADED';
      }
    },
    setPhotoAfter: (state, action: PayloadAction<string>) => {
      state.deliverables.photoAfterUrl = action.payload;
      if (!state.deliverables.photoAfter) {
        state.deliverables.photoAfter = {
          filename: 'photo_after.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: 1024,
          status: 'UPLOADED',
          mediaUrl: action.payload
        };
      } else {
        state.deliverables.photoAfter.mediaUrl = action.payload;
        state.deliverables.photoAfter.status = 'UPLOADED';
      }
    },
    setSignature: (
      state,
      action: PayloadAction<{
        clientName: string;
        signatureSvg: string;
        signatureHash: string;
      }>
    ) => {
      state.deliverables.clientSignature = {
        ...action.payload,
        signedAt: new Date().toISOString()
      };
    },
    resetDeliverables: (state) => {
      state.deliverables = initialState.deliverables;
    }
  }
});

export const {
  setActiveJob,
  updateJobStatus,
  updateCoordinates,
  toggleChecklistItem,
  setSerialNumber,
  setMediaPending,
  setMediaUploading,
  setMediaUploaded,
  setMediaFailed,
  setPhotoBefore,
  setPhotoAfter,
  setSignature,
  resetDeliverables
} = jobSlice.actions;

export default jobSlice.reducer;
