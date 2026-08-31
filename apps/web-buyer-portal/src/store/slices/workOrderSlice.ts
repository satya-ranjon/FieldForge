import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WorkOrderResponseDto, WorkOrderStatus, PriorityLevel } from '@fieldforge/contracts';

interface WorkOrderState {
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
      status: WorkOrderStatus.PUBLISHED,
      priority: PriorityLevel.URGENT,
      maxBudget: 450,
      latitude: 37.7749,
      longitude: -122.4194,
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
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
