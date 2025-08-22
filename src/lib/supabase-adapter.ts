/**
 * Supabase Storage Adapter
 * Vercel KV yerine PostgreSQL tabanlı Supabase kullanır
 */

import { supabase } from './supabase-client';
import type { 
  User, 
  Client, 
  Employee, 
  Transaction, 
  Category, 
  Currency, 
  Quote, 
  Debt,
  CompanySettings,
  CashAccount,
  Invoice,
  RegularPayment
} from './database-schema';

export class SupabaseAdapter {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // User Operations
  async getUser(identifier: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`username.eq.${identifier},email.eq.${identifier}`)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      password: data.password,
      name: data.name,
      username: data.username,
      role: data.role,
      companyName: data.company_name,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          username: userData.username,
          role: userData.role || 'user',
          company_name: userData.companyName,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase createUser error:', error);
        throw new Error(`Kayıt hatası: ${error.message}`);
      }

      if (!data) {
        throw new Error('Kullanıcı oluşturulamadı');
      }

      return {
        id: data.id,
        email: data.email,
        password: data.password,
        name: data.name,
        username: data.username,
        role: data.role,
        companyName: data.company_name,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };
    } catch (error) {
      console.error('createUser catch error:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const updateData: any = {};
    if (updates.email) updateData.email = updates.email;
    if (updates.password) updateData.password = updates.password;
    if (updates.name) updateData.name = updates.name;
    if (updates.username) updateData.username = updates.username;
    if (updates.role) updateData.role = updates.role;
    if (updates.companyName) updateData.company_name = updates.companyName;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      password: data.password,
      name: data.name,
      username: data.username,
      role: data.role,
      companyName: data.company_name,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Client Operations
  async getClients(userId: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      address: item.address,
      taxNumber: item.tax_number,
      contactPerson: item.contact_person,
      contractStartDate: item.contract_start_date ? new Date(item.contract_start_date) : undefined,
      contractEndDate: item.contract_end_date ? new Date(item.contract_end_date) : undefined,
      currencyId: item.currency_id,
      balance: item.balance,
      isActive: item.is_active,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  async createClient(userId: string, clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        address: clientData.address,
        tax_number: clientData.taxNumber,
        contact_person: clientData.contactPerson,
        contract_start_date: clientData.contractStartDate?.toISOString(),
        contract_end_date: clientData.contractEndDate?.toISOString(),
        currency_id: clientData.currencyId,
        balance: clientData.balance || 0,
        is_active: clientData.isActive !== false,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      taxNumber: data.tax_number,
      contactPerson: data.contact_person,
      contractStartDate: data.contract_start_date ? new Date(data.contract_start_date) : undefined,
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      currencyId: data.currency_id,
      balance: data.balance,
      isActive: data.is_active,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateClient(userId: string, id: string, updates: Partial<Client>): Promise<Client | null> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.address) updateData.address = updates.address;
    if (updates.taxNumber) updateData.tax_number = updates.taxNumber;
    if (updates.contactPerson) updateData.contact_person = updates.contactPerson;
    if (updates.contractStartDate) updateData.contract_start_date = updates.contractStartDate.toISOString();
    if (updates.contractEndDate) updateData.contract_end_date = updates.contractEndDate.toISOString();
    if (updates.currencyId) updateData.currency_id = updates.currencyId;
    if (updates.balance !== undefined) updateData.balance = updates.balance;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      taxNumber: data.tax_number,
      contactPerson: data.contact_person,
      contractStartDate: data.contract_start_date ? new Date(data.contract_start_date) : undefined,
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      currencyId: data.currency_id,
      balance: data.balance,
      isActive: data.is_active,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteClient(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // Employee Operations
  async getEmployees(userId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      name: item.name,
      position: item.position,
      netSalary: item.net_salary,
      currencyId: item.currency_id,
      payrollPeriod: item.payroll_period,
      paymentDay: item.payment_day,
      isActive: item.is_active,
      userId: item.user_id,
      email: item.email,
      phone: item.phone,
      address: item.address,
      emergencyContact: item.emergency_contact,
      contractStartDate: item.contract_start_date ? new Date(item.contract_start_date) : undefined,
      contractEndDate: item.contract_end_date ? new Date(item.contract_end_date) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  async createEmployee(userId: string, employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        name: employeeData.name,
        position: employeeData.position,
        net_salary: employeeData.netSalary,
        currency_id: employeeData.currencyId,
        payroll_period: employeeData.payrollPeriod,
        payment_day: employeeData.paymentDay,
        is_active: employeeData.isActive !== false,
        user_id: userId,
        email: employeeData.email,
        phone: employeeData.phone,
        address: employeeData.address,
        emergency_contact: employeeData.emergencyContact,
        contract_start_date: employeeData.contractStartDate?.toISOString(),
        contract_end_date: employeeData.contractEndDate?.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      position: data.position,
      netSalary: data.net_salary,
      currencyId: data.currency_id,
      payrollPeriod: data.payroll_period,
      paymentDay: data.payment_day,
      isActive: data.is_active,
      userId: data.user_id,
      email: data.email,
      phone: data.phone,
      address: data.address,
      emergencyContact: data.emergency_contact,
      contractStartDate: data.contract_start_date ? new Date(data.contract_start_date) : undefined,
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateEmployee(userId: string, id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.position) updateData.position = updates.position;
    if (updates.netSalary) updateData.net_salary = updates.netSalary;
    if (updates.currencyId) updateData.currency_id = updates.currencyId;
    if (updates.payrollPeriod) updateData.payroll_period = updates.payrollPeriod;
    if (updates.paymentDay) updateData.payment_day = updates.paymentDay;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.email) updateData.email = updates.email;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.address) updateData.address = updates.address;
    if (updates.emergencyContact) updateData.emergency_contact = updates.emergencyContact;
    if (updates.contractStartDate) updateData.contract_start_date = updates.contractStartDate.toISOString();
    if (updates.contractEndDate) updateData.contract_end_date = updates.contractEndDate.toISOString();
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      position: data.position,
      netSalary: data.net_salary,
      currencyId: data.currency_id,
      payrollPeriod: data.payroll_period,
      paymentDay: data.payment_day,
      isActive: data.is_active,
      userId: data.user_id,
      email: data.email,
      phone: data.phone,
      address: data.address,
      emergencyContact: data.emergency_contact,
      contractStartDate: data.contract_start_date ? new Date(data.contract_start_date) : undefined,
      contractEndDate: data.contract_end_date ? new Date(data.contract_end_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteEmployee(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // Currency Operations
  async getCurrencies(): Promise<Currency[]> {
    const { data, error } = await supabase
      .from('currencies')
      .select('*')
      .eq('is_active', true);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      code: item.code,
      name: item.name,
      symbol: item.symbol,
      isActive: item.is_active,
    }));
  }

  // Category Operations
  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      color: item.color,
      isDefault: item.is_default,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
    }));
  }

  async createCategory(userId: string, categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: categoryData.name,
        type: categoryData.type,
        color: categoryData.color,
        is_default: categoryData.isDefault || false,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      color: data.color,
      isDefault: data.is_default,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
    };
  }

  async updateCategory(userId: string, id: string, updates: Partial<Category>): Promise<Category | null> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.type) updateData.type = updates.type;
    if (updates.color) updateData.color = updates.color;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      color: data.color,
      isDefault: data.is_default,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
    };
  }

  async deleteCategory(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // Transaction Operations
  async getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      type: item.type,
      amount: item.amount,
      currencyId: item.currency_id,
      categoryId: item.category_id,
      clientId: item.client_id,
      employeeId: item.employee_id,
      cashAccountId: item.cash_account_id,
      description: item.description,
      notes: item.notes,
      transactionDate: new Date(item.transaction_date),
      isVatIncluded: item.is_vat_included,
      vatRate: item.vat_rate,
      isRecurring: item.is_recurring,
      recurringPeriod: item.recurring_period,
      nextRecurringDate: item.next_recurring_date ? new Date(item.next_recurring_date) : undefined,
      parentTransactionId: item.parent_transaction_id,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  async createTransaction(userId: string, transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        type: transactionData.type,
        amount: transactionData.amount,
        currency_id: transactionData.currencyId,
        category_id: transactionData.categoryId,
        client_id: transactionData.clientId,
        employee_id: transactionData.employeeId,
        cash_account_id: transactionData.cashAccountId,
        description: transactionData.description,
        notes: transactionData.notes,
        transaction_date: transactionData.transactionDate.toISOString(),
        is_vat_included: transactionData.isVatIncluded || false,
        vat_rate: transactionData.vatRate || 0,
        is_recurring: transactionData.isRecurring || false,
        recurring_period: transactionData.recurringPeriod,
        next_recurring_date: transactionData.nextRecurringDate?.toISOString(),
        parent_transaction_id: transactionData.parentTransactionId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      type: data.type,
      amount: data.amount,
      currencyId: data.currency_id,
      categoryId: data.category_id,
      clientId: data.client_id,
      employeeId: data.employee_id,
      cashAccountId: data.cash_account_id,
      description: data.description,
      notes: data.notes,
      transactionDate: new Date(data.transaction_date),
      isVatIncluded: data.is_vat_included,
      vatRate: data.vat_rate,
      isRecurring: data.is_recurring,
      recurringPeriod: data.recurring_period,
      nextRecurringDate: data.next_recurring_date ? new Date(data.next_recurring_date) : undefined,
      parentTransactionId: data.parent_transaction_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateTransaction(userId: string, id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const updateData: any = {};
    if (updates.type) updateData.type = updates.type;
    if (updates.amount) updateData.amount = updates.amount;
    if (updates.currencyId) updateData.currency_id = updates.currencyId;
    if (updates.categoryId) updateData.category_id = updates.categoryId;
    if (updates.clientId) updateData.client_id = updates.clientId;
    if (updates.employeeId) updateData.employee_id = updates.employeeId;
    if (updates.cashAccountId) updateData.cash_account_id = updates.cashAccountId;
    if (updates.description) updateData.description = updates.description;
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.transactionDate) updateData.transaction_date = updates.transactionDate.toISOString();
    if (updates.isVatIncluded !== undefined) updateData.is_vat_included = updates.isVatIncluded;
    if (updates.vatRate !== undefined) updateData.vat_rate = updates.vatRate;
    if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
    if (updates.recurringPeriod) updateData.recurring_period = updates.recurringPeriod;
    if (updates.nextRecurringDate) updateData.next_recurring_date = updates.nextRecurringDate.toISOString();
    if (updates.parentTransactionId) updateData.parent_transaction_id = updates.parentTransactionId;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      type: data.type,
      amount: data.amount,
      currencyId: data.currency_id,
      categoryId: data.category_id,
      clientId: data.client_id,
      employeeId: data.employee_id,
      cashAccountId: data.cash_account_id,
      description: data.description,
      notes: data.notes,
      transactionDate: new Date(data.transaction_date),
      isVatIncluded: data.is_vat_included,
      vatRate: data.vat_rate,
      isRecurring: data.is_recurring,
      recurringPeriod: data.recurring_period,
      nextRecurringDate: data.next_recurring_date ? new Date(data.next_recurring_date) : undefined,
      parentTransactionId: data.parent_transaction_id,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteTransaction(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // Company Settings Operations
  async getCompanySettings(userId: string): Promise<CompanySettings | null> {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      companyName: data.company_name,
      taxNumber: data.tax_number,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      logoUrl: data.logo_url,
      defaultCurrencyId: data.default_currency_id,
      defaultVatRate: data.default_vat_rate,
      invoicePrefix: data.invoice_prefix,
      quotePrefix: data.quote_prefix,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateCompanySettings(userId: string, updates: Partial<CompanySettings>): Promise<CompanySettings | null> {
    const updateData: any = {};
    if (updates.companyName) updateData.company_name = updates.companyName;
    if (updates.taxNumber) updateData.tax_number = updates.taxNumber;
    if (updates.address) updateData.address = updates.address;
    if (updates.phone) updateData.phone = updates.phone;
    if (updates.email) updateData.email = updates.email;
    if (updates.website) updateData.website = updates.website;
    if (updates.logoUrl) updateData.logo_url = updates.logoUrl;
    if (updates.defaultCurrencyId) updateData.default_currency_id = updates.defaultCurrencyId;
    if (updates.defaultVatRate !== undefined) updateData.default_vat_rate = updates.defaultVatRate;
    if (updates.invoicePrefix) updateData.invoice_prefix = updates.invoicePrefix;
    if (updates.quotePrefix) updateData.quote_prefix = updates.quotePrefix;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('company_settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      companyName: data.company_name,
      taxNumber: data.tax_number,
      address: data.address,
      phone: data.phone,
      email: data.email,
      website: data.website,
      logoUrl: data.logo_url,
      defaultCurrencyId: data.default_currency_id,
      defaultVatRate: data.default_vat_rate,
      invoicePrefix: data.invoice_prefix,
      quotePrefix: data.quote_prefix,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  // Helper method to get all user data
  async getUserData(userId: string) {
    const [clients, employees, transactions, categories, cashAccounts, quotes, debts, invoices, regularPayments] = await Promise.all([
      this.getClients(userId),
      this.getEmployees(userId),
      this.getTransactions(userId),
      this.getCategories(userId),
      this.getCashAccounts(userId),
      this.getQuotes(userId),
      this.getDebts(userId),
      this.getInvoices(userId),
      this.getRegularPayments(userId),
    ]);

    return {
      clients,
      employees,
      transactions,
      categories,
      cashAccounts,
      quotes,
      debts,
      invoices,
      regularPayments,
    };
  }

  // Additional methods for other entities (simplified for brevity)
  async getCashAccounts(userId: string): Promise<CashAccount[]> {
    const { data, error } = await supabase
      .from('cash_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      name: item.name,
      currencyId: item.currency_id,
      initialBalance: item.initial_balance,
      currentBalance: item.current_balance,
      isActive: item.is_active,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  async getQuotes(userId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      quoteNumber: item.quote_number,
      clientId: item.client_id,
      currencyId: item.currency_id,
      totalAmount: item.total_amount,
      vatRate: item.vat_rate,
      vatAmount: item.vat_amount,
      totalWithVat: item.total_with_vat,
      status: item.status,
      validUntil: new Date(item.valid_until),
      notes: item.notes,
      termsConditions: item.terms_conditions,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  async getDebts(userId: string): Promise<Debt[]> {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      clientId: item.client_id,
      currencyId: item.currency_id,
      amount: item.amount,
      dueDate: new Date(item.due_date),
      description: item.description,
      status: item.status,
      paymentDate: item.payment_date ? new Date(item.payment_date) : undefined,
      notes: item.notes,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  async getInvoices(userId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      invoiceNumber: item.invoice_number,
      clientId: item.client_id,
      currencyId: item.currency_id,
      totalAmount: item.total_amount,
      vatRate: item.vat_rate,
      vatAmount: item.vat_amount,
      totalWithVat: item.total_with_vat,
      status: item.status,
      issueDate: new Date(item.issue_date),
      dueDate: new Date(item.due_date),
      paymentDate: item.payment_date ? new Date(item.payment_date) : undefined,
      notes: item.notes,
      termsConditions: item.terms_conditions,
      isRecurring: item.is_recurring,
      recurringPeriod: item.recurring_period,
      nextInvoiceDate: item.next_invoice_date ? new Date(item.next_invoice_date) : undefined,
      parentInvoiceId: item.parent_invoice_id,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  async getRegularPayments(userId: string): Promise<RegularPayment[]> {
    const { data, error } = await supabase
      .from('regular_payments')
      .select('*')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      amount: item.amount,
      currencyId: item.currency_id,
      categoryId: item.category_id,
      frequency: item.frequency,
      startDate: new Date(item.start_date),
      endDate: item.end_date ? new Date(item.end_date) : undefined,
      nextPaymentDate: new Date(item.next_payment_date),
      isActive: item.is_active,
      description: item.description,
      notes: item.notes,
      userId: item.user_id,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
  }

  // Quote Operations
  async createQuote(userId: string, quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .insert({
        title: quoteData.title,
        quote_number: quoteData.quoteNumber,
        client_id: quoteData.clientId,
        currency_id: quoteData.currencyId,
        subtotal: quoteData.subtotal,
        total_amount: quoteData.totalAmount,
        vat_rate: quoteData.vatRate,
        vat_amount: quoteData.vatAmount,
        total_with_vat: quoteData.totalWithVat,
        status: quoteData.status,
        valid_until: quoteData.validUntil.toISOString(),
        notes: quoteData.notes,
        terms_conditions: quoteData.termsConditions,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      title: data.title,
      quoteNumber: data.quote_number,
      clientId: data.client_id,
      currencyId: data.currency_id,
      subtotal: data.subtotal,
      totalAmount: data.total_amount,
      vatRate: data.vat_rate,
      vatAmount: data.vat_amount,
      totalWithVat: data.total_with_vat,
      status: data.status,
      validUntil: new Date(data.valid_until),
      notes: data.notes,
      termsConditions: data.terms_conditions,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateQuote(userId: string, id: string, updates: Partial<Quote>): Promise<Quote | null> {
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.quoteNumber) updateData.quote_number = updates.quoteNumber;
    if (updates.clientId) updateData.client_id = updates.clientId;
    if (updates.currencyId) updateData.currency_id = updates.currencyId;
    if (updates.subtotal) updateData.subtotal = updates.subtotal;
    if (updates.totalAmount) updateData.total_amount = updates.totalAmount;
    if (updates.vatRate) updateData.vat_rate = updates.vatRate;
    if (updates.vatAmount) updateData.vat_amount = updates.vatAmount;
    if (updates.totalWithVat) updateData.total_with_vat = updates.totalWithVat;
    if (updates.status) updateData.status = updates.status;
    if (updates.validUntil) updateData.valid_until = updates.validUntil.toISOString();
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.termsConditions) updateData.terms_conditions = updates.termsConditions;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      quoteNumber: data.quote_number,
      clientId: data.client_id,
      currencyId: data.currency_id,
      subtotal: data.subtotal,
      totalAmount: data.total_amount,
      vatRate: data.vat_rate,
      vatAmount: data.vat_amount,
      totalWithVat: data.total_with_vat,
      status: data.status,
      validUntil: new Date(data.valid_until),
      notes: data.notes,
      termsConditions: data.terms_conditions,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteQuote(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // Debt Operations
  async createDebt(userId: string, debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    const { data, error } = await supabase
      .from('debts')
      .insert({
        title: debtData.title,
        client_id: debtData.clientId,
        currency_id: debtData.currencyId,
        amount: debtData.amount,
        type: debtData.type,
        due_date: debtData.dueDate.toISOString(),
        description: debtData.description,
        status: debtData.status,
        payment_date: debtData.paymentDate?.toISOString(),
        notes: debtData.notes,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      title: data.title,
      clientId: data.client_id,
      currencyId: data.currency_id,
      amount: data.amount,
      type: data.type,
      dueDate: new Date(data.due_date),
      description: data.description,
      status: data.status,
      paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
      notes: data.notes,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateDebt(userId: string, id: string, updates: Partial<Debt>): Promise<Debt | null> {
    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.clientId) updateData.client_id = updates.clientId;
    if (updates.currencyId) updateData.currency_id = updates.currencyId;
    if (updates.amount) updateData.amount = updates.amount;
    if (updates.type) updateData.type = updates.type;
    if (updates.dueDate) updateData.due_date = updates.dueDate.toISOString();
    if (updates.description) updateData.description = updates.description;
    if (updates.status) updateData.status = updates.status;
    if (updates.paymentDate) updateData.payment_date = updates.paymentDate.toISOString();
    if (updates.notes) updateData.notes = updates.notes;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('debts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      title: data.title,
      clientId: data.client_id,
      currencyId: data.currency_id,
      amount: data.amount,
      type: data.type,
      dueDate: new Date(data.due_date),
      description: data.description,
      status: data.status,
      paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
      notes: data.notes,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteDebt(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // Cash Account Operations
  async createCashAccount(userId: string, accountData: Omit<CashAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashAccount> {
    const { data, error } = await supabase
      .from('cash_accounts')
      .insert({
        name: accountData.name,
        currency_id: accountData.currencyId,
        initial_balance: accountData.initialBalance,
        balance: accountData.balance,
        current_balance: accountData.currentBalance,
        is_active: accountData.isActive,
        is_default: accountData.isDefault,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      name: data.name,
      currencyId: data.currency_id,
      initialBalance: data.initial_balance,
      balance: data.balance,
      currentBalance: data.current_balance,
      isActive: data.is_active,
      isDefault: data.is_default,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateCashAccount(userId: string, id: string, updates: Partial<CashAccount>): Promise<CashAccount | null> {
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.currencyId) updateData.currency_id = updates.currencyId;
    if (updates.initialBalance) updateData.initial_balance = updates.initialBalance;
    if (updates.balance) updateData.balance = updates.balance;
    if (updates.currentBalance) updateData.current_balance = updates.currentBalance;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('cash_accounts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      currencyId: data.currency_id,
      initialBalance: data.initial_balance,
      balance: data.balance,
      currentBalance: data.current_balance,
      isActive: data.is_active,
      isDefault: data.is_default,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteCashAccount(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('cash_accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }

  // Invoice Operations
  async createInvoice(userId: string, invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        description: invoiceData.description,
        invoice_number: invoiceData.invoiceNumber,
        client_id: invoiceData.clientId,
        currency_id: invoiceData.currencyId,
        subtotal: invoiceData.subtotal,
        total_amount: invoiceData.totalAmount,
        vat_rate: invoiceData.vatRate,
        vat_amount: invoiceData.vatAmount,
        total_with_vat: invoiceData.totalWithVat,
        tevkifat_applied: invoiceData.tevkifatApplied,
        tevkifat_rate: invoiceData.tevkifatRate,
        tevkifat_amount: invoiceData.tevkifatAmount,
        status: invoiceData.status,
        issue_date: invoiceData.issueDate.toISOString(),
        due_date: invoiceData.dueDate.toISOString(),
        payment_date: invoiceData.paymentDate?.toISOString(),
        notes: invoiceData.notes,
        terms_conditions: invoiceData.termsConditions,
        is_recurring: invoiceData.isRecurring,
        recurring_period: invoiceData.recurringPeriod,
        next_invoice_date: invoiceData.nextInvoiceDate?.toISOString(),
        parent_invoice_id: invoiceData.parentInvoiceId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      description: data.description,
      invoiceNumber: data.invoice_number,
      clientId: data.client_id,
      currencyId: data.currency_id,
      subtotal: data.subtotal,
      totalAmount: data.total_amount,
      vatRate: data.vat_rate,
      vatAmount: data.vat_amount,
      totalWithVat: data.total_with_vat,
      tevkifatApplied: data.tevkifat_applied,
      tevkifatRate: data.tevkifat_rate,
      tevkifatAmount: data.tevkifat_amount,
      status: data.status,
      issueDate: new Date(data.issue_date),
      dueDate: new Date(data.due_date),
      paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
      notes: data.notes,
      termsConditions: data.terms_conditions,
      isRecurring: data.is_recurring,
      recurringPeriod: data.recurring_period,
      nextInvoiceDate: data.next_invoice_date ? new Date(data.next_invoice_date) : undefined,
      parentInvoiceId: data.parent_invoice_id,
      items: data.items || [],
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateInvoice(userId: string, id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const updateData: any = {};
    if (updates.description) updateData.description = updates.description;
    if (updates.invoiceNumber) updateData.invoice_number = updates.invoiceNumber;
    if (updates.clientId) updateData.client_id = updates.clientId;
    if (updates.currencyId) updateData.currency_id = updates.currencyId;
    if (updates.subtotal) updateData.subtotal = updates.subtotal;
    if (updates.totalAmount) updateData.total_amount = updates.totalAmount;
    if (updates.vatRate) updateData.vat_rate = updates.vatRate;
    if (updates.vatAmount) updateData.vat_amount = updates.vatAmount;
    if (updates.totalWithVat) updateData.total_with_vat = updates.totalWithVat;
    if (updates.tevkifatApplied !== undefined) updateData.tevkifat_applied = updates.tevkifatApplied;
    if (updates.tevkifatRate) updateData.tevkifat_rate = updates.tevkifatRate;
    if (updates.tevkifatAmount) updateData.tevkifat_amount = updates.tevkifatAmount;
    if (updates.status) updateData.status = updates.status;
    if (updates.issueDate) updateData.issue_date = updates.issueDate.toISOString();
    if (updates.dueDate) updateData.due_date = updates.dueDate.toISOString();
    if (updates.paymentDate) updateData.payment_date = updates.paymentDate.toISOString();
    if (updates.notes) updateData.notes = updates.notes;
    if (updates.termsConditions) updateData.terms_conditions = updates.termsConditions;
    if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
    if (updates.recurringPeriod) updateData.recurring_period = updates.recurringPeriod;
    if (updates.nextInvoiceDate) updateData.next_invoice_date = updates.nextInvoiceDate.toISOString();
    if (updates.parentInvoiceId) updateData.parent_invoice_id = updates.parentInvoiceId;
    if (updates.items) updateData.items = updates.items;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      description: data.description,
      invoiceNumber: data.invoice_number,
      clientId: data.client_id,
      currencyId: data.currency_id,
      subtotal: data.subtotal,
      totalAmount: data.total_amount,
      vatRate: data.vat_rate,
      vatAmount: data.vat_amount,
      totalWithVat: data.total_with_vat,
      tevkifatApplied: data.tevkifat_applied,
      tevkifatRate: data.tevkifat_rate,
      tevkifatAmount: data.tevkifat_amount,
      status: data.status,
      issueDate: new Date(data.issue_date),
      dueDate: new Date(data.due_date),
      paymentDate: data.payment_date ? new Date(data.payment_date) : undefined,
      notes: data.notes,
      termsConditions: data.terms_conditions,
      isRecurring: data.is_recurring,
      recurringPeriod: data.recurring_period,
      nextInvoiceDate: data.next_invoice_date ? new Date(data.next_invoice_date) : undefined,
      parentInvoiceId: data.parent_invoice_id,
      items: data.items || [],
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async deleteInvoice(userId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return !error;
  }
}

export const supabaseAdapter = new SupabaseAdapter();
