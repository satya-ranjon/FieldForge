import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TechnicianUser {
  id: string;
  email: string;
  fullName: string;
  rating: number;
  completedJobsCount: number;
}

export interface AuthState {
  user: TechnicianUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    email: 'tech.sarah@fieldforge.dev',
    fullName: 'Sarah Jenkins',
    rating: 4.92,
    completedJobsCount: 142
  },
  accessToken: 'mock-tech-jwt-token',
  isAuthenticated: true
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: TechnicianUser; accessToken: string }>
    ) => {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
    }
  }
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
