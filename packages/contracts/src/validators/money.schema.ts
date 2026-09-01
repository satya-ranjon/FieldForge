import { z } from 'zod';

/**
 * A monetary amount as an integer count of minor units. See src/money.ts for
 * why every wire amount is scaled this way; this schema is the runtime half of
 * that decision, rejecting the fractional dollars that used to slip through
 * `z.number().positive()`.
 */
export const positiveMinorUnitsSchema = z
  .number()
  .int('Amounts must be an integer number of minor units (cents), not fractional currency')
  .positive();
