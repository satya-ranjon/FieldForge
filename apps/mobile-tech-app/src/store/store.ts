import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobReducer from './slices/jobSlice';
import syncReducer from './slices/syncSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    job: jobReducer,
    sync: syncReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
