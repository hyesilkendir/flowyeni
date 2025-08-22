/**
 * Vercel KV Storage Adapter
 * MySQL yerine Redis tabanlı Vercel KV kullanır
 */

import { kv } from '@vercel/kv';
import type { 
  User, 
  Client, 
  Employee, 
  Transaction, 
  Category, 
  Currency, 
  Quote, 
  Debt,
  Bonus,
  CompanySettings,
  CashAccount,
  Invoice,
  PendingBalance,
  RegularPayment,
  AppNotification,
  NotificationPreferences
} from './database-schema';

export class VercelKVAdapter {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // User Operations
  async getUser(identifier: string): Promise<User | null> {
    // Username veya email ile kullanıcı arama
    const users = await kv.get<User[]>('users') || [];
    return users.find(u => u.username === identifier || u.email === identifier) || null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const users = await kv.get<User[]>('users') || [];
    
    // Duplicate check
    const exists = users.some(u => u.username === userData.username || u.email === userData.email);
    if (exists) {
      throw new Error('User already exists');
    }

    const newUser: User = {
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(newUser);
    await kv.set('users', users);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const users = await kv.get<User[]>('users') || [];
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates, updatedAt: new Date() };
    await kv.set('users', users);
    return users[index];
  }

  // Client Operations
  async getClients(userId: string): Promise<Client[]> {
    const clients = await kv.get<Client[]>(`clients:${userId}`) || [];
    return clients;
  }

