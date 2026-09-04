CREATE TABLE `invoices` (
	`id` varchar(36) NOT NULL,
	`work_order_id` varchar(36) NOT NULL,
	`buyer_id` varchar(36) NOT NULL,
	`invoice_number` varchar(64) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`content_hash` varchar(64) NOT NULL,
	`issued_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoice_number_unique` UNIQUE(`invoice_number`)
);
--> statement-breakpoint
CREATE TABLE `payout_ledger` (
	`id` varchar(36) NOT NULL,
	`technician_id` varchar(36) NOT NULL,
	`work_order_id` varchar(36) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`type` enum('CREDIT','DEBIT') NOT NULL DEFAULT 'CREDIT',
	`description` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payout_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `idempotency_keys` (
	`key` varchar(255) NOT NULL,
	`scope` varchar(64) NOT NULL,
	`resource_id` varchar(36),
	`status` enum('IN_PROGRESS','COMPLETED','FAILED') NOT NULL DEFAULT 'IN_PROGRESS',
	`response_payload` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`expires_at` timestamp,
	CONSTRAINT `idempotency_keys_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_work_order_id_work_orders_id_fk` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_buyer_id_buyer_profiles_id_fk` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payout_ledger` ADD CONSTRAINT `payout_ledger_technician_id_technician_profiles_id_fk` FOREIGN KEY (`technician_id`) REFERENCES `technician_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payout_ledger` ADD CONSTRAINT `payout_ledger_work_order_id_work_orders_id_fk` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE cascade ON UPDATE no action;