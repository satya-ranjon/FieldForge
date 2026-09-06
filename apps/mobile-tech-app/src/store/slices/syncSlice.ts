import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;
}

const initialState: SyncState = {
  isOnline: true,
  pendingCount: 0,
  lastSyncedAt: null,
  isSyncing: false
};

export const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    toggleOnlineStatus: (state) => {
      state.isOnline = !state.isOnline;
    },
    setPendingCount: (state, action: PayloadAction<number>) => {
      state.pendingCount = action.payload;
    },
    setIsSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    syncCompleted: (state) => {
      state.isSyncing = false;
      state.lastSyncedAt = new Date().toISOString();
    }
  }
});

export const { setOnlineStatus, toggleOnlineStatus, setPendingCount, setIsSyncing, syncCompleted } =
  syncSlice.actions;

export default syncSlice.reducer;
