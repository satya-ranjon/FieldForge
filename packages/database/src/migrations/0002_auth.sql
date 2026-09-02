CREATE TABLE `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`revoked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `technician_certifications` (
	`id` varchar(36) NOT NULL,
	`technician_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`issued_date` timestamp NOT NULL,
	`expiry_date` timestamp NOT NULL,
	`is_verified` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `technician_certifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `technician_certifications` ADD CONSTRAINT `technician_certifications_technician_id_users_id_fk` FOREIGN KEY (`technician_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
