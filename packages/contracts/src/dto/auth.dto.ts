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

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthJwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  profileId?: string;
  iat?: number;
  exp?: number;
}

export interface BatchTechniciansDto {
  ids: string[];
}

export interface TechnicianSummaryDto {
  id: string;
  firstName: string;
  lastName: string;
  ratingAverage: string;
  jobsCompleted: number;
  hourlyRate: string;
  userStatus: string;
  badges: string[];
  certifications?: string[];
}

export interface TechnicianBadgeDto {
  badgeId: string;
  technicianId?: string;
  name: string;
  issuedDate: string;
  expiryDate: string;
  isVerified: boolean;
}

export interface CreateCertificationDto {
  name: string;
  issuedDate: string;
  expiryDate: string;
}

export interface VerifyCertificationDto {
  isVerified: boolean;
  verificationNotes?: string;
}

export interface SendPhoneOtpDto {
  phoneNumber: string;
}

export interface VerifyPhoneOtpDto {
  phoneNumber: string;
  code: string;
}

export interface PhoneOtpResponseDto {
  success: boolean;
  message: string;
  expiresInSeconds?: number;
}
