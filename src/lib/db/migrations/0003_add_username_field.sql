-- Add username field to users table
ALTER TABLE `users` ADD COLUMN `username` varchar(50) NOT NULL UNIQUE AFTER `id`;

-- Create index for username
CREATE UNIQUE INDEX `username_idx` ON `users` (`username`);

-- Update existing users with default username (if any exist)
UPDATE `users` SET `username` = 'admin' WHERE `email` = 'admin@calaf.co';