  async createClient(userId: string, clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> {
    const clients = await this.getClients(userId);
    
    const newClient: Client = {
      ...clientData,
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    clients.push(newClient);
    await kv.set(`clients:${userId}`, clients);
    return newClient;
  }

  async updateClient(userId: string, id: string, updates: Partial<Client>): Promise<Client | null> {
    const clients = await this.getClients(userId);
    const index = clients.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    clients[index] = { ...clients[index], ...updates, updatedAt: new Date() };
    await kv.set(`clients:${userId}`, clients);
    return clients[index];
  }

  async deleteClient(userId: string, id: string): Promise<boolean> {
    const clients = await this.getClients(userId);
    const filtered = clients.filter(c => c.id !== id);
    
    if (filtered.length === clients.length) return false;
    
    await kv.set(`clients:${userId}`, filtered);
    return true;
  }

  // Employee Operations
  async getEmployees(userId: string): Promise<Employee[]> {
    return await kv.get<Employee[]>(`employees:${userId}`) || [];
  }

  async createEmployee(userId: string, employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> {
    const employees = await this.getEmployees(userId);
    
    const newEmployee: Employee = {
      ...employeeData,
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    employees.push(newEmployee);
    await kv.set(`employees:${userId}`, employees);
    return newEmployee;
  }

  async updateEmployee(userId: string, id: string, updates: Partial<Employee>): Promise<Employee | null> {
    const employees = await this.getEmployees(userId);
    const index = employees.findIndex(e => e.id === id);
    
    if (index === -1) return null;
    
    employees[index] = { ...employees[index], ...updates, updatedAt: new Date() };
    await kv.set(`employees:${userId}`, employees);
    return employees[index];
  }

  async deleteEmployee(userId: string, id: string): Promise<boolean> {
    const employees = await this.getEmployees(userId);
    const filtered = employees.filter(e => e.id !== id);
    
    if (filtered.length === employees.length) return false;
    
    await kv.set(`employees:${userId}`, filtered);
    return true;
  }

  // Transaction Operations
  async getTransactions(userId: string): Promise<Transaction[]> {
    return await kv.get<Transaction[]>(`transactions:${userId}`) || [];
  }

  async createTransaction(userId: string, transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const transactions = await this.getTransactions(userId);
    
    const newTransaction: Transaction = {
      ...transactionData,
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    transactions.push(newTransaction);
    await kv.set(`transactions:${userId}`, transactions);
    return newTransaction;
  }

  async updateTransaction(userId: string, id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const transactions = await this.getTransactions(userId);
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    transactions[index] = { ...transactions[index], ...updates, updatedAt: new Date() };
    await kv.set(`transactions:${userId}`, transactions);
    return transactions[index];
  }

  async deleteTransaction(userId: string, id: string): Promise<boolean> {
    const transactions = await this.getTransactions(userId);
    const filtered = transactions.filter(t => t.id !== id);
    
    if (filtered.length === transactions.length) return false;
    
    await kv.set(`transactions:${userId}`, filtered);
    return true;
  }

  // Category Operations
  async getCategories(userId: string): Promise<Category[]> {
    const userCategories = await kv.get<Category[]>(`categories:${userId}`) || [];
    const defaultCategories = await this.getDefaultCategories();
    return [...defaultCategories, ...userCategories];
  }

  async createCategory(userId: string, categoryData: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const categories = await kv.get<Category[]>(`categories:${userId}`) || [];
    
    const newCategory: Category = {
      ...categoryData,
      id: this.generateId(),
      userId,
      createdAt: new Date(),
    };

    categories.push(newCategory);
    await kv.set(`categories:${userId}`, categories);
    return newCategory;
  }

  async updateCategory(userId: string, id: string, updates: Partial<Category>): Promise<Category | null> {
    const categories = await kv.get<Category[]>(`categories:${userId}`) || [];
    const index = categories.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    categories[index] = { ...categories[index], ...updates };
    await kv.set(`categories:${userId}`, categories);
    return categories[index];
  }

  async deleteCategory(userId: string, id: string): Promise<boolean> {
    const categories = await kv.get<Category[]>(`categories:${userId}`) || [];
    const filtered = categories.filter(c => c.id !== id);
    
    if (filtered.length === categories.length) return false;
    
    await kv.set(`categories:${userId}`, filtered);
    return true;
  }

  // Quote Operations
  async getQuotes(userId: string): Promise<Quote[]> {
    return await kv.get<Quote[]>(`quotes:${userId}`) || [];
  }

  async createQuote(userId: string, quoteData: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote> {
    const quotes = await this.getQuotes(userId);
    
    const newQuote: Quote = {
      ...quoteData,
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    quotes.push(newQuote);
    await kv.set(`quotes:${userId}`, quotes);
    return newQuote;
  }

  async updateQuote(userId: string, id: string, updates: Partial<Quote>): Promise<Quote | null> {
    const quotes = await this.getQuotes(userId);
    const index = quotes.findIndex(q => q.id === id);
    
    if (index === -1) return null;
    
    quotes[index] = { ...quotes[index], ...updates, updatedAt: new Date() };
    await kv.set(`quotes:${userId}`, quotes);
    return quotes[index];
  }

  async deleteQuote(userId: string, id: string): Promise<boolean> {
    const quotes = await this.getQuotes(userId);
    const filtered = quotes.filter(q => q.id !== id);
    
    if (filtered.length === quotes.length) return false;
    
    await kv.set(`quotes:${userId}`, filtered);
    return true;
  }

  // Invoice Operations
  async getInvoices(userId: string): Promise<Invoice[]> {
    return await kv.get<Invoice[]>(`invoices:${userId}`) || [];
  }

  async createInvoice(userId: string, invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoices = await this.getInvoices(userId);
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    invoices.push(newInvoice);
    await kv.set(`invoices:${userId}`, invoices);
    return newInvoice;
  }

  async updateInvoice(userId: string, id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    const invoices = await this.getInvoices(userId);
    const index = invoices.findIndex(i => i.id === id);
    
    if (index === -1) return null;
    
    invoices[index] = { ...invoices[index], ...updates, updatedAt: new Date() };
    await kv.set(`invoices:${userId}`, invoices);
    return invoices[index];
  }

  async deleteInvoice(userId: string, id: string): Promise<boolean> {
    const invoices = await this.getInvoices(userId);
    const filtered = invoices.filter(i => i.id !== id);
    
    if (filtered.length === invoices.length) return false;
    
    await kv.set(`invoices:${userId}`, filtered);
    return true;
  }

  // Debt Operations
  async getDebts(userId: string): Promise<Debt[]> {
    return await kv.get<Debt[]>(`debts:${userId}`) || [];
  }

  async createDebt(userId: string, debtData: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Debt> {
    const debts = await this.getDebts(userId);
    
    const newDebt: Debt = {
      ...debtData,
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    debts.push(newDebt);
    await kv.set(`debts:${userId}`, debts);
    return newDebt;
  }

  async updateDebt(userId: string, id: string, updates: Partial<Debt>): Promise<Debt | null> {
    const debts = await this.getDebts(userId);
    const index = debts.findIndex(d => d.id === id);
    
    if (index === -1) return null;
    
    debts[index] = { ...debts[index], ...updates, updatedAt: new Date() };
    await kv.set(`debts:${userId}`, debts);
    return debts[index];
  }

  async deleteDebt(userId: string, id: string): Promise<boolean> {
    const debts = await this.getDebts(userId);
    const filtered = debts.filter(d => d.id !== id);
    
    if (filtered.length === debts.length) return false;
    
    await kv.set(`debts:${userId}`, filtered);
    return true;
  }

  // Cash Account Operations
  async getCashAccounts(userId: string): Promise<CashAccount[]> {
    return await kv.get<CashAccount[]>(`cashAccounts:${userId}`) || [];
  }

  async createCashAccount(userId: string, accountData: Omit<CashAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<CashAccount> {
    const accounts = await this.getCashAccounts(userId);
    
    const newAccount: CashAccount = {
      ...accountData,
      id: this.generateId(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    accounts.push(newAccount);
    await kv.set(`cashAccounts:${userId}`, accounts);
    return newAccount;
  }

  async updateCashAccount(userId: string, id: string, updates: Partial<CashAccount>): Promise<CashAccount | null> {
    const accounts = await this.getCashAccounts(userId);
    const index = accounts.findIndex(a => a.id === id);
    
    if (index === -1) return null;
    
    accounts[index] = { ...accounts[index], ...updates, updatedAt: new Date() };
    await kv.set(`cashAccounts:${userId}`, accounts);
    return accounts[index];
  }

  async deleteCashAccount(userId: string, id: string): Promise<boolean> {
    const accounts = await this.getCashAccounts(userId);
    const filtered = accounts.filter(a => a.id !== id);
    
    if (filtered.length === accounts.length) return false;
    
    await kv.set(`cashAccounts:${userId}`, filtered);
    return true;
  }

  // Global data (currencies, company settings)
  async getCurrencies(): Promise<Currency[]> {
    const currencies = await kv.get<Currency[]>('currencies');
    if (!currencies) {
      const defaultCurrencies: Currency[] = [
        { id: '1', code: 'TRY', name: 'Türk Lirası', symbol: '₺', isActive: true },
        { id: '2', code: 'USD', name: 'US Dollar', symbol: '$', isActive: true },
        { id: '3', code: 'EUR', name: 'Euro', symbol: '€', isActive: true },
        { id: '4', code: 'GBP', name: 'British Pound', symbol: '£', isActive: true },
      ];
      await kv.set('currencies', defaultCurrencies);
      return defaultCurrencies;
    }
    return currencies;
  }

  async getCompanySettings(): Promise<CompanySettings> {
    const settings = await kv.get<CompanySettings>('companySettings');
    if (!settings) {
      const defaultSettings: CompanySettings = {
        id: '1',
        companyName: 'CALAF.CO',
        address: 'İstanbul, Türkiye',
        phone: '+90 212 555 0000',
        email: 'info@calaf.co',
        website: 'www.calaf.co',
        taxNumber: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await kv.set('companySettings', defaultSettings);
      return defaultSettings;
    }
    return settings;
  }

  async updateCompanySettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    const current = await this.getCompanySettings();
    const updated = { ...current, ...updates, updatedAt: new Date() };
    await kv.set('companySettings', updated);
    return updated;
  }

  private async getDefaultCategories(): Promise<Category[]> {
    return [
      { id: '1', name: 'Ofis Giderleri', type: 'expense', color: '#ef4444', isDefault: true, userId: 'system', createdAt: new Date() },
      { id: '2', name: 'Pazarlama', type: 'expense', color: '#f97316', isDefault: true, userId: 'system', createdAt: new Date() },
      { id: '3', name: 'Teknoloji', type: 'expense', color: '#8b5cf6', isDefault: true, userId: 'system', createdAt: new Date() },
      { id: '4', name: 'Maaş Ödemeleri', type: 'expense', color: '#06b6d4', isDefault: true, userId: 'system', createdAt: new Date() },
      { id: '5', name: 'Müşteri Ödemeleri', type: 'income', color: '#22c55e', isDefault: true, userId: 'system', createdAt: new Date() },
      { id: '6', name: 'Diğer Gelirler', type: 'income', color: '#84cc16', isDefault: true, userId: 'system', createdAt: new Date() },
    ];
  }

  // Bulk operations for better performance
  async getUserData(userId: string): Promise<{
    clients: Client[];
    employees: Employee[];
    transactions: Transaction[];
    categories: Category[];
    quotes: Quote[];
    debts: Debt[];
    invoices: Invoice[];
    cashAccounts: CashAccount[];
  }> {
    const [
      clients,
      employees, 
      transactions,
      categories,
      quotes,
      debts,
      invoices,
      cashAccounts
    ] = await Promise.all([
      this.getClients(userId),
      this.getEmployees(userId),
      this.getTransactions(userId),
      this.getCategories(userId),
      this.getQuotes(userId),
      this.getDebts(userId),
      this.getInvoices(userId),
      this.getCashAccounts(userId),
    ]);

    return {
      clients,
      employees,
      transactions,
      categories,
      quotes,
      debts,
      invoices,
      cashAccounts,
    };
  }

  // Data export for backup
  async exportUserData(userId: string): Promise<string> {
    const userData = await this.getUserData(userId);
    return JSON.stringify(userData, null, 2);
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      await kv.set('ping', 'pong');
      const result = await kv.get('ping');
      return result === 'pong';
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const kvAdapter = new VercelKVAdapter();
