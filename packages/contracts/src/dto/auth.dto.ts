import type { UserRole, UserStatus } from '../enums';
import type { MinorUnits } from '../money';

export interface RegisterUserDto {
  email: string;
  password: string;
  role: UserRole;
  phoneNumber: string;
  companyName?: string; // If BUYER
  billingAddress?: string;
  firstName?: string; // If TECHNICIAN
  lastName?: string;
  hourlyRateMinor?: MinorUnits;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
}
