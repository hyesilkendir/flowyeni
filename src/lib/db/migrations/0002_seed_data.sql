-- Default data insertion for Calafco Accounting System

-- Insert default currencies
INSERT INTO `currencies` (`id`, `code`, `name`, `symbol`, `is_active`) VALUES
('1', 'TRY', 'Turkish Lira', 'TL', true),
('2', 'USD', 'US Dollar', '$', true),
('3', 'EUR', 'Euro', 'EUR', true),
('4', 'GBP', 'British Pound', 'GBP', true);

-- Insert default admin user
INSERT INTO `users` (`id`, `email`, `password`, `name`, `company_name`, `created_at`, `updated_at`) VALUES
('admin-user-1', 'admin@calaf.co', '532d7315', 'Calaf.co Admin', 'CALAF.CO', NOW(), NOW());

-- Insert default categories for admin user
INSERT INTO `categories` (`id`, `name`, `type`, `color`, `is_default`, `user_id`, `created_at`) VALUES
('cat-office-expenses', 'Office Expenses', 'expense', '#ef4444', true, 'admin-user-1', NOW()),
('cat-marketing', 'Marketing', 'expense', '#f97316', true, 'admin-user-1', NOW()),
('cat-technology', 'Technology', 'expense', '#8b5cf6', true, 'admin-user-1', NOW()),
('cat-salary-payments', 'Salary Payments', 'expense', '#06b6d4', true, 'admin-user-1', NOW()),
('cat-client-payments', 'Client Payments', 'income', '#22c55e', true, 'admin-user-1', NOW()),
('cat-other-income', 'Other Income', 'income', '#84cc16', true, 'admin-user-1', NOW()),
('cat-utilities', 'Utilities', 'expense', '#ef4444', true, 'admin-user-1', NOW()),
('cat-rent', 'Rent', 'expense', '#dc2626', true, 'admin-user-1', NOW()),
('cat-fuel', 'Fuel', 'expense', '#f59e0b', true, 'admin-user-1', NOW()),
('cat-maintenance', 'Maintenance', 'expense', '#7c3aed', true, 'admin-user-1', NOW());

-- Insert default company settings
INSERT INTO `company_settings` (`id`, `company_name`, `address`, `phone`, `email`, `website`, `tax_number`, `created_at`, `updated_at`) VALUES
('company-settings-1', 'CALAF.CO', 'İstanbul, Türkiye', '+90 212 555 0000', 'info@calaf.co', 'www.calaf.co', '1234567890', NOW(), NOW());

-- Insert default tevkifat rates according to Turkish tax regulations
INSERT INTO `tevkifat_rates` (`id`, `code`, `numerator`, `denominator`, `description`, `is_active`) VALUES
('tevkifat-9-10', '9/10', 9, 10, 'Mimarlık ve Mühendislik Hizmetleri', true),
('tevkifat-7-10', '7/10', 7, 10, 'Yazılım ve Bilişim Hizmetleri', true),
('tevkifat-5-10', '5/10', 5, 10, 'Makine ve Teçhizat Kiralanması', true),
('tevkifat-3-10', '3/10', 3, 10, 'Gayrimenkul Kiralanması', true),
('tevkifat-2-10', '2/10', 2, 10, 'Taşımacılık Hizmetleri', true),
('tevkifat-1-2', '1/2', 1, 2, 'Temizlik Hizmetleri', true),
('tevkifat-1-10', '1/10', 1, 10, 'Spor Faaliyetleri', true),
('tevkifat-4-10', '4/10', 4, 10, 'Haberleşme Hizmetleri', true),
('tevkifat-6-10', '6/10', 6, 10, 'Yapım İşleri', true),
('tevkifat-8-10', '8/10', 8, 10, 'Müşavirlik Hizmetleri', true);