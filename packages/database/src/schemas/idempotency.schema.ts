import { mysqlTable, varchar, timestamp, mysqlEnum, json } from 'drizzle-orm/mysql-core';

export const idempotencyKeys = mysqlTable('idempotency_keys', {
  key: varchar('key', { length: 255 }).primaryKey(),
  scope: varchar('scope', { length: 64 }).notNull(),
  resourceId: varchar('resource_id', { length: 36 }),
  status: mysqlEnum('status', ['IN_PROGRESS', 'COMPLETED', 'FAILED'])
    .default('IN_PROGRESS')
    .notNull(),
  responsePayload: json('response_payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at')
});
