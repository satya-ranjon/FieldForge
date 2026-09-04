import { z } from 'zod';
import { positiveMinorUnitsSchema } from './money.schema';

/**
 * Bid submission. `techId` is deliberately absent — the bidding technician is
 * derived from the verified access token, so a caller cannot bid as someone
 * else. See createWorkOrderSchema.
 */
export const submitBidSchema = z.object({
  workOrderId: z.uuid(),
  bidAmountMinor: positiveMinorUnitsSchema,
  estimatedArrivalMinutes: z.number().int().positive().optional(),
  counterNote: z.string().max(500).optional()
});

export const updateTechnicianLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const nearbyTechniciansQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radiusMiles: z.coerce.number().positive().max(500).default(25)
});

export const autoRouteSchema = z.object({
  workOrderId: z.uuid(),
  maxRadiusMiles: z.number().positive().max(100).default(5)
});
