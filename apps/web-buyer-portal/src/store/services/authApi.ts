import type {
  LoginDto,
  RegisterUserDto,
  AuthTokensDto,
  RefreshTokenDto,
  UserRole,
  UserStatus
} from '@fieldforge/contracts';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  phoneNumber?: string;
  status: UserStatus;
  buyerProfile?: {
    id: string;
    companyName: string;
    billingAddress?: string;
    contactName?: string;
  };
  technicianProfile?: {
    id: string;
    firstName: string;
    lastName: string;
    hourlyRateMinor: number;
    rating?: number;
  };
}

const API_BASE = '/api/v1';

export class AuthApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

export const authApi = {
  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });

    const data = await res.json();
    if (!res.ok) {
      const msg =
        typeof data?.error === 'object' && data?.error?.message
          ? data?.error?.message
          : data?.message || 'Login failed';
      throw new AuthApiError(msg, res.status, data);
    }
    return data as AuthTokensDto;
  },

  async register(dto: RegisterUserDto): Promise<AuthTokensDto> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });

    const data = await res.json();
    if (!res.ok) {
      const msg =
        typeof data?.error === 'object' && data?.error?.message
          ? data?.error?.message
          : data?.message || 'Registration failed';
      throw new AuthApiError(msg, res.status, data);
    }
    return data as AuthTokensDto;
  },

  async refreshToken(refreshToken: string): Promise<AuthTokensDto> {
    const payload: RefreshTokenDto = { refreshToken };
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      const msg =
        typeof data?.error === 'object' && data?.error?.message
          ? data?.error?.message
          : data?.message || 'Token refresh failed';
      throw new AuthApiError(msg, res.status, data);
    }
    return data as AuthTokensDto;
  },

  async getMe(accessToken: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const data = await res.json();
    if (!res.ok) {
      const msg =
        typeof data?.error === 'object' && data?.error?.message
          ? data?.error?.message
          : data?.message || 'Failed to fetch user profile';
      throw new AuthApiError(msg, res.status, data);
    }
    return data as UserProfile;
  }
};
