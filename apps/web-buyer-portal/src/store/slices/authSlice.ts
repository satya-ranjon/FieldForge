import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type { UserRole, UserStatus } from '@fieldforge/contracts';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole | string;
  phoneNumber?: string;
  status?: UserStatus | string;
  companyName?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const getStoredItem = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const getStoredUser = (): User | null => {
  try {
    const raw = getStoredItem('ff_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    rehydrateAuthFromStorage: (state) => {
      const storedUser = getStoredUser();
      const storedToken = getStoredItem('ff_access_token');
      const storedRefreshToken = getStoredItem('ff_refresh_token');

      if (storedToken && storedUser) {
        state.user = storedUser;
        state.token = storedToken;
        state.refreshToken = storedRefreshToken;
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      }
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;

      try {
        localStorage.removeItem('ff_logged_out');
        localStorage.setItem('ff_access_token', action.payload.accessToken);
        localStorage.setItem('ff_refresh_token', action.payload.refreshToken);
        localStorage.setItem('ff_user', JSON.stringify(action.payload.user));
      } catch {
        // Storage failure handled silently
      }
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      try {
        localStorage.setItem('ff_user', JSON.stringify(action.payload));
      } catch {
        // Storage failure handled silently
      }
    },
    setToken: (state, action: PayloadAction<{ accessToken: string; refreshToken?: string }>) => {
      state.token = action.payload.accessToken;
      try {
        localStorage.setItem('ff_access_token', action.payload.accessToken);
        if (action.payload.refreshToken) {
          state.refreshToken = action.payload.refreshToken;
          localStorage.setItem('ff_refresh_token', action.payload.refreshToken);
        }
      } catch {
        // Storage failure handled silently
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;

      try {
        localStorage.removeItem('ff_access_token');
        localStorage.removeItem('ff_refresh_token');
        localStorage.removeItem('ff_user');
        localStorage.removeItem('ff_logged_out');
      } catch {
        // Storage failure handled silently
      }
    }
  }
});

export const {
  rehydrateAuthFromStorage,
  setCredentials,
  setUser,
  setToken,
  setLoading,
  setError,
  logout
} = authSlice.actions;
export default authSlice.reducer;
