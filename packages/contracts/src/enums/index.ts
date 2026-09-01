export enum UserRole {
  BUYER = 'BUYER',
  TECHNICIAN = 'TECHNICIAN',
  DISPATCHER = 'DISPATCHER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum BudgetType {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY'
}

/**
 * Canonical work order lifecycle, per docs/SRS.md FR-WO-002.
 *
 * This enum is the single source of truth for work order state. Bidding is not
 * a state: bids live in the `work_order_bids` table and a work order stays
 * PUBLISHED while it collects them. `PAID` is terminal and is reached only by
 * a successful escrow release (FR-BILL-002).
 */
export enum WorkOrderStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE = 'EN_ROUTE',
  ON_SITE = 'ON_SITE',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED'
}

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum DeliverableType {
  PHOTO_BEFORE = 'PHOTO_BEFORE',
  PHOTO_AFTER = 'PHOTO_AFTER',
  CHECKLIST = 'CHECKLIST',
  SIGNATURE = 'SIGNATURE'
}

export enum EscrowStatus {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED'
}

export enum PriorityLevel {
  LOW = 'LOW',
  STANDARD = 'STANDARD',
  URGENT = 'URGENT',
  CRITICAL_SLA = 'CRITICAL_SLA'
}
