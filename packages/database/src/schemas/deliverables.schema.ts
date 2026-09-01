import { mysqlTable, varchar, timestamp, mysqlEnum } from 'drizzle-orm/mysql-core';
import { workOrders } from './work-orders.schema';

export const workOrderDeliverables = mysqlTable('work_order_deliverables', {
  id: varchar('id', { length: 36 }).primaryKey(),
  workOrderId: varchar('work_order_id', { length: 36 })
    .references(() => workOrders.id, { onDelete: 'cascade' })
    .notNull(),
  deliverableType: mysqlEnum('deliverable_type', [
    'PHOTO_BEFORE',
    'PHOTO_AFTER',
    'CHECKLIST',
    'SIGNATURE'
  ]).notNull(),
  s3Url: varchar('s3_url', { length: 512 }).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull()
});
