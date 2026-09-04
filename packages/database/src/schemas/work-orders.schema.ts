import {
  mysqlTable,
  varchar,
  timestamp,
  mysqlEnum,
  decimal,
  text,
  index,
  datetime
} from 'drizzle-orm/mysql-core';
import { buyerProfiles, technicianProfiles } from './users.schema';

export const workOrders = mysqlTable(
  'work_orders',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    buyerId: varchar('buyer_id', { length: 36 })
      .references(() => buyerProfiles.id)
      .notNull(),
    assignedTechnicianId: varchar('assigned_technician_id', { length: 36 }).references(
      () => technicianProfiles.id
    ),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 100 }).notNull(),
    status: mysqlEnum('status', [
      'DRAFT',
      'PUBLISHED',
      'ASSIGNED',
      'EN_ROUTE',
      'ON_SITE',
      'COMPLETED',
      'APPROVED',
      'PAID',
      'CANCELLED',
      'DISPUTED'
    ])
      .default('DRAFT')
      .notNull(),
    budgetType: mysqlEnum('budget_type', ['FIXED', 'HOURLY']).notNull(),
    budgetAmount: decimal('budget_amount', { precision: 10, scale: 2 }).notNull(),
    addressLine: text('address_line').notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
    longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
    scheduledStartTime: datetime('scheduled_start_time').notNull(),
    scheduledEndTime: datetime('scheduled_end_time').notNull(),
    slaExpirationTime: datetime('sla_expiration_time').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
  },
  // The dispatch queue reads open work orders in schedule order, so a single
  // composite index serves that access path; two single-column indexes would
  // leave MySQL to filesort the schedule. See .agent rules RULE-DB-02.
  (table) => [index('idx_wo_status_sched').on(table.status, table.scheduledStartTime)]
);

export const workOrderStatusHistory = mysqlTable(
  'work_order_status_history',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    workOrderId: varchar('work_order_id', { length: 36 })
      .references(() => workOrders.id, { onDelete: 'cascade' })
      .notNull(),
    fromStatus: mysqlEnum('from_status', [
      'DRAFT',
      'PUBLISHED',
      'ASSIGNED',
      'EN_ROUTE',
      'ON_SITE',
      'COMPLETED',
      'APPROVED',
      'PAID',
      'CANCELLED',
      'DISPUTED'
    ]),
    toStatus: mysqlEnum('to_status', [
      'DRAFT',
      'PUBLISHED',
      'ASSIGNED',
      'EN_ROUTE',
      'ON_SITE',
      'COMPLETED',
      'APPROVED',
      'PAID',
      'CANCELLED',
      'DISPUTED'
    ]).notNull(),
    changedBy: varchar('changed_by', { length: 36 }).notNull(),
    reason: text('reason'),
    createdAt: timestamp('created_at').defaultNow().notNull()
  },
  (table) => [index('idx_wosh_wo_created').on(table.workOrderId, table.createdAt)]
);
