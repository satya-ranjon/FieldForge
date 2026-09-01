import { z } from 'zod';
import { BudgetType, DeliverableType, WorkOrderStatus } from '../enums';
import { positiveMinorUnitsSchema } from './money.schema';

/**
 * Work order creation. `buyerId` is deliberately absent — the owning buyer is
 * derived from the verified access token, so a caller cannot bill another
 * account. Zod strips unknown keys, so a client that sends one is ignored
 * rather than obeyed.
 */
export const createWorkOrderSchema = z.object({
  title: z.string().min(5).max(255),
  description: z.string().min(10),
  category: z.string().min(2).max(100),
  budgetType: z.enum(BudgetType),
  budgetAmountMinor: positiveMinorUnitsSchema,
  addressLine: z.string().min(5),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  scheduledStartTime: z.iso.datetime(),
  scheduledEndTime: z.iso.datetime(),
  slaExpirationTime: z.iso.datetime()
});

/**
 * Work order state change, as consumed by `PATCH /work-orders/:id/status`.
 *
 * Coordinates are required for the arrival transition because the server — not
 * the device — decides whether the technician is inside the geofence
 * (docs/SRS.md FR-MOB-001). Requiring them here means the handler never has to
 * treat a missing position as a special case.
 */
export const transitionStatusSchema = z
  .object({
    nextStatus: z.enum(WorkOrderStatus),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    reason: z.string().max(500).optional()
  })
  .refine(
    (input) =>
      input.nextStatus !== WorkOrderStatus.ON_SITE ||
      (input.latitude !== undefined && input.longitude !== undefined),
    {
      message: 'latitude and longitude are required to transition to ON_SITE',
      path: ['latitude']
    }
  );

export const createDeliverableSchema = z.object({
  workOrderId: z.uuid(),
  deliverableType: z.enum(DeliverableType),
  s3Url: z.url(),
  signatureHash: z.string().optional()
});
