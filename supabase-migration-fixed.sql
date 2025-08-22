-- Calaf.co Muhasebe Sistemi - Supabase Migration (FIXED)
-- Bu SQL'i Supabase SQL Editor'da çalıştırın

-- Users tablosu
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  company_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currencies tablosu
CREATE TABLE IF NOT EXISTS currencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Categories tablosu
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  color VARCHAR(7) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients tablosu
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  tax_number VARCHAR(50),
  contact_person VARCHAR(255),
  contract_start_date DATE,
  contract_end_date DATE,
  currency_id UUID REFERENCES currencies(id),
  balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees tablosu
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  net_salary DECIMAL(15,2) NOT NULL,
  currency_id UUID REFERENCES currencies(id),
  payroll_period VARCHAR(20) NOT NULL CHECK (payroll_period IN ('monthly', 'weekly', 'biweekly')),
  payment_day INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  emergency_contact VARCHAR(255),
  contract_start_date DATE,
  contract_end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions tablosu
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL,
  currency_id UUID REFERENCES currencies(id),
  category_id UUID REFERENCES categories(id),
  client_id UUID REFERENCES clients(id),
  employee_id UUID REFERENCES employees(id),
  cash_account_id UUID,
  description TEXT NOT NULL,
  notes TEXT,
  transaction_date DATE NOT NULL,
  is_vat_included BOOLEAN DEFAULT false,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  is_recurring BOOLEAN DEFAULT false,
  recurring_period VARCHAR(20) CHECK (recurring_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  next_recurring_date DATE,
  parent_transaction_id UUID REFERENCES transactions(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes tablosu
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number VARCHAR(100) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  currency_id UUID REFERENCES currencies(id),
  total_amount DECIMAL(15,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  vat_amount DECIMAL(15,2) DEFAULT 0,
  total_with_vat DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE NOT NULL,
  notes TEXT,
  terms_conditions TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Debts tablosu
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  currency_id UUID REFERENCES currencies(id),
  amount DECIMAL(15,2) NOT NULL,
  due_date DATE NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash Accounts tablosu
CREATE TABLE IF NOT EXISTS cash_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  currency_id UUID REFERENCES currencies(id),
  initial_balance DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices tablosu
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id),
  currency_id UUID REFERENCES currencies(id),
  total_amount DECIMAL(15,2) NOT NULL,
  vat_rate DECIMAL(5,2) DEFAULT 0,
  vat_amount DECIMAL(15,2) DEFAULT 0,
  total_with_vat DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  notes TEXT,
  terms_conditions TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_period VARCHAR(20) CHECK (recurring_period IN ('monthly', 'quarterly', 'yearly')),
  next_invoice_date DATE,
  parent_invoice_id UUID REFERENCES invoices(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regular Payments tablosu
CREATE TABLE IF NOT EXISTS regular_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL,
  currency_id UUID REFERENCES currencies(id),
  category_id UUID REFERENCES categories(id),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_payment_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  description TEXT NOT NULL,
  notes TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company Settings tablosu
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  tax_number VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url TEXT,
  default_currency_id UUID REFERENCES currencies(id),
  default_vat_rate DECIMAL(5,2) DEFAULT 18,
  invoice_prefix VARCHAR(20),
  quote_prefix VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default currencies ekle
INSERT INTO currencies (code, name, symbol, is_active) VALUES
  ('TRY', 'Türk Lirası', '₺', true),
  ('USD', 'US Dollar', '$', true),
  ('EUR', 'Euro', '€', true),
  ('GBP', 'British Pound', '£', true)
ON CONFLICT (code) DO NOTHING;

-- Default categories ekle (user_id NULL olacak, her kullanıcı kendi kategorilerini oluşturacak)
INSERT INTO categories (name, type, color, is_default, user_id) VALUES
  ('Maaş', 'income', '#10B981', true, NULL),
  ('Satış', 'income', '#3B82F6', true, NULL),
  ('Kira', 'expense', '#EF4444', true, NULL),
  ('Elektrik', 'expense', '#F59E0B', true, NULL),
  ('Su', 'expense', '#06B6D4', true, NULL),
  ('İnternet', 'expense', '#8B5CF6', true, NULL),
  ('Telefon', 'expense', '#EC4899', true, NULL),
  ('Yemek', 'expense', '#F97316', true, NULL),
  ('Ulaşım', 'expense', '#84CC16', true, NULL),
  ('Sağlık', 'expense', '#DC2626', true, NULL)
ON CONFLICT DO NOTHING;

-- Row Level Security (RLS) DEVRE DIŞI - Custom auth kullandığımız için
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE regular_payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_accounts_user_id ON cash_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_regular_payments_user_id ON regular_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);
