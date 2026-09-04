CREATE TABLE `work_order_status_history` (
	`id` varchar(36) NOT NULL,
	`work_order_id` varchar(36) NOT NULL,
	`from_status` enum('DRAFT','PUBLISHED','ASSIGNED','EN_ROUTE','ON_SITE','COMPLETED','APPROVED','PAID','CANCELLED','DISPUTED'),
	`to_status` enum('DRAFT','PUBLISHED','ASSIGNED','EN_ROUTE','ON_SITE','COMPLETED','APPROVED','PAID','CANCELLED','DISPUTED') NOT NULL,
	`changed_by` varchar(36) NOT NULL,
	`reason` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_order_status_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `work_order_deliverables` ADD COLUMN `signature_hash` varchar(64);
--> statement-breakpoint
ALTER TABLE `work_order_deliverables` ADD COLUMN `client_name` varchar(255);
--> statement-breakpoint
ALTER TABLE `work_order_deliverables` ADD COLUMN `signed_at` timestamp;
--> statement-breakpoint
ALTER TABLE `work_order_status_history` ADD CONSTRAINT `work_order_status_history_work_order_id_work_orders_id_fk` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `idx_wosh_wo_created` ON `work_order_status_history` (`work_order_id`,`created_at`);
