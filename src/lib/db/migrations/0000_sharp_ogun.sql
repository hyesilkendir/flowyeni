CREATE TABLE `bonuses` (
	`id` varchar(191) NOT NULL,
	`employee_id` varchar(191) NOT NULL,
	`type` enum('bonus','advance','overtime','commission') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency_id` varchar(191) NOT NULL,
	`description` text NOT NULL,
	`payment_date` timestamp NOT NULL,
	`user_id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	CONSTRAINT `bonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`color` varchar(7) NOT NULL,
	`is_default` boolean NOT NULL DEFAULT false,
	`user_id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255),
	`phone` varchar(50),
	`address` text,
	`tax_number` varchar(50),
	`contact_person` varchar(255),
	`contract_start_date` timestamp NULL,
	`contract_end_date` timestamp NULL,
	`currency_id` varchar(191) NOT NULL,
	`balance` decimal(15,2) NOT NULL DEFAULT '0.00',
	`is_active` boolean NOT NULL DEFAULT true,
	`user_id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	`updated_at` timestamp NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_settings` (
	`id` varchar(191) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(255) NOT NULL,
	`website` varchar(255),
	`tax_number` varchar(50),
	`light_mode_logo` longtext,
	`dark_mode_logo` longtext,
	`quote_logo` longtext,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	`updated_at` timestamp NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `currencies` (
	`id` varchar(191) NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`symbol` varchar(10) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `currencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `currencies_code_unique` UNIQUE(`code`),
	CONSTRAINT `code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `debts` (
	`id` varchar(191) NOT NULL,
	`client_id` varchar(191),
	`title` varchar(255) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency_id` varchar(191) NOT NULL,
	`due_date` timestamp NOT NULL,
	`status` enum('pending','paid','overdue') NOT NULL DEFAULT 'pending',
	`type` enum('payable','receivable') NOT NULL,
	`description` text,
	`user_id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	`updated_at` timestamp NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `debts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`position` varchar(255) NOT NULL,
	`net_salary` decimal(15,2) NOT NULL,
	`currency_id` varchar(191) NOT NULL,
	`payroll_period` enum('monthly','weekly','biweekly') NOT NULL,
	`payment_day` int NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	`user_id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	`updated_at` timestamp NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quote_items` (
	`id` varchar(191) NOT NULL,
	`quote_id` varchar(191) NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unit_price` decimal(15,2) NOT NULL,
	`vat_rate` decimal(5,2) NOT NULL,
	`total` decimal(15,2) NOT NULL,
	`order` int NOT NULL,
	CONSTRAINT `quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` varchar(191) NOT NULL,
	`client_id` varchar(191) NOT NULL,
	`quote_number` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`valid_until` timestamp NOT NULL,
	`status` enum('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(15,2) NOT NULL,
	`vat_amount` decimal(15,2) NOT NULL,
	`total` decimal(15,2) NOT NULL,
	`currency_id` varchar(191) NOT NULL,
	`notes` text,
	`terms_and_conditions` text,
	`tevkifat_applied` boolean NOT NULL DEFAULT false,
	`tevkifat_rate` varchar(10),
	`tevkifat_amount` decimal(15,2) DEFAULT '0.00',
	`net_amount_after_tevkifat` decimal(15,2) DEFAULT '0.00',
	`user_id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	`updated_at` timestamp NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_quote_number_unique` UNIQUE(`quote_number`),
	CONSTRAINT `quote_number_idx` UNIQUE(`quote_number`)
);
--> statement-breakpoint
CREATE TABLE `tevkifat_rates` (
	`id` varchar(191) NOT NULL,
	`code` varchar(10) NOT NULL,
	`numerator` int NOT NULL,
	`denominator` int NOT NULL,
	`description` varchar(500) NOT NULL,
	`is_active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `tevkifat_rates_id` PRIMARY KEY(`id`),
	CONSTRAINT `tevkifat_rates_code_unique` UNIQUE(`code`),
	CONSTRAINT `code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` varchar(191) NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency_id` varchar(191) NOT NULL,
	`category_id` varchar(191) NOT NULL,
	`client_id` varchar(191),
	`employee_id` varchar(191),
	`description` text NOT NULL,
	`transaction_date` timestamp NOT NULL,
	`is_vat_included` boolean NOT NULL DEFAULT false,
	`vat_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`is_recurring` boolean NOT NULL DEFAULT false,
	`recurring_period` enum('daily','weekly','monthly','quarterly','yearly'),
	`next_recurring_date` timestamp NULL,
	`parent_transaction_id` varchar(191),
	`user_id` varchar(191) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	`updated_at` timestamp NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(191) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`company_name` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT NOW(),
	`updated_at` timestamp NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `employee_id_idx` ON `bonuses` (`employee_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `bonuses` (`user_id`);--> statement-breakpoint
CREATE INDEX `currency_id_idx` ON `bonuses` (`currency_id`);--> statement-breakpoint
CREATE INDEX `payment_date_idx` ON `bonuses` (`payment_date`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `categories` (`user_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `clients` (`user_id`);--> statement-breakpoint
CREATE INDEX `currency_id_idx` ON `clients` (`currency_id`);--> statement-breakpoint
CREATE INDEX `tax_number_idx` ON `clients` (`tax_number`);--> statement-breakpoint
CREATE INDEX `client_id_idx` ON `debts` (`client_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `debts` (`user_id`);--> statement-breakpoint
CREATE INDEX `currency_id_idx` ON `debts` (`currency_id`);--> statement-breakpoint
CREATE INDEX `due_date_idx` ON `debts` (`due_date`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `debts` (`status`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `debts` (`type`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `employees` (`user_id`);--> statement-breakpoint
CREATE INDEX `currency_id_idx` ON `employees` (`currency_id`);--> statement-breakpoint
CREATE INDEX `quote_id_idx` ON `quote_items` (`quote_id`);--> statement-breakpoint
CREATE INDEX `order_idx` ON `quote_items` (`order`);--> statement-breakpoint
CREATE INDEX `client_id_idx` ON `quotes` (`client_id`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `quotes` (`user_id`);--> statement-breakpoint
CREATE INDEX `currency_id_idx` ON `quotes` (`currency_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `quotes` (`status`);--> statement-breakpoint
CREATE INDEX `valid_until_idx` ON `quotes` (`valid_until`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `tevkifat_rates` (`is_active`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `category_id_idx` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `client_id_idx` ON `transactions` (`client_id`);--> statement-breakpoint
CREATE INDEX `employee_id_idx` ON `transactions` (`employee_id`);--> statement-breakpoint
CREATE INDEX `currency_id_idx` ON `transactions` (`currency_id`);--> statement-breakpoint
CREATE INDEX `transaction_date_idx` ON `transactions` (`transaction_date`);--> statement-breakpoint
CREATE INDEX `parent_transaction_id_idx` ON `transactions` (`parent_transaction_id`);