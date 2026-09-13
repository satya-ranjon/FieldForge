CREATE TABLE `billing_outbox_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`event_type` varchar(128) NOT NULL,
	`aggregate_type` varchar(64) NOT NULL,
	`aggregate_id` varchar(36) NOT NULL,
	`correlation_id` varchar(255) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('PENDING','PROCESSING','PUBLISHED','FAILED','DEAD') NOT NULL DEFAULT 'PENDING',
	`attempt_count` int NOT NULL DEFAULT 0,
	`next_attempt_at` timestamp NOT NULL DEFAULT (now()),
	`lease_expires_at` timestamp,
	`claimed_by` varchar(128),
	`claim_token` varchar(36),
	`last_error` text,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `billing_outbox_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_bill_outbox_event_id` UNIQUE(`event_id`)
);
--> statement-breakpoint
CREATE TABLE `work_order_outbox_events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`event_id` varchar(36) NOT NULL,
	`event_type` varchar(128) NOT NULL,
	`aggregate_type` varchar(64) NOT NULL,
	`aggregate_id` varchar(36) NOT NULL,
	`correlation_id` varchar(255) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('PENDING','PROCESSING','PUBLISHED','FAILED','DEAD') NOT NULL DEFAULT 'PENDING',
	`attempt_count` int NOT NULL DEFAULT 0,
	`next_attempt_at` timestamp NOT NULL DEFAULT (now()),
	`lease_expires_at` timestamp,
	`claimed_by` varchar(128),
	`claim_token` varchar(36),
	`last_error` text,
	`published_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_order_outbox_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_wo_outbox_event_id` UNIQUE(`event_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_bill_outbox_poller` ON `billing_outbox_events` (`status`,`next_attempt_at`);--> statement-breakpoint
CREATE INDEX `idx_bill_outbox_lease` ON `billing_outbox_events` (`status`,`lease_expires_at`);--> statement-breakpoint
CREATE INDEX `idx_bill_outbox_fifo` ON `billing_outbox_events` (`aggregate_type`,`aggregate_id`,`id`,`status`);--> statement-breakpoint
CREATE INDEX `idx_wo_outbox_poller` ON `work_order_outbox_events` (`status`,`next_attempt_at`);--> statement-breakpoint
CREATE INDEX `idx_wo_outbox_lease` ON `work_order_outbox_events` (`status`,`lease_expires_at`);--> statement-breakpoint
CREATE INDEX `idx_wo_outbox_fifo` ON `work_order_outbox_events` (`aggregate_type`,`aggregate_id`,`id`,`status`);