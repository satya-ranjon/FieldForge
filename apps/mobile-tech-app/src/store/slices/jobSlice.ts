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

export interface DeliverablesState {
  checklist: ChecklistItem[];
  serialNumber: string;
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
    setPhotoBefore: (state, action: PayloadAction<string>) => {
      state.deliverables.photoBeforeUrl = action.payload;
    },
    setPhotoAfter: (state, action: PayloadAction<string>) => {
      state.deliverables.photoAfterUrl = action.payload;
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
  setPhotoBefore,
  setPhotoAfter,
  setSignature,
  resetDeliverables
} = jobSlice.actions;

export default jobSlice.reducer;
