import { z } from 'zod';
import { UserRole } from '../enums';

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  phoneNumber: z.string().min(8).max(30),
  companyName: z.string().optional(),
  billingAddress: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  hourlyRate: z.number().positive().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
