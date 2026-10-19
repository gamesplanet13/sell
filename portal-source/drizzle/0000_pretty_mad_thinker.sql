CREATE TABLE `customers` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`mobile` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `request_events` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `sell_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `events_request_idx` ON `request_events` (`request_id`);--> statement-breakpoint
CREATE TABLE `request_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`request_id` text,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `sell_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `photos_user_idx` ON `request_photos` (`user_id`);--> statement-breakpoint
CREATE TABLE `sell_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`customer_email` text NOT NULL,
	`details` text NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`estimate_min` integer,
	`estimate_max` integer,
	`final_offer` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `customers`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `requests_user_idx` ON `sell_requests` (`user_id`);