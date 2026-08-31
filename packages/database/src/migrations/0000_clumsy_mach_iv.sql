CREATE TABLE `work_order_bids` (
	`id` varchar(36) NOT NULL,
	`work_order_id` varchar(36) NOT NULL,
	`technician_id` varchar(36) NOT NULL,
	`bid_amount` decimal(10,2) NOT NULL,
	`counter_note` text,
	`bid_status` enum('PENDING','ACCEPTED','REJECTED','WITHDRAWN') NOT NULL DEFAULT 'PENDING',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_order_bids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escrow_accounts` (
	`id` varchar(36) NOT NULL,
	`work_order_id` varchar(36) NOT NULL,
	`amount_locked` decimal(10,2) NOT NULL,
	`status` enum('HELD','RELEASED','REFUNDED','DISPUTED') NOT NULL DEFAULT 'HELD',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`released_at` timestamp,
	CONSTRAINT `escrow_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_order_deliverables` (
	`id` varchar(36) NOT NULL,
	`work_order_id` varchar(36) NOT NULL,
	`deliverable_type` enum('PHOTO_BEFORE','PHOTO_AFTER','CHECKLIST','SIGNATURE') NOT NULL,
	`s3_url` varchar(512) NOT NULL,
	`uploaded_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_order_deliverables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buyer_profiles` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`billing_address` text NOT NULL,
	`escrow_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `buyer_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `buyer_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `technician_profiles` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`hourly_rate` decimal(8,2) NOT NULL,
	`current_latitude` decimal(10,8),
	`current_longitude` decimal(11,8),
	`rating_average` decimal(3,2) NOT NULL DEFAULT '5.00',
	`jobs_completed` int NOT NULL DEFAULT 0,
	CONSTRAINT `technician_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `technician_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('BUYER','TECHNICIAN','DISPATCHER','ADMIN') NOT NULL,
	`phone_number` varchar(30) NOT NULL,
	`status` enum('PENDING','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` varchar(36) NOT NULL,
	`buyer_id` varchar(36) NOT NULL,
	`assigned_technician_id` varchar(36),
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`status` enum('DRAFT','PUBLISHED','ASSIGNED','EN_ROUTE','ON_SITE','COMPLETED','APPROVED','CANCELLED','DISPUTED') NOT NULL DEFAULT 'DRAFT',
	`budget_type` enum('FIXED','HOURLY') NOT NULL,
	`budget_amount` decimal(10,2) NOT NULL,
	`address_line` text NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`scheduled_start_time` datetime NOT NULL,
	`scheduled_end_time` datetime NOT NULL,
	`sla_expiration_time` datetime NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `work_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `work_order_bids` ADD CONSTRAINT `work_order_bids_work_order_id_work_orders_id_fk` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_order_bids` ADD CONSTRAINT `work_order_bids_technician_id_technician_profiles_id_fk` FOREIGN KEY (`technician_id`) REFERENCES `technician_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `escrow_accounts` ADD CONSTRAINT `escrow_accounts_work_order_id_work_orders_id_fk` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_order_deliverables` ADD CONSTRAINT `work_order_deliverables_work_order_id_work_orders_id_fk` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `buyer_profiles` ADD CONSTRAINT `buyer_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `technician_profiles` ADD CONSTRAINT `technician_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_buyer_id_buyer_profiles_id_fk` FOREIGN KEY (`buyer_id`) REFERENCES `buyer_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `work_orders` ADD CONSTRAINT `work_orders_assigned_technician_id_technician_profiles_id_fk` FOREIGN KEY (`assigned_technician_id`) REFERENCES `technician_profiles`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_wo_status` ON `work_orders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_wo_schedule` ON `work_orders` (`scheduled_start_time`);