import { z } from 'zod';
import { BudgetType, DeliverableType, WorkOrderStatus } from '../enums';
import { positiveMinorUnitsSchema } from './money.schema';

/**
 * Work order creation. `buyerId` is deliberately absent — the owning buyer is
 * derived from the verified access token, so a caller cannot bill another
 * account. Zod strips unknown keys, so a client that sends one is ignored
 * rather than obeyed.
 */
export const createWorkOrderSchema = z
  .object({
    title: z.string().trim().min(5).max(255),
    description: z.string().trim().min(10),
    category: z.string().trim().min(2).max(100),
    budgetType: z.enum(BudgetType),
    budgetAmountMinor: positiveMinorUnitsSchema,
    addressLine: z.string().trim().min(5),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    scheduledStartTime: z.iso.datetime(),
    scheduledEndTime: z.iso.datetime(),
    slaExpirationTime: z.iso.datetime()
  })
  .refine(
    (input) =>
      new Date(input.scheduledEndTime).getTime() > new Date(input.scheduledStartTime).getTime(),
    {
      message: 'scheduledEndTime must be after scheduledStartTime',
      path: ['scheduledEndTime']
    }
  )
  .refine(
    (input) =>
      new Date(input.slaExpirationTime).getTime() >= new Date(input.scheduledStartTime).getTime(),
    {
      message: 'slaExpirationTime must not be before scheduledStartTime',
      path: ['slaExpirationTime']
    }
  );

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
    reason: z.string().trim().max(500).optional(),
    assignedTechnicianId: z.string().uuid().optional()
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
  workOrderId: z.string().uuid(),
  deliverableType: z.enum(DeliverableType),
  s3Url: z.string().url(),
  signatureHash: z.string().optional()
});

export const listWorkOrdersQuerySchema = z
  .object({
    status: z.enum(WorkOrderStatus).optional(),
    buyerId: z.string().uuid().optional(),
    assignedTechnicianId: z.string().uuid().optional(),
    scheduledStartTimeFrom: z.iso.datetime().optional(),
    scheduledStartTimeTo: z.iso.datetime().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    offset: z.coerce.number().min(0).default(0)
  })
  .refine(
    (input) => {
      if (input.scheduledStartTimeFrom && input.scheduledStartTimeTo) {
        return (
          new Date(input.scheduledStartTimeTo).getTime() >=
          new Date(input.scheduledStartTimeFrom).getTime()
        );
      }
      return true;
    },
    {
      message: 'scheduledStartTimeTo must be greater than or equal to scheduledStartTimeFrom',
      path: ['scheduledStartTimeTo']
    }
  );

export const generatePresignedUrlSchema = z.object({
  deliverableType: z.enum(DeliverableType),
  filename: z.string().trim().min(1).max(255)
});

export const recordSignatureSchema = z.object({
  signatureSvg: z.string().trim().min(10),
  clientName: z.string().trim().min(2).max(255)
});
