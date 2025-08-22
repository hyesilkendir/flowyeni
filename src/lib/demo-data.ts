import { useAppStore } from './store';
import { addDays } from 'date-fns';

export const createDemoData = () => {
  const store = useAppStore.getState();

  // Demo Client
  const demoClient = {
    name: 'ABC Teknoloji Ltd. Şti.',
    email: 'info@abcteknoloji.com',
    phone: '+90 212 555 1234',
    address: 'Maslak Mahallesi, Büyükdere Cad. No:123 Şişli/İstanbul',
    taxNumber: '1234567890',
    contactPerson: 'Ahmet Yılmaz',
    contractStartDate: new Date(),
    contractEndDate: addDays(new Date(), 365),
    currencyId: '1',
    balance: 0,
    isActive: true,
    userId: '1',
  };

  // Demo Employee
  const demoEmployee = {
    name: 'Mehmet Özkan',
    position: 'Grafik Tasarımcı',
    netSalary: 15000,
    currencyId: '1',
    payrollPeriod: 'monthly' as const,
    paymentDay: 5,
    isActive: true,
    userId: '1',
  };

  // Demo Quote (Normal)
  const demoQuote = {
    clientId: '', // Will be set after client creation
    quoteNumber: 'TKL-20241208-001',
    title: 'Kurumsal Web Sitesi Tasarım ve Geliştirme Projesi',
    validUntil: addDays(new Date(), 30),
    status: 'sent' as const,
    subtotal: 25000,
    vatAmount: 4500,
    total: 29500,
    currencyId: '1',
    notes: 'Proje 3 hafta içinde tamamlanacaktır. Hosting ve domain dahil değildir.',
    termsAndConditions: `• Bu teklif {{validUntil}} tarihine kadar geçerlidir.
• Proje başlangıcında %50 avans, teslimde %50 bakiye ödemesi yapılacaktır.
• Proje süresi onaydan sonra 3 hafta içinde tamamlanacaktır.
• 2 adet ücretsiz revizyon hakkı tanınmaktadır.
• Ek revizyon talepleri için saatlik ücretlendirme yapılacaktır.
• Hosting ve domain maliyetleri dahil değildir.
• Teslim sonrası 3 ay ücretsiz teknik destek verilecektir.`,
    userId: '1',
  };

  // Demo Quote (Tevkifatlı)
  const demoQuoteTevkifat = {
    clientId: '', // Will be set after client creation
    quoteNumber: 'TKL-20241208-002',
    title: 'Yazılım Danışmanlık ve Geliştirme Hizmeti',
    validUntil: addDays(new Date(), 45),
    status: 'draft' as const,
    subtotal: 30000,
    vatAmount: 5400,
    total: 35400,
    currencyId: '1',
    notes: 'Danışmanlık hizmeti aylık bazda faturalandırılacaktır.',
    termsAndConditions: `• Bu teklif {{validUntil}} tarihine kadar geçerlidir.
• Hizmet aylık olarak faturalandırılacaktır.
• Tevkifat uygulaması nedeniyle KDV tevkifatı yapılacaktır.
• Ödeme 30 gün vadeli olacaktır.
• Hizmet bedeli saatlik 500 TL üzerinden hesaplanmıştır.`,
    tevkifatApplied: true,
    tevkifatRate: '7/10',
    tevkifatAmount: 3780, // 5400 * 7/10
    netAmountAfterTevkifat: 31620, // 35400 - 3780
    userId: '1',
  };

  // Create demo data
  store.addClient(demoClient);
  const clients = store.clients;
  const newClient = clients[clients.length - 1];

  store.addEmployee(demoEmployee);

  if (newClient) {
    const quoteWithClient = { ...demoQuote, clientId: newClient.id };
    const quoteWithClientTevkifat = { ...demoQuoteTevkifat, clientId: newClient.id };
    store.addQuote(quoteWithClient);
    store.addQuote(quoteWithClientTevkifat);
  }

  // Demo transactions
  store.addTransaction({
    type: 'income',
    amount: 10000,
    currencyId: '1',
    categoryId: '5', // Müşteri Ödemeleri
    clientId: newClient?.id,
    description: 'Web tasarım projesi ön ödeme',
    transactionDate: new Date(),
    isVatIncluded: true,
    vatRate: 18,
    isRecurring: false,
    userId: '1',
  });

  store.addTransaction({
    type: 'expense',
    amount: 3000,
    currencyId: '1',
    categoryId: '1', // Ofis Giderleri
    description: 'Bilgisayar donanım alımı',
    transactionDate: new Date(),
    isVatIncluded: true,
    vatRate: 18,
    isRecurring: false,
    userId: '1',
  });

  // Demo Cash Accounts
  store.addCashAccount({
    name: 'Ana Kasa',
    currencyId: '1', // TRY
    balance: 50000,
    isDefault: true,
    isActive: true,
    userId: '1',
  });

  store.addCashAccount({
    name: 'USD Kasa',
    currencyId: '2', // USD
    balance: 2000,
    isDefault: false,
    isActive: true,
    userId: '1',
  });

  store.addCashAccount({
    name: 'Banka Hesabı',
    currencyId: '1', // TRY
    balance: 150000,
    isDefault: false,
    isActive: true,
    userId: '1',
  });

  // Demo debts
  store.addDebt({
    title: 'Kredi Kartı Borcu',
    amount: 5000,
    currencyId: '1',
    dueDate: addDays(new Date(), 15),
    type: 'payable',
    status: 'pending',
    description: 'Aylık kredi kartı ödemesi',
    userId: '1',
  });

  // Demo receivable debts (yaklaşan gelirler)
  store.addDebt({
    title: 'ABC Teknoloji - Web Tasarım Projesi',
    amount: 15000,
    currencyId: '1',
    dueDate: addDays(new Date(), 7),
    type: 'receivable',
    status: 'pending',
    description: 'Web tasarım projesi bakiye ödemesi',
    userId: '1',
  });

  store.addDebt({
    title: 'XYZ Şirketi - Logo Tasarım',
    amount: 8000,
    currencyId: '1',
    dueDate: addDays(new Date(), 12),
    type: 'receivable',
    status: 'pending',
    description: 'Logo tasarım projesi ödemesi',
    userId: '1',
  });

  store.addDebt({
    title: 'DEF Ltd. - Sosyal Medya Yönetimi',
    amount: 12000,
    currencyId: '1',
    dueDate: addDays(new Date(), 20),
    type: 'receivable',
    status: 'pending',
    description: 'Aylık sosyal medya yönetimi hizmeti',
    userId: '1',
  });

  console.log('Demo veriler oluşturuldu!');
};
