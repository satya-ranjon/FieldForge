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
