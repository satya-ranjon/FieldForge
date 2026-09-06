import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as usersSchema from './schemas/users.schema';
import * as workOrdersSchema from './schemas/work-orders.schema';
import * as bidsSchema from './schemas/bids.schema';
import * as deliverablesSchema from './schemas/deliverables.schema';
import * as billingSchema from './schemas/billing.schema';
import * as idempotencySchema from './schemas/idempotency.schema';

export const schema = {
  ...usersSchema,
  ...workOrdersSchema,
  ...bidsSchema,
  ...deliverablesSchema,
  ...billingSchema,
  ...idempotencySchema
};

export const createDbClient = (connectionUri: string) => {
  const pool = mysql.createPool(connectionUri);
  return drizzle(pool, { schema, mode: 'default' });
};

export { sql } from 'drizzle-orm';

export {
  usersSchema,
  workOrdersSchema,
  bidsSchema,
  deliverablesSchema,
  billingSchema,
  idempotencySchema
};

export * from './schemas/users.schema';
export * from './schemas/work-orders.schema';
export * from './schemas/bids.schema';
export * from './schemas/deliverables.schema';
export * from './schemas/billing.schema';
export * from './schemas/idempotency.schema';
