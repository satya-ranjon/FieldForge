DROP INDEX `idx_wo_status` ON `work_orders`;--> statement-breakpoint
DROP INDEX `idx_wo_schedule` ON `work_orders`;--> statement-breakpoint
ALTER TABLE `work_orders` MODIFY COLUMN `status` enum('DRAFT','PUBLISHED','ASSIGNED','EN_ROUTE','ON_SITE','COMPLETED','APPROVED','PAID','CANCELLED','DISPUTED') NOT NULL DEFAULT 'DRAFT';--> statement-breakpoint
ALTER TABLE `escrow_accounts` ADD CONSTRAINT `uq_escrow_work_order` UNIQUE(`work_order_id`);--> statement-breakpoint
CREATE INDEX `idx_wo_status_sched` ON `work_orders` (`status`,`scheduled_start_time`);