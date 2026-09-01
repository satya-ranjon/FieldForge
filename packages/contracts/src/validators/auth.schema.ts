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
