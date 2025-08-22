// Calaf.co Muhasebe Sistemi - Veritabanı Şeması

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  username?: string; // Kullanıcı adı
  role?: 'admin' | 'user'; // Kullanıcı rolü
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Currency {
  id: string;
  code: string; // TRY, USD, EUR, GBP
  name: string;
  symbol: string; // ₺, $, €, £
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  contactPerson?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  currencyId: string;
  balance: number; // pozitif: alacak, negatif: borç
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  netSalary: number;
  currencyId: string;
  payrollPeriod: 'monthly' | 'weekly' | 'biweekly';
  paymentDay: number; // ayın kaçında ödeniyor
  isActive: boolean;
  userId: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  contractStartDate?: Date;
  contractEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  currencyId: string;
  categoryId: string;
  clientId?: string;
  employeeId?: string;
  cashAccountId?: string; // Kasa seçimi
  description: string;
  notes?: string; // Notlar alanı
  transactionDate: Date;
  isVatIncluded: boolean;
  vatRate: number; // 0, 8, 18 vs.
  isRecurring: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextRecurringDate?: Date;
  parentTransactionId?: string; // tekrarlanan işlemlerin ana ID'si
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bonus {
  id: string;
  employeeId: string;
  type: 'bonus' | 'advance' | 'overtime' | 'commission';
  amount: number;
  currencyId: string;
  description: string;
  paymentDate: Date;
  userId: string;
  createdAt: Date;
}

export interface Quote {
  id: string;
  clientId: string;
  quoteNumber: string;
  title: string;
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  vatAmount: number;
  total: number;
  currencyId: string;
  notes?: string;
  termsAndConditions?: string;
  // Tevkifat alanları
  tevkifatApplied?: boolean;
  tevkifatRate?: string; // "9/10", "7/10", etc.
  tevkifatAmount?: number;
  netAmountAfterTevkifat?: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
  order: number;
}

export interface Debt {
  id: string;
  clientId?: string;
  title: string;
  amount: number;
  currencyId: string;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue';
  type: 'payable' | 'receivable'; // ödenecek / alınacak
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string; // Computed field
  issueDate: Date;
  dueDate: Date;
  description: string;
  items: InvoiceItem[];
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  tevkifatApplied: boolean;
  tevkifatRate?: string; // "7/10", "9/10", etc.
  tevkifatAmount: number;
  total: number;
  netAmountAfterTevkifat: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes?: string;
  
  // Tekrarlama özellikleri
  isRecurring: boolean;
  recurringPeriod?: 'monthly' | 'quarterly' | 'yearly';
  recurringMonths?: number; // Kaç ay tekrarlanacak
  parentInvoiceId?: string; // Ana fatura ID'si (tekrarlanan faturalar için)
  recurringIndex?: number; // Tekrarlama sırası (1, 2, 3...)
  
  // Ödeme durumu
  paidAmount: number;
  remainingAmount: number;
  paymentDate?: Date;
  
  currencyId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PendingBalance {
  id: string;
  clientId: string;
  invoiceId: string;
  amount: number;
  dueDate: Date;
  description: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: Date;
}

// Krediler ve Düzenli Ödemeler
export interface RegularPayment {
  id: string;
  title: string;
  amount: number;
  currencyId: string;
  dueDate: Date; // bir sonraki vade
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  category: 'loan' | 'installment' | 'rent' | 'utilities' | 'food' | 'insurance' | 'other';
  status: 'pending' | 'paid';
  description?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rapor için yardımcı tipler
export interface DashboardData {
  thisMonthRevenue: number;
  upcomingPayables: Debt[];
  upcomingReceivables: Debt[];
  creditDebts: Debt[];
  upcomingSalaryPayments: Employee[];
  last30DaysIncomeExpense: {
    income: number;
    expense: number;
    transactions: Transaction[];
  };
}

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
  categoryIds?: string[];
  clientIds?: string[];
  currencyId?: string;
  type?: 'income' | 'expense' | 'both';
}

export interface CompanySettings {
  id: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  taxNumber?: string;
  lightModeLogo?: string; // base64 encoded image
  darkModeLogo?: string; // base64 encoded image
  quoteLogo?: string; // base64 encoded image for quotes
  tevkifatRates?: TevkifatRate[]; // Tevkifat oranları
  createdAt: Date;
  updatedAt: Date;
}

export interface TevkifatRate {
  id: string;
  code: string; // "9/10", "7/10", etc.
  numerator: number; // 9, 7, etc.
  denominator: number; // 10, 10, etc.
  description: string; // "Mimarlık ve Mühendislik Hizmetleri"
  isActive: boolean;
}

export interface CashAccount {
  id: string;
  name: string;
  currencyId: string;
  balance: number;
  isDefault: boolean; // Ana kasa
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Bildirimler
export interface AppNotification {
  id: string; // stable key (örn: type-entityId-date)
  type: 'receivable_due' | 'payable_due' | 'regular_payment_due' | 'quote_followup';
  title: string;
  description?: string;
  link?: string; // tıklanınca gidilecek sayfa
  date: Date; // beklenen olay tarihi (vade vb.)
  createdAt: Date;
  read: boolean;
}

export interface NotificationPreferences {
  enableNotifications: boolean;
  enableSound: boolean;
  enableNative: boolean;
}
