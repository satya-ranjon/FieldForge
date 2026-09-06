import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { WorkOrderResponseDto } from '@fieldforge/contracts';
import { WorkOrderStatus, PriorityLevel } from '@fieldforge/contracts';

export interface DeliverableItem {
  id: string;
  type: 'PHOTO_BEFORE' | 'PHOTO_AFTER' | 'CHECKLIST' | 'SIGNATURE';
  title: string;
  url?: string;
  signatureHash?: string;
  signerName?: string;
  submittedAt?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface ExtendedWorkOrder extends WorkOrderResponseDto {
  priority: PriorityLevel;
  requiredCertifications: string[];
  geofenceRadiusMeters: number;
  geofenceCheckInDistanceMeters?: number;
  geofenceVerified?: boolean;
  assignedTechnicianName?: string;
  assignedTechnicianRating?: number;
  assignedTechnicianPhone?: string;
  deliverables?: DeliverableItem[];
  slaWarningHours?: number;
  scopeOfWorkSteps?: string[];
  disputeReason?: string;
}

export interface WorkOrderFilterState {
  status: string;
  category: string;
  priority: string;
  searchQuery: string;
}

export interface WorkOrderState {
  items: ExtendedWorkOrder[];
  selectedId: string | null;
  filters: WorkOrderFilterState;
  isLoading: boolean;
}

const initialState: WorkOrderState = {
  items: [],
  selectedId: null,
  filters: {
    status: 'ALL',
    category: 'ALL',
    priority: 'ALL',
    searchQuery: ''
  },
  isLoading: false
};

export const workOrderSlice = createSlice({
  name: 'workOrders',
  initialState,
  reducers: {
    setWorkOrders: (state, action: PayloadAction<ExtendedWorkOrder[]>) => {
      state.items = action.payload;
    },
    selectWorkOrder: (state, action: PayloadAction<string | null>) => {
      state.selectedId = action.payload;
    },
    addWorkOrder: (state, action: PayloadAction<ExtendedWorkOrder>) => {
      state.items.unshift(action.payload);
      state.selectedId = action.payload.id;
    },
    updateWorkOrderStatus: (
      state,
      action: PayloadAction<{ id: string; status: WorkOrderStatus }>
    ) => {
      const item = state.items.find((wo) => wo.id === action.payload.id);
      if (item) {
        item.status = action.payload.status;
        item.updatedAt = new Date().toISOString();
      }
    },
    assignTechnician: (
      state,
      action: PayloadAction<{
        workOrderId: string;
        techId: string;
        techName: string;
        techRating: number;
        techPhone: string;
      }>
    ) => {
      const item = state.items.find((wo) => wo.id === action.payload.workOrderId);
      if (item) {
        item.assignedTechnicianId = action.payload.techId;
        item.assignedTechnicianName = action.payload.techName;
        item.assignedTechnicianRating = action.payload.techRating;
        item.assignedTechnicianPhone = action.payload.techPhone;
        item.status = WorkOrderStatus.ASSIGNED;
        item.updatedAt = new Date().toISOString();
      }
    },
    approveDeliverables: (state, action: PayloadAction<{ workOrderId: string }>) => {
      const item = state.items.find((wo) => wo.id === action.payload.workOrderId);
      if (item) {
        item.status = WorkOrderStatus.APPROVED;
        item.updatedAt = new Date().toISOString();
      }
    },
    disputeWorkOrder: (state, action: PayloadAction<{ workOrderId: string; reason: string }>) => {
      const item = state.items.find((wo) => wo.id === action.payload.workOrderId);
      if (item) {
        item.status = WorkOrderStatus.DISPUTED;
        item.disputeReason = action.payload.reason;
        item.updatedAt = new Date().toISOString();
      }
    },
    setStatusFilter: (state, action: PayloadAction<string>) => {
      state.filters.status = action.payload;
    },
    setCategoryFilter: (state, action: PayloadAction<string>) => {
      state.filters.category = action.payload;
    },
    setPriorityFilter: (state, action: PayloadAction<string>) => {
      state.filters.priority = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.filters.searchQuery = action.payload;
    }
  }
});

export const {
  setWorkOrders,
  selectWorkOrder,
  addWorkOrder,
  updateWorkOrderStatus,
  assignTechnician,
  approveDeliverables,
  disputeWorkOrder,
  setStatusFilter,
  setCategoryFilter,
  setPriorityFilter,
  setSearchQuery
} = workOrderSlice.actions;

export default workOrderSlice.reducer;
