import { configureStore } from '@reduxjs/toolkit';
import authReducer, { type AuthState } from './slices/authSlice';
import workOrderReducer, { type WorkOrderState } from './slices/workOrderSlice';

export type { AuthState, WorkOrderState };

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workOrders: workOrderReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
