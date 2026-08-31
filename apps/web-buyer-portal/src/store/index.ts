import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workOrderReducer from './slices/workOrderSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workOrders: workOrderReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
