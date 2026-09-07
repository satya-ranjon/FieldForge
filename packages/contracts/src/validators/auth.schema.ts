import { z } from 'zod';
import { UserRole } from '../enums';
import { positiveMinorUnitsSchema } from './money.schema';

export const registerUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  role: z.enum(UserRole),
  phoneNumber: z.string().min(8).max(30),
  companyName: z.string().optional(),
  billingAddress: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  hourlyRateMinor: positiveMinorUnitsSchema.optional()
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1)
});

export const createCertificationSchema = z.object({
  name: z.string().min(2).max(100),
  issuedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
});

export const verifyCertificationSchema = z.object({
  isVerified: z.boolean(),
  verificationNotes: z.string().optional()
});

export const sendPhoneOtpSchema = z.object({
  phoneNumber: z.string().min(8).max(30)
});

export const verifyPhoneOtpSchema = z.object({
  phoneNumber: z.string().min(8).max(30),
  code: z.string().min(4).max(8)
});

export const batchTechniciansSchema = z.object({
  ids: z.array(z.string().min(1).max(64))
});
