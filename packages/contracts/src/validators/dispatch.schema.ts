import { z } from 'zod';

export const submitBidSchema = z.object({
  workOrderId: z.string().uuid(),
  techId: z.string().uuid(),
  proposedAmount: z.number().positive(),
  estimatedArrivalMinutes: z.number().positive().optional(),
  counterNote: z.string().max(500).optional()
});
