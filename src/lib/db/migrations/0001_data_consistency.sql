-- Foreign Key Constraints
-- Add foreign key constraints for data integrity

-- Categories -> Users
ALTER TABLE `categories` ADD CONSTRAINT `fk_categories_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Clients -> Users & Currencies
ALTER TABLE `clients` ADD CONSTRAINT `fk_clients_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `clients` ADD CONSTRAINT `fk_clients_currency_id` 
FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Employees -> Users & Currencies
ALTER TABLE `employees` ADD CONSTRAINT `fk_employees_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `employees` ADD CONSTRAINT `fk_employees_currency_id` 
FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Transactions -> Users, Currencies, Categories, Clients, Employees
ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_currency_id` 
FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_category_id` 
FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_client_id` 
FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_employee_id` 
FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `transactions` ADD CONSTRAINT `fk_transactions_parent_transaction_id` 
FOREIGN KEY (`parent_transaction_id`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Bonuses -> Employees, Users, Currencies
ALTER TABLE `bonuses` ADD CONSTRAINT `fk_bonuses_employee_id` 
FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bonuses` ADD CONSTRAINT `fk_bonuses_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `bonuses` ADD CONSTRAINT `fk_bonuses_currency_id` 
FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Quotes -> Clients, Users, Currencies
ALTER TABLE `quotes` ADD CONSTRAINT `fk_quotes_client_id` 
FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `quotes` ADD CONSTRAINT `fk_quotes_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `quotes` ADD CONSTRAINT `fk_quotes_currency_id` 
FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Quote Items -> Quotes
ALTER TABLE `quote_items` ADD CONSTRAINT `fk_quote_items_quote_id` 
FOREIGN KEY (`quote_id`) REFERENCES `quotes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Debts -> Clients, Users, Currencies
ALTER TABLE `debts` ADD CONSTRAINT `fk_debts_client_id` 
FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `debts` ADD CONSTRAINT `fk_debts_user_id` 
FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `debts` ADD CONSTRAINT `fk_debts_currency_id` 
FOREIGN KEY (`currency_id`) REFERENCES `currencies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data Consistency Triggers

DELIMITER $$

-- Trigger to update client balance when transaction is added/updated/deleted
CREATE TRIGGER `tr_transaction_client_balance_insert` 
AFTER INSERT ON `transactions`
FOR EACH ROW
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        UPDATE `clients` 
        SET `balance` = `balance` + CASE 
            WHEN NEW.type = 'income' THEN NEW.amount 
            ELSE -NEW.amount 
        END,
        `updated_at` = NOW()
        WHERE `id` = NEW.client_id;
    END IF;
END$$

CREATE TRIGGER `tr_transaction_client_balance_update` 
AFTER UPDATE ON `transactions`
FOR EACH ROW
BEGIN
    -- Eski client balance'ını geri al
    IF OLD.client_id IS NOT NULL THEN
        UPDATE `clients` 
        SET `balance` = `balance` - CASE 
            WHEN OLD.type = 'income' THEN OLD.amount 
            ELSE -OLD.amount 
        END,
        `updated_at` = NOW()
        WHERE `id` = OLD.client_id;
    END IF;
    
    -- Yeni client balance'ı ekle
    IF NEW.client_id IS NOT NULL THEN
        UPDATE `clients` 
        SET `balance` = `balance` + CASE 
            WHEN NEW.type = 'income' THEN NEW.amount 
            ELSE -NEW.amount 
        END,
        `updated_at` = NOW()
        WHERE `id` = NEW.client_id;
    END IF;
END$$

CREATE TRIGGER `tr_transaction_client_balance_delete` 
AFTER DELETE ON `transactions`
FOR EACH ROW
BEGIN
    IF OLD.client_id IS NOT NULL THEN
        UPDATE `clients` 
        SET `balance` = `balance` - CASE 
            WHEN OLD.type = 'income' THEN OLD.amount 
            ELSE -OLD.amount 
        END,
        `updated_at` = NOW()
        WHERE `id` = OLD.client_id;
    END IF;
END$$

-- Trigger to automatically update quote totals when quote items change
CREATE TRIGGER `tr_quote_items_update_quote_totals_insert` 
AFTER INSERT ON `quote_items`
FOR EACH ROW
BEGIN
    DECLARE quote_subtotal DECIMAL(15,2) DEFAULT 0;
    DECLARE quote_vat_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE quote_total DECIMAL(15,2) DEFAULT 0;
    
    -- Calculate new totals
    SELECT 
        COALESCE(SUM(qi.quantity * qi.unit_price), 0),
        COALESCE(SUM((qi.quantity * qi.unit_price) * (qi.vat_rate / 100)), 0),
        COALESCE(SUM(qi.total), 0)
    INTO quote_subtotal, quote_vat_amount, quote_total
    FROM `quote_items` qi
    WHERE qi.quote_id = NEW.quote_id;
    
    -- Update quote totals
    UPDATE `quotes` 
    SET 
        `subtotal` = quote_subtotal,
        `vat_amount` = quote_vat_amount,
        `total` = quote_total,
        `updated_at` = NOW()
    WHERE `id` = NEW.quote_id;
END$$

CREATE TRIGGER `tr_quote_items_update_quote_totals_update` 
AFTER UPDATE ON `quote_items`
FOR EACH ROW
BEGIN
    DECLARE quote_subtotal DECIMAL(15,2) DEFAULT 0;
    DECLARE quote_vat_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE quote_total DECIMAL(15,2) DEFAULT 0;
    
    -- Calculate new totals
    SELECT 
        COALESCE(SUM(qi.quantity * qi.unit_price), 0),
        COALESCE(SUM((qi.quantity * qi.unit_price) * (qi.vat_rate / 100)), 0),
        COALESCE(SUM(qi.total), 0)
    INTO quote_subtotal, quote_vat_amount, quote_total
    FROM `quote_items` qi
    WHERE qi.quote_id = NEW.quote_id;
    
    -- Update quote totals
    UPDATE `quotes` 
    SET 
        `subtotal` = quote_subtotal,
        `vat_amount` = quote_vat_amount,
        `total` = quote_total,
        `updated_at` = NOW()
    WHERE `id` = NEW.quote_id;
