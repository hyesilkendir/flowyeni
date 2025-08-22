import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { kvAdapter } from './vercel-kv-adapter';
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
  AppNotification,
  NotificationPreferences
} from './database-schema';

interface AppState {
  // Kullanıcı durumu
  isAuthenticated: boolean;
  user: User | null;
  
  // Veriler (cache)
  clients: Client[];
  employees: Employee[];
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  quotes: Quote[];
  debts: Debt[];
  cashAccounts: CashAccount[];
  invoices: Invoice[];
  notifications: AppNotification[];
  notificationPrefs: NotificationPreferences;
  
  // Ayarlar
  companySettings: CompanySettings | null;
  
  // UI durumu
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  showAmounts: boolean;
  
  // Error handling
  error: string | null;
  loading: boolean;
  
  // Actions
  login: (username: string, password: string) => Promise<boolean>;
  register: (userData: { username: string; email: string; password: string; name: string; companyName: string }) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  setAuth: (user: User) => void;
  logout: () => void;
  loadUserData: () => Promise<void>;
  
  // UI actions
  setTheme: (theme: 'light' | 'dark') => void;
  setSidebarOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  toggleShowAmounts: () => void;
  
  // Client actions
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  
  // Employee actions
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<Employee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  
  // Transaction actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id' | 'createdAt' | 'userId'>) => Promise<void>;
  updateCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  // Quote actions
  addQuote: (quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  
  // Debt actions
  addDebt: (debt: Omit<Debt, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Cash account actions
  addCashAccount: (account: Omit<CashAccount, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateCashAccount: (id: string, account: Partial<CashAccount>) => Promise<void>;
  deleteCashAccount: (id: string) => Promise<void>;
  
  // Invoice actions
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  
  // Company settings
  updateCompanySettings: (data: Partial<CompanySettings>) => Promise<void>;
  
  // Helper functions
  getClientBalance: (clientId: string, currencyId?: string) => number;
  
  // Demo data loader
  initDemoData: () => Promise<void>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      clients: [],
      employees: [],
      transactions: [],
      categories: [],
      currencies: [],
      quotes: [],
      debts: [],
      cashAccounts: [],
      invoices: [],
      notifications: [],
      notificationPrefs: {
        enableNotifications: true,
        enableSound: true,
        enableNative: false,
      },
      companySettings: null,
      theme: 'light',
      sidebarOpen: true,
      showAmounts: false,
      error: null,
      loading: false,
      
      // Auth actions
      login: async (username, password) => {
        get().setLoading(true);
        try {
          const user = await kvAdapter.getUser(username);
          
          if (user && user.password === password) {
            set({ user, isAuthenticated: true });
            await get().loadUserData();
            return true;
          }
          
          // Default admin fallback
          if ((username === 'admin' || username === 'admin@calaf.co') && password === 'admin123') {
            try {
              const adminUser = await kvAdapter.createUser({
                username: 'admin',
                email: 'admin@calaf.co',
                password: 'admin123',
                name: 'Admin User',
                companyName: 'CALAF.CO',
              });
              
              set({ user: adminUser, isAuthenticated: true });
              await get().loadUserData();
              return true;
            } catch (error) {
              // User already exists, try to get it
              const existingUser = await kvAdapter.getUser('admin');
              if (existingUser) {
                set({ user: existingUser, isAuthenticated: true });
                await get().loadUserData();
                return true;
              }
            }
          }
          
          get().setError('Kullanıcı adı veya şifre hatalı.');
          return false;
        } catch (err) {
          console.error('Login error:', err);
          get().setError('Giriş yapılırken bir hata oluştu.');
          return false;
        } finally {
          get().setLoading(false);
        }
      },
      
      register: async (userData) => {
        get().setLoading(true);
        try {
          const newUser = await kvAdapter.createUser(userData);
          set({ user: newUser, isAuthenticated: true });
          await get().loadUserData();
          return true;
        } catch (err) {
          console.error('Register error:', err);
          get().setError('Kayıt olurken bir hata oluştu. Kullanıcı adı veya e-posta zaten kullanımda olabilir.');
          return false;
        } finally {
          get().setLoading(false);
        }
      },
      
      changePassword: async (currentPassword: string, newPassword: string) => {
        get().setLoading(true);
        try {
          const currentUser = get().user;
          if (!currentUser) {
            get().setError('Kullanıcı girişi yapılmamış.');
            return false;
          }

          if (currentUser.password !== currentPassword) {
            get().setError('Mevcut şifre yanlış.');
            return false;
          }

          if (newPassword.length < 6) {
            get().setError('Yeni şifre en az 6 karakter olmalıdır.');
            return false;
          }

          const updatedUser = await kvAdapter.updateUser(currentUser.id, { password: newPassword });
          if (updatedUser) {
            set({ user: updatedUser });
            get().setError(null);
            
            // Şifre değişikliği sonrası otomatik logout
            setTimeout(() => {
              get().logout();
            }, 1000);
            
            return true;
          }
          
          get().setError('Şifre güncellenirken bir hata oluştu.');
          return false;
        } catch (err) {
          console.error('Change password error:', err);
          get().setError('Şifre değiştirirken bir hata oluştu.');
          return false;
        } finally {
          get().setLoading(false);
        }
      },
      
      setAuth: (user) => set({ isAuthenticated: true, user }),
      logout: () => set({ isAuthenticated: false, user: null, clients: [], employees: [], transactions: [], quotes: [], debts: [], cashAccounts: [], invoices: [] }),
      
      loadUserData: async () => {
        const user = get().user;
        if (!user) return;
        
        try {
          get().setLoading(true);
          
          const [userData, currencies, companySettings] = await Promise.all([
            kvAdapter.getUserData(user.id),
            kvAdapter.getCurrencies(),
            kvAdapter.getCompanySettings(),
          ]);
          
          set({
            ...userData,
            currencies,
            companySettings,
          });
        } catch (error) {
          console.error('Load user data error:', error);
          get().setError('Veriler yüklenirken bir hata oluştu.');
        } finally {
          get().setLoading(false);
        }
      },
      
      // UI actions
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ loading }),
      toggleShowAmounts: () => set((state) => ({ showAmounts: !state.showAmounts })),
      
      // Client actions
      addClient: async (clientData) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const client = await kvAdapter.createClient(user.id, clientData);
          set((state) => ({ clients: [...state.clients, client] }));
        } catch (err) {
          console.error('Add client error:', err);
          get().setError('Cari eklenirken bir hata oluştu.');
        }
      },
      
      updateClient: async (id, updates) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const updatedClient = await kvAdapter.updateClient(user.id, id, updates);
          if (updatedClient) {
            set((state) => ({
              clients: state.clients.map((client) =>
                client.id === id ? updatedClient : client
              ),
            }));
          }
        } catch (err) {
          console.error('Update client error:', err);
          get().setError('Cari güncellenirken bir hata oluştu.');
        }
      },
      
      deleteClient: async (id) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const success = await kvAdapter.deleteClient(user.id, id);
          if (success) {
            set((state) => ({
              clients: state.clients.filter((client) => client.id !== id),
            }));
          }
        } catch (err) {
          console.error('Delete client error:', err);
          get().setError('Cari silinirken bir hata oluştu.');
        }
      },
      
      // Employee actions
      addEmployee: async (employeeData) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const employee = await kvAdapter.createEmployee(user.id, employeeData);
          set((state) => ({ employees: [...state.employees, employee] }));
        } catch (err) {
          console.error('Add employee error:', err);
          get().setError('Personel eklenirken bir hata oluştu.');
        }
      },
      
      updateEmployee: async (id, updates) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const updatedEmployee = await kvAdapter.updateEmployee(user.id, id, updates);
          if (updatedEmployee) {
            set((state) => ({
              employees: state.employees.map((employee) =>
                employee.id === id ? updatedEmployee : employee
              ),
            }));
          }
        } catch (err) {
          console.error('Update employee error:', err);
          get().setError('Personel güncellenirken bir hata oluştu.');
        }
      },
      
      deleteEmployee: async (id) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const success = await kvAdapter.deleteEmployee(user.id, id);
          if (success) {
            set((state) => ({
              employees: state.employees.filter((employee) => employee.id !== id),
            }));
          }
        } catch (err) {
          console.error('Delete employee error:', err);
          get().setError('Personel silinirken bir hata oluştu.');
        }
      },
      
      // Transaction actions
      addTransaction: async (transactionData) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const transaction = await kvAdapter.createTransaction(user.id, transactionData);
          set((state) => ({ transactions: [...state.transactions, transaction] }));
        } catch (err) {
          console.error('Add transaction error:', err);
          get().setError('İşlem eklenirken bir hata oluştu.');
        }
      },
      
      updateTransaction: async (id, updates) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const updatedTransaction = await kvAdapter.updateTransaction(user.id, id, updates);
          if (updatedTransaction) {
            set((state) => ({
              transactions: state.transactions.map((transaction) =>
                transaction.id === id ? updatedTransaction : transaction
              ),
            }));
          }
        } catch (err) {
          console.error('Update transaction error:', err);
          get().setError('İşlem güncellenirken bir hata oluştu.');
        }
      },
      
      deleteTransaction: async (id) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const success = await kvAdapter.deleteTransaction(user.id, id);
          if (success) {
            set((state) => ({
              transactions: state.transactions.filter((transaction) => transaction.id !== id),
            }));
          }
        } catch (err) {
          console.error('Delete transaction error:', err);
          get().setError('İşlem silinirken bir hata oluştu.');
        }
      },
      
      // Category actions
      addCategory: async (categoryData) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const category = await kvAdapter.createCategory(user.id, categoryData);
          set((state) => ({ categories: [...state.categories, category] }));
        } catch (err) {
          console.error('Add category error:', err);
          get().setError('Kategori eklenirken bir hata oluştu.');
        }
      },
      
      updateCategory: async (id, updates) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const updatedCategory = await kvAdapter.updateCategory(user.id, id, updates);
          if (updatedCategory) {
            set((state) => ({
              categories: state.categories.map((category) =>
                category.id === id ? updatedCategory : category
              ),
            }));
          }
        } catch (err) {
          console.error('Update category error:', err);
          get().setError('Kategori güncellenirken bir hata oluştu.');
        }
      },
      
      deleteCategory: async (id) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const success = await kvAdapter.deleteCategory(user.id, id);
          if (success) {
            set((state) => ({
              categories: state.categories.filter((category) => category.id !== id),
            }));
          }
        } catch (err) {
          console.error('Delete category error:', err);
          get().setError('Kategori silinirken bir hata oluştu.');
        }
      },
      
      // Quote actions
      addQuote: async (quoteData) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const quote = await kvAdapter.createQuote(user.id, quoteData);
          set((state) => ({ quotes: [...state.quotes, quote] }));
        } catch (err) {
          console.error('Add quote error:', err);
          get().setError('Teklif eklenirken bir hata oluştu.');
        }
      },
      
      updateQuote: async (id, updates) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const updatedQuote = await kvAdapter.updateQuote(user.id, id, updates);
          if (updatedQuote) {
            set((state) => ({
              quotes: state.quotes.map((quote) =>
                quote.id === id ? updatedQuote : quote
              ),
            }));
          }
        } catch (err) {
          console.error('Update quote error:', err);
          get().setError('Teklif güncellenirken bir hata oluştu.');
        }
      },
      
      deleteQuote: async (id) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const success = await kvAdapter.deleteQuote(user.id, id);
          if (success) {
            set((state) => ({
              quotes: state.quotes.filter((quote) => quote.id !== id),
            }));
          }
        } catch (err) {
          console.error('Delete quote error:', err);
          get().setError('Teklif silinirken bir hata oluştu.');
        }
      },
      
      // Debt actions
      addDebt: async (debtData) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const debt = await kvAdapter.createDebt(user.id, debtData);
          set((state) => ({ debts: [...state.debts, debt] }));
        } catch (err) {
          console.error('Add debt error:', err);
          get().setError('Borç eklenirken bir hata oluştu.');
        }
      },
      
      updateDebt: async (id, updates) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const updatedDebt = await kvAdapter.updateDebt(user.id, id, updates);
          if (updatedDebt) {
            set((state) => ({
              debts: state.debts.map((debt) =>
                debt.id === id ? updatedDebt : debt
              ),
            }));
          }
        } catch (err) {
          console.error('Update debt error:', err);
          get().setError('Borç güncellenirken bir hata oluştu.');
        }
      },
      
      deleteDebt: async (id) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const success = await kvAdapter.deleteDebt(user.id, id);
          if (success) {
            set((state) => ({
              debts: state.debts.filter((debt) => debt.id !== id),
            }));
          }
        } catch (err) {
          console.error('Delete debt error:', err);
          get().setError('Borç silinirken bir hata oluştu.');
        }
      },
      
      // Cash account actions
      addCashAccount: async (accountData) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const account = await kvAdapter.createCashAccount(user.id, accountData);
          set((state) => ({ cashAccounts: [...state.cashAccounts, account] }));
        } catch (err) {
          console.error('Add cash account error:', err);
          get().setError('Kasa hesabı eklenirken bir hata oluştu.');
        }
      },
      
      updateCashAccount: async (id, updates) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const updatedAccount = await kvAdapter.updateCashAccount(user.id, id, updates);
          if (updatedAccount) {
            set((state) => ({
              cashAccounts: state.cashAccounts.map((account) =>
                account.id === id ? updatedAccount : account
              ),
            }));
          }
        } catch (err) {
          console.error('Update cash account error:', err);
          get().setError('Kasa hesabı güncellenirken bir hata oluştu.');
        }
      },
      
      deleteCashAccount: async (id) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const success = await kvAdapter.deleteCashAccount(user.id, id);
          if (success) {
            set((state) => ({
              cashAccounts: state.cashAccounts.filter((account) => account.id !== id),
            }));
          }
        } catch (err) {
          console.error('Delete cash account error:', err);
          get().setError('Kasa hesabı silinirken bir hata oluştu.');
        }
      },
      
      // Invoice actions
      addInvoice: async (invoiceData) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const invoice = await kvAdapter.createInvoice(user.id, invoiceData);
          set((state) => ({ invoices: [...state.invoices, invoice] }));
        } catch (err) {
          console.error('Add invoice error:', err);
          get().setError('Fatura eklenirken bir hata oluştu.');
        }
      },
      
      updateInvoice: async (id, updates) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const updatedInvoice = await kvAdapter.updateInvoice(user.id, id, updates);
          if (updatedInvoice) {
            set((state) => ({
              invoices: state.invoices.map((invoice) =>
                invoice.id === id ? updatedInvoice : invoice
              ),
            }));
          }
        } catch (err) {
          console.error('Update invoice error:', err);
          get().setError('Fatura güncellenirken bir hata oluştu.');
        }
      },
      
      deleteInvoice: async (id) => {
        const user = get().user;
        if (!user) return;
        
        try {
          const success = await kvAdapter.deleteInvoice(user.id, id);
          if (success) {
            set((state) => ({
              invoices: state.invoices.filter((invoice) => invoice.id !== id),
            }));
          }
        } catch (err) {
          console.error('Delete invoice error:', err);
          get().setError('Fatura silinirken bir hata oluştu.');
        }
      },
      
      // Company settings
      updateCompanySettings: async (data) => {
        try {
          const updated = await kvAdapter.updateCompanySettings(data);
          set({ companySettings: updated });
        } catch (err) {
          console.error('Update company settings error:', err);
          get().setError('Firma ayarları güncellenirken bir hata oluştu.');
        }
      },
      
      // Helper functions
      getClientBalance: (clientId: string, currencyId?: string) => {
        const clientTransactions = get().transactions.filter((t: Transaction) => t.clientId === clientId);
        
        if (currencyId) {
          return clientTransactions
            .filter((t: Transaction) => t.currencyId === currencyId)
            .reduce((balance: number, transaction: Transaction) => {
              if (transaction.type === 'income') {
                return balance + transaction.amount;
              } else {
                return balance - transaction.amount;
              }
            }, 0);
        } else {
          return clientTransactions.reduce((balance: number, transaction: Transaction) => {
            if (transaction.type === 'income') {
              return balance + transaction.amount;
            } else {
              return balance - transaction.amount;
            }
          }, 0);
        }
      },
      
      // Demo data
      initDemoData: async () => {
        try {
          // Default admin user is created during login
          console.log('Demo data initialization...');
        } catch (err) {
          console.error('Init demo data error:', err);
          get().setError('Demo veriler yüklenirken bir hata oluştu.');
        }
      },
    })
  )
);
