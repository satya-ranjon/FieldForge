import { z } from 'zod';
import { WorkOrderStatus, BudgetType } from '../enums';

export const createWorkOrderSchema = z.object({
  buyerId: z.string().uuid(),
  title: z.string().min(5).max(255),
  description: z.string().min(10),
  category: z.string().min(2).max(100),
  budgetType: z.nativeEnum(BudgetType),
  budgetAmount: z.number().positive(),
  addressLine: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  scheduledStartTime: z.string().datetime(),
  scheduledEndTime: z.string().datetime(),
  slaExpirationTime: z.string().datetime()
});

export const createDeliverableSchema = z.object({
  workOrderId: z.string().uuid(),
  deliverableType: z.enum(['PHOTO_BEFORE', 'PHOTO_AFTER', 'CHECKLIST', 'SIGNATURE']),
  s3Url: z.string().url(),
  signatureHash: z.string().optional()
});