END$$

CREATE TRIGGER `tr_quote_items_update_quote_totals_delete` 
AFTER DELETE ON `quote_items`
FOR EACH ROW
BEGIN
    DECLARE quote_subtotal DECIMAL(15,2) DEFAULT 0;
    DECLARE quote_vat_amount DECIMAL(15,2) DEFAULT 0;
    DECLARE quote_total DECIMAL(15,2) DEFAULT 0;
    
    -- Calculate new totals
    SELECT 
        COALESCE(SUM(qi.quantity * qi.unit_price), 0),
        COALESCE(SUM((qi.quantity * qi.unit_price) * (qi.vat_rate / 100)), 0),
        COALESCE(SUM(qi.total), 0)
    INTO quote_subtotal, quote_vat_amount, quote_total
    FROM `quote_items` qi
    WHERE qi.quote_id = OLD.quote_id;
    
    -- Update quote totals
    UPDATE `quotes` 
    SET 
        `subtotal` = quote_subtotal,
        `vat_amount` = quote_vat_amount,
        `total` = quote_total,
        `updated_at` = NOW()
    WHERE `id` = OLD.quote_id;
END$$

-- Trigger to calculate tevkifat amounts automatically
CREATE TRIGGER `tr_quotes_calculate_tevkifat_insert` 
BEFORE INSERT ON `quotes`
FOR EACH ROW
BEGIN
    IF NEW.tevkifat_applied = true AND NEW.tevkifat_rate IS NOT NULL THEN
        DECLARE numerator INT;
        DECLARE denominator INT;
        
        -- Parse tevkifat rate (e.g., "9/10")
        SET numerator = CAST(SUBSTRING_INDEX(NEW.tevkifat_rate, '/', 1) AS UNSIGNED);
        SET denominator = CAST(SUBSTRING_INDEX(NEW.tevkifat_rate, '/', -1) AS UNSIGNED);
        
        -- Calculate tevkifat amount based on VAT
        SET NEW.tevkifat_amount = (NEW.vat_amount * numerator) / denominator;
        SET NEW.net_amount_after_tevkifat = NEW.total - NEW.tevkifat_amount;
    ELSE
        SET NEW.tevkifat_amount = 0;
        SET NEW.net_amount_after_tevkifat = NEW.total;
    END IF;
END$$

CREATE TRIGGER `tr_quotes_calculate_tevkifat_update` 
BEFORE UPDATE ON `quotes`
FOR EACH ROW
BEGIN
    IF NEW.tevkifat_applied = true AND NEW.tevkifat_rate IS NOT NULL THEN
        DECLARE numerator INT;
        DECLARE denominator INT;
        
        -- Parse tevkifat rate (e.g., "9/10")
        SET numerator = CAST(SUBSTRING_INDEX(NEW.tevkifat_rate, '/', 1) AS UNSIGNED);
        SET denominator = CAST(SUBSTRING_INDEX(NEW.tevkifat_rate, '/', -1) AS UNSIGNED);
        
        -- Calculate tevkifat amount based on VAT
        SET NEW.tevkifat_amount = (NEW.vat_amount * numerator) / denominator;
        SET NEW.net_amount_after_tevkifat = NEW.total - NEW.tevkifat_amount;
    ELSE
        SET NEW.tevkifat_amount = 0;
        SET NEW.net_amount_after_tevkifat = NEW.total;
    END IF;
END$$

-- Trigger to auto-generate quote numbers
CREATE TRIGGER `tr_quotes_generate_number` 
BEFORE INSERT ON `quotes`
FOR EACH ROW
BEGIN
    DECLARE next_number INT DEFAULT 1;
    DECLARE quote_prefix VARCHAR(10) DEFAULT 'TKF';
    DECLARE current_year VARCHAR(4) DEFAULT YEAR(NOW());
    
    -- Find the next quote number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number, LENGTH(CONCAT(quote_prefix, '-', current_year, '-')) + 1) AS UNSIGNED)), 0) + 1
    INTO next_number
    FROM quotes 
    WHERE quote_number LIKE CONCAT(quote_prefix, '-', current_year, '-%');
    
    -- Generate quote number: TKF-2024-001
    SET NEW.quote_number = CONCAT(quote_prefix, '-', current_year, '-', LPAD(next_number, 3, '0'));
END$$

-- Trigger to auto-update debt status based on due date
CREATE TRIGGER `tr_debts_update_status` 
BEFORE UPDATE ON `debts`
FOR EACH ROW
BEGIN
    IF NEW.status = 'pending' AND NEW.due_date < NOW() THEN
        SET NEW.status = 'overdue';
    END IF;
END$$

DELIMITER ;

-- Indexes for better performance on triggers
CREATE INDEX `idx_transactions_client_type_amount` ON `transactions` (`client_id`, `type`, `amount`);
CREATE INDEX `idx_quote_items_quote_calculations` ON `quote_items` (`quote_id`, `quantity`, `unit_price`, `vat_rate`);
CREATE INDEX `idx_quotes_tevkifat` ON `quotes` (`tevkifat_applied`, `tevkifat_rate`);
CREATE INDEX `idx_debts_status_due_date` ON `debts` (`status`, `due_date`);