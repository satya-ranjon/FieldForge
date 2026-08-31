import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkOrderResponseDto, WorkOrderStatus, BudgetType } from '@fieldforge/contracts';

export interface WorkOrderState {
  items: WorkOrderResponseDto[];
  selectedId: string | null;
  isLoading: boolean;
}

const initialState: WorkOrderState = {
  items: [
    {
      id: 'w0000000-0000-0000-0000-000000000001',
      buyerId: 'b0000000-0000-0000-0000-000000000001',
      title: 'Emergency POS Terminal Swap & Cat6 Cabling',
      description: 'Replace 4 failed Ingenico POS pin-pads and terminate 2 Cat6 drop lines in server rack.',
      category: 'Networking & POS',
      status: WorkOrderStatus.PUBLISHED,
      budgetType: BudgetType.FIXED,
      budgetAmount: 450,
      addressLine: '789 Mission St, San Francisco, CA 94103',
      latitude: 37.7749,
      longitude: -122.4194,
      scheduledStartTime: new Date(Date.now() + 86400000).toISOString(),
      scheduledEndTime: new Date(Date.now() + 90000000).toISOString(),
      slaExpirationTime: new Date(Date.now() + 172800000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  selectedId: null,
  isLoading: false
};

export const workOrderSlice = createSlice({
  name: 'workOrders',
  initialState,
  reducers: {
    selectWorkOrder: (state, action: PayloadAction<string>) => {
      state.selectedId = action.payload;
    },
    addWorkOrder: (state, action: PayloadAction<WorkOrderResponseDto>) => {
      state.items.unshift(action.payload);
    }
  }
});

export const { selectWorkOrder, addWorkOrder } = workOrderSlice.actions;
export default workOrderSlice.reducer;
