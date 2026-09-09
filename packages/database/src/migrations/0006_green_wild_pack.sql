ALTER TABLE `technician_certifications` DROP FOREIGN KEY `technician_certifications_technician_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `technician_certifications` ADD CONSTRAINT `tech_certs_technician_id_fk` FOREIGN KEY (`technician_id`) REFERENCES `technician_profiles`(`id`) ON DELETE cascade ON UPDATE no action;