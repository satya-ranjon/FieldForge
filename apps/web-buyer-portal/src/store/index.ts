import { configureStore } from '@reduxjs/toolkit';
import authReducer, { type AuthState } from './slices/authSlice';
import workOrderReducer, {
  type WorkOrderState,
  type ExtendedWorkOrder
} from './slices/workOrderSlice';
import dispatchReducer, { type DispatchState, type ExtendedBid } from './slices/dispatchSlice';
import billingReducer, { type BillingState, type EscrowTransaction } from './slices/billingSlice';

export type {
  AuthState,
  WorkOrderState,
  ExtendedWorkOrder,
  DispatchState,
  ExtendedBid,
  BillingState,
  EscrowTransaction
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workOrders: workOrderReducer,
    dispatch: dispatchReducer,
    billing: billingReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
