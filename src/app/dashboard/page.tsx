'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { useAppStore } from '../../lib/kv-store';
import { AuthLayout } from '../../components/layout/auth-layout';
import { createDemoData } from '../../lib/demo-data';
import type { Employee } from '../../lib/database-schema';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  FileText,
  Eye,
  EyeOff,
  ChevronDown,
  Wallet,
  Plus,
  Receipt,
  Repeat
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isAfter, isBefore, addDays, subDays, addMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function DashboardPage() {
  const { 
    transactions, 
    clients, 
    employees, 
    debts, 
    bonuses,
    currencies, 
    cashAccounts,
    categories,
    invoices,
    pendingBalances,
    regularPayments,
    showAmounts,
    toggleShowAmounts,
    addTransaction,
    addClient,
    addQuote,
    addCashAccount,
    getTotalPendingBalances
  } = useAppStore();

  // Form states
  const [quickTransactionData, setQuickTransactionData] = useState({
    type: 'income' as 'income' | 'expense',
    amount: '',
    description: '',
    categoryId: '',
    clientId: '',
    cashAccountId: ''
  });

  const [quickClientData, setQuickClientData] = useState({
    name: '',
    email: '',
    phone: '',
    currencyId: '1' // TRY default
  });

  const [isQuickTransactionOpen, setIsQuickTransactionOpen] = useState(false);
  const [isQuickClientOpen, setIsQuickClientOpen] = useState(false);

  // Ana kasa veya seçili kasa
  const defaultCashAccount = cashAccounts.find(ca => ca.isDefault) || cashAccounts[0];
  const [selectedCashAccountId, setSelectedCashAccountId] = useState(defaultCashAccount?.id || '');

  // Grafik için tarih aralığı filtresi
  const [chartDateRange, setChartDateRange] = useState('last_30'); // Varsayılan son 30 gün

  // Tarih aralığı hesaplama fonksiyonu
  const getDateRange = (rangeType: string) => {
    const today = new Date();
    
    switch (rangeType) {
      // Geçmiş
      case 'last_7':
        return { start: subDays(today, 7), end: today, days: 7, title: 'Son 7 Gün' };
      case 'last_14':
        return { start: subDays(today, 14), end: today, days: 14, title: 'Son 14 Gün' };
      case 'last_30':
        return { start: subDays(today, 30), end: today, days: 30, title: 'Son 30 Gün' };
      case 'last_60':
        return { start: subDays(today, 60), end: today, days: 60, title: 'Son 60 Gün' };
      case 'last_90':
        return { start: subDays(today, 90), end: today, days: 90, title: 'Son 90 Gün' };
      
      // Gelecek
      case 'next_7':
        return { start: today, end: addDays(today, 7), days: 7, title: 'Önümüzdeki 7 Gün' };
      case 'next_14':
        return { start: today, end: addDays(today, 14), days: 14, title: 'Önümüzdeki 14 Gün' };
      case 'next_30':
        return { start: today, end: addDays(today, 30), days: 30, title: 'Önümüzdeki 30 Gün' };
      case 'next_60':
        return { start: today, end: addDays(today, 60), days: 60, title: 'Önümüzdeki 60 Gün' };
      
      // Bu ay ve gelecek ay
      case 'this_month':
        return { 
          start: startOfMonth(today), 
          end: endOfMonth(today), 
          days: endOfMonth(today).getDate(), 
          title: 'Bu Ay' 
        };
      case 'next_month':
        const nextMonth = addMonths(today, 1);
        return { 
          start: startOfMonth(nextMonth), 
          end: endOfMonth(nextMonth), 
          days: endOfMonth(nextMonth).getDate(), 
          title: 'Gelecek Ay' 
        };
      
      // Karma (geçmiş + gelecek)
      case 'around_15':
        return { start: subDays(today, 15), end: addDays(today, 15), days: 30, title: 'Çevresindeki 30 Gün' };
      case 'around_30':
        return { start: subDays(today, 30), end: addDays(today, 30), days: 60, title: 'Çevresindeki 60 Gün' };
      
      default:
        return { start: subDays(today, 30), end: today, days: 30, title: 'Son 30 Gün' };
    }
  };

  // Bu ayki ciro hesaplama
  const thisMonthRevenue = useMemo(() => {
    const startOfThisMonth = startOfMonth(new Date());
    const endOfThisMonth = endOfMonth(new Date());
    
    return transactions
      .filter(t => 
        t.type === 'income' && 
        isAfter(t.transactionDate, startOfThisMonth) && 
        isBefore(t.transactionDate, endOfThisMonth)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Yaklaşan borçlar (30 gün içinde)
  const upcomingDebts = useMemo(() => {
    const next30Days = addDays(new Date(), 30);
    
    return debts
      .filter(d => 
        d.status === 'pending' && 
        isBefore(d.dueDate, next30Days)
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [debts]);

  // Yaklaşan gelirler (30 gün içinde)
  const upcomingIncomes = useMemo(() => {
    const today = new Date();
    const next30Days = addDays(today, 30);
    
    // Debts'dan gelen gelirler
    const debtIncomes = debts
      .filter(d => 
        d.type === 'receivable' && 
        d.status === 'pending' && 
        isAfter(new Date(d.dueDate), today) &&
        isBefore(new Date(d.dueDate), next30Days)
      )
      .map(d => ({
        id: `debt-${d.id}`,
        title: d.title,
        amount: d.amount,
        dueDate: d.dueDate,
        source: 'debt' as const
      }));

    // Transactions'dan gelen gelirler (gelecek tarihli)
    const transactionIncomes = transactions
      .filter(t => 
        t.type === 'income' && 
        isAfter(new Date(t.transactionDate), today) &&
        isBefore(new Date(t.transactionDate), next30Days)
      )
      .map(t => ({
        id: `transaction-${t.id}`,
        title: t.description,
        amount: t.amount,
        dueDate: t.transactionDate,
        source: 'transaction' as const
      }));

    // Birleştir ve sırala
    const allIncomes = [...debtIncomes, ...transactionIncomes];
    return allIncomes
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [debts, transactions]);

  // Kredi borçları ve düzenli ödemeler (RegularPayments üzerinden)
  const creditDebts = useMemo(() => {
    return regularPayments
      .filter(rp => rp.category === 'loan' || rp.category === 'installment')
      .filter(rp => rp.status === 'pending')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [regularPayments]);

  // Yaklaşan düzenli ödemeler (tüm kategoriler) - 30 gün içinde
  const upcomingRegularPayments = useMemo(() => {
    const next30Days = addDays(new Date(), 30);
    return regularPayments
      .filter(rp => rp.status === 'pending')
      .filter(rp => isBefore(new Date(rp.dueDate), next30Days))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [regularPayments]);

  // Maaş ödemelerini (monthly/weekly/biweekly) seçili tarih aralığına genişlet ve aylık prim/avans ile ayarla
  const salaryProjection = useMemo(() => {
    const dateRange = getDateRange(chartDateRange);
    const start = dateRange.start;
    const end = dateRange.end;

    const byDateSalary = new Map<string, number>();
    let totalSalary = 0;

    const addMonthsSafe = (date: Date, count: number) => {
      const d = new Date(date);
      d.setMonth(d.getMonth() + count);
      return d;
    };
    const addDaysSafe = (date: Date, count: number) => {
      const d = new Date(date);
      d.setDate(d.getDate() + count);
      return d;
    };

    const startOf = (date: Date) => startOfMonth(date);
    const endOf = (date: Date) => endOfMonth(date);

    // Aynı çalışan için aynı ayın bonus/avans ayarlamasını sadece ayın ilk ödeme gününde uygula
    const appliedAdjustmentMonths = new Set<string>();

    employees
      .filter(e => e.isActive)
      .forEach(e => {
        // Başlangıç için sabit bir çapa: içinde bulunulan ayın paymentDay günü
        let occ = new Date(start.getFullYear(), start.getMonth(), e.paymentDay);
        // Eğer başlangıçtan önceyse, perioda göre ileri al
        if (isBefore(occ, start)) {
          if (e.payrollPeriod === 'monthly') {
            occ = new Date(start.getFullYear(), start.getMonth() + 1, e.paymentDay);
          } else if (e.payrollPeriod === 'weekly') {
            while (isBefore(occ, start)) {
              occ = addDaysSafe(occ, 7);
            }
          } else if (e.payrollPeriod === 'biweekly') {
            while (isBefore(occ, start)) {
              occ = addDaysSafe(occ, 14);
            }
          }
        }

        while (!isAfter(occ, end)) {
          // Bu ayın başlangıç/bitişi
          const monthStart = startOf(occ);
          const monthEnd = endOf(occ);

          // Bu çalışanın bu ayına ait bonus/avans etkileri (sadece ayın ilk ödeme gününde uygula)
          const monthKey = `${e.id}-${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`;
          let increase = 0;
          let advances = 0;
          if (!appliedAdjustmentMonths.has(monthKey)) {
            const monthBonuses = bonuses.filter(b => b.employeeId === e.id && !isBefore(b.paymentDate, monthStart) && !isAfter(b.paymentDate, monthEnd));
            increase = monthBonuses
              .filter(b => b.type === 'bonus' || b.type === 'overtime' || b.type === 'commission')
              .reduce((s, b) => s + b.amount, 0);
            advances = monthBonuses
              .filter(b => b.type === 'advance' && !isAfter(b.paymentDate, occ))
              .reduce((s, b) => s + b.amount, 0);
          }

          const payout = Math.max(0, Number(e.netSalary) + increase - advances);
          const key = format(occ, 'yyyy-MM-dd');
          byDateSalary.set(key, (byDateSalary.get(key) || 0) + payout);
          totalSalary += payout;

          // Ayarlamaları tek kez işaretle
          if (!appliedAdjustmentMonths.has(monthKey)) {
            appliedAdjustmentMonths.add(monthKey);
          }

          // Sonraki occurrence
          if (e.payrollPeriod === 'monthly') {
            occ = addMonthsSafe(occ, 1);
          } else if (e.payrollPeriod === 'weekly') {
            occ = addDaysSafe(occ, 7);
          } else {
            occ = addDaysSafe(occ, 14);
          }
        }
      });

    return { byDateSalary, totalSalary };
  }, [employees, bonuses, chartDateRange]);

  // Düzenli ödemeleri seçili tarih aralığına genişlet
  const regularPaymentProjection = useMemo(() => {
    const dateRange = getDateRange(chartDateRange);
    const start = dateRange.start;
    const end = dateRange.end;

    const byDateCredit = new Map<string, number>();
    const byDateAll = new Map<string, number>();

    const addToMap = (map: Map<string, number>, date: Date, amount: number) => {
      const key = format(date, 'yyyy-MM-dd');
      map.set(key, (map.get(key) || 0) + amount);
    };

    const addInterval = (date: Date, freq: string) => {
      const d = new Date(date);
      switch (freq) {
        case 'weekly':
          d.setDate(d.getDate() + 7);
          break;
        case 'monthly':
          d.setMonth(d.getMonth() + 1);
          break;
        case 'quarterly':
          d.setMonth(d.getMonth() + 3);
          break;
        case 'yearly':
          d.setFullYear(d.getFullYear() + 1);
          break;
        default:
          d.setMonth(d.getMonth() + 1);
      }
      return d;
    };

    let totalCredit = 0;
    let totalAll = 0;

    regularPayments
      .filter(rp => rp.status === 'pending')
      .forEach(rp => {
        let occurrence = new Date(rp.dueDate);
        // Aralığın başlangıcına kadar ilerlet
        while (isBefore(occurrence, start)) {
          occurrence = addInterval(occurrence, rp.frequency);
          if (occurrence > end) break;
        }
        // Aralık içinde tüm tekrarlar
        while (!isAfter(occurrence, end)) {
          if (!isBefore(occurrence, start) && !isAfter(occurrence, end)) {
            // Kategoriye göre haritalara ekle
            addToMap(byDateAll, occurrence, rp.amount);
            totalAll += rp.amount;
            if (rp.category === 'loan' || rp.category === 'installment') {
              addToMap(byDateCredit, occurrence, rp.amount);
              totalCredit += rp.amount;
            }
          }
          occurrence = addInterval(occurrence, rp.frequency);
          // Güvenlik: sonsuz döngüyü engelle
          if (occurrence.getTime() === new Date(rp.dueDate).getTime()) break;
        }
      });

    return { byDateCredit, byDateAll, totalCredit, totalAll };
  }, [regularPayments, chartDateRange]);

  // Yaklaşan maaş ödemeleri (aylık tekrar ve bonus/avans ayarlı gösterim için tahmini tutar)
  const upcomingSalaryPayments = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return employees
      .filter((e: Employee) => e.isActive)
      .map((employee: Employee) => {
        // Başlangıç anchor
        let paymentDate = new Date(currentYear, currentMonth, employee.paymentDay);
        const stepDays = employee.payrollPeriod === 'weekly' ? 7 : (employee.payrollPeriod === 'biweekly' ? 14 : 30); // monthly approx 30 to jump ahead quickly
        while (paymentDate < today) {
          if (employee.payrollPeriod === 'monthly') {
            paymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, employee.paymentDay);
          } else {
            paymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), paymentDate.getDate() + stepDays);
          }
        }

        // İlgili ayın bonus/avans etkisi
        const monthStart = startOfMonth(paymentDate);
        const monthEnd = endOfMonth(paymentDate);
        const monthBonuses = bonuses.filter(b => b.employeeId === employee.id && !isBefore(b.paymentDate, monthStart) && !isAfter(b.paymentDate, monthEnd));
        const increase = monthBonuses
          .filter(b => b.type === 'bonus' || b.type === 'overtime' || b.type === 'commission')
          .reduce((s, b) => s + b.amount, 0);
        const advances = monthBonuses
          .filter(b => b.type === 'advance' && !isAfter(b.paymentDate, paymentDate))
          .reduce((s, b) => s + b.amount, 0);
        const adjustedAmount = Math.max(0, Number(employee.netSalary) + increase - advances);

        return {
          ...employee,
          nextPaymentDate: paymentDate,
          adjustedAmount,
        };
      })
      .filter((employee) => {
        const daysDiff = Math.ceil((employee.nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 30;
      })
      .sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime())
      .slice(0, 5);
  }, [employees, bonuses]);

  // Seçili dönemdeki gelir-gider özeti
  const selectedPeriodStats = useMemo(() => {
    const dateRange = getDateRange(chartDateRange);
    
    const periodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.transactionDate);
      return isAfter(transactionDate, dateRange.start) && isBefore(transactionDate, dateRange.end);
    });
    
    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Bonuslardan gelen giderleri de ekle
    const periodBonusExpense = bonuses
      .filter(b => {
        const bonusDate = new Date(b.paymentDate);
        return isAfter(bonusDate, dateRange.start) && isBefore(bonusDate, dateRange.end);
      })
      .reduce((sum, b) => sum + b.amount, 0);

    // Düzenli ödemeleri (tüm kategoriler) giderlere dahil et
    const totalExpenseWithBonus = totalExpense + periodBonusExpense + regularPaymentProjection.totalAll;

    // Kredi borçları toplamını hesapla (regularPayments üzerinden)
    const totalCreditDebts = regularPaymentProjection.totalCredit;

    // Maaş ödemeleri toplamı (aylık tekrar ve bonus/avans ayarlı)
    const totalSalaryPayments = salaryProjection.totalSalary;
    
    return {
      income: totalIncome,
      expense: totalExpenseWithBonus,
      creditDebts: totalCreditDebts,
      salaryPayments: totalSalaryPayments,
      net: totalIncome - totalExpenseWithBonus,
      transactionCount: periodTransactions.length + bonuses.filter(b => {
        const bonusDate = new Date(b.paymentDate);
        return isAfter(bonusDate, dateRange.start) && isBefore(bonusDate, dateRange.end);
      }).length,
      title: dateRange.title
    };
  }, [transactions, bonuses, debts, employees, chartDateRange]);

  // Grafik için günlük gelir-gider verileri (dinamik tarih aralığı)
  const chartData = useMemo(() => {
    const dateRange = getDateRange(chartDateRange);
    const { start, end, days } = dateRange;
    
    // Gün sayısını hesapla
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const dateArray = Array.from({ length: totalDays + 1 }, (_, i) => {
      const date = addDays(start, i);
      const dayTransactions = transactions.filter(t => 
        format(new Date(t.transactionDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      let dayExpense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Bu günki bonusları da ekle
      const dayBonusExpense = bonuses
        .filter(b => format(new Date(b.paymentDate), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))
        .reduce((sum, b) => sum + b.amount, 0);

      // Düzenli ödemeleri günlük giderlere ekle
      const dayRegularPayments = regularPaymentProjection.byDateAll.get(format(date, 'yyyy-MM-dd')) || 0;
      const totalDayExpense = dayExpense + dayBonusExpense + dayRegularPayments;
      
      // Bu günki kredi borçlarını da ekle
      const dayCreditDebts = regularPaymentProjection.byDateCredit.get(format(date, 'yyyy-MM-dd')) || 0;

      // Bu günkü maaş ödemeleri (aylık tekrar ve bonus/avans ayarlı)
      const daySalaryPayments = salaryProjection.byDateSalary.get(format(date, 'yyyy-MM-dd')) || 0;
      
      return {
        date: format(date, totalDays <= 14 ? 'dd MMM' : 'dd/MM'),
        gelir: dayIncome,
        gider: totalDayExpense,
        krediBorclari: dayCreditDebts,
        maasOdemeleri: daySalaryPayments,
        net: dayIncome - totalDayExpense,
        fullDate: format(date, 'yyyy-MM-dd')
      };
    });
    
    return dateArray;
  }, [transactions, bonuses, debts, chartDateRange]);

  // Kasa durumu hesaplama
  const cashBalance = useMemo(() => {
    if (!selectedCashAccountId) return 0;
    
    const cashTransactions = transactions.filter(t => 
      t.cashAccountId === selectedCashAccountId || (!t.cashAccountId && defaultCashAccount?.id === selectedCashAccountId)
    );
    
    return cashTransactions.reduce((balance, transaction) => {
      return transaction.type === 'income' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
    }, defaultCashAccount?.balance || 0);
  }, [transactions, selectedCashAccountId, defaultCashAccount]);

  const formatCurrency = (amount: number, currencyCode = 'TRY') => {
    const currency = currencies.find(c => c.code === currencyCode);
    const symbol = currency?.symbol || 'TL';
    
    if (!showAmounts) {
      return `${symbol} ***.**`;
    }
    
    return `${symbol} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  // Hızlı işlem handlers
  const handleQuickTransaction = () => {
    if (!quickTransactionData.amount || !quickTransactionData.description) return;
    
    addTransaction({
      type: quickTransactionData.type,
      amount: parseFloat(quickTransactionData.amount),
      currencyId: '1', // TRY default
      categoryId: quickTransactionData.categoryId || categories[0]?.id || '1',
      clientId: quickTransactionData.clientId || undefined,
      cashAccountId: quickTransactionData.cashAccountId || defaultCashAccount?.id,
      description: quickTransactionData.description,
      transactionDate: new Date(),
      isVatIncluded: false,
      vatRate: 0,
      isRecurring: false,
      userId: '1'
    });
    
    setQuickTransactionData({
      type: 'income',
      amount: '',
      description: '',
      categoryId: '',
      clientId: '',
      cashAccountId: ''
    });
    setIsQuickTransactionOpen(false);
  };

  const handleQuickClient = () => {
    if (!quickClientData.name) return;
    
    addClient({
      name: quickClientData.name,
      email: quickClientData.email || undefined,
      phone: quickClientData.phone || undefined,
      currencyId: quickClientData.currencyId,
      balance: 0,
      isActive: true,
      userId: '1'
    });
    
    setQuickClientData({
      name: '',
      email: '',
      phone: '',
      currencyId: '1'
    });
    setIsQuickClientOpen(false);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Üst Başlık - Rakamları Göster/Gizle */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowAmounts}
            className="flex items-center gap-2"
          >
            {showAmounts ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showAmounts ? 'Rakamları Gizle' : 'Rakamları Göster'}
          </Button>
        </div>

        {/* Ana İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay Ciro</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(thisMonthRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(), 'MMMM yyyy', { locale: tr })}
              </p>
            </CardContent>
          </Card>

          {/* Kasa Durumu */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kasa Durumu</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Wallet className="h-4 w-4 mr-1" />
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {cashAccounts.length > 0 ? (
                    cashAccounts.map((account) => (
                      <DropdownMenuItem
                        key={account.id}
                        onClick={() => setSelectedCashAccountId(account.id)}
                      >
                        {account.name} {account.isDefault && '(Ana)'}
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>Kasa bulunamadı</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(cashBalance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {cashAccounts.find(ca => ca.id === selectedCashAccountId)?.name || 'Ana Kasa'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Cariler</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => c.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam {clients.length} cari
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Personel Sayısı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees.filter(e => e.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Aktif çalışan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{selectedPeriodStats.title} Net</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${selectedPeriodStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(selectedPeriodStats.net)}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedPeriodStats.title}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Alacaklar</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(getTotalPendingBalances())}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingBalances.filter(pb => pb.status === 'pending').length} bekleyen fatura
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gelir-Gider Analizi ve Grafik */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  {selectedPeriodStats.title} Gelir-Gider Analizi
                </CardTitle>
                <CardDescription>
                  Toplam {selectedPeriodStats.transactionCount} işlem
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={chartDateRange} onValueChange={setChartDateRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Geçmiş */}
                    <SelectItem value="last_7">Son 7 Gün</SelectItem>
                    <SelectItem value="last_14">Son 14 Gün</SelectItem>
                    <SelectItem value="last_30">Son 30 Gün</SelectItem>
                    <SelectItem value="last_60">Son 60 Gün</SelectItem>
                    <SelectItem value="last_90">Son 90 Gün</SelectItem>
                    
                    {/* Mevcut dönem */}
                    <SelectItem value="this_month">Bu Ay</SelectItem>
                    
                    {/* Gelecek */}
                    <SelectItem value="next_7">Önümüzdeki 7 Gün</SelectItem>
                    <SelectItem value="next_14">Önümüzdeki 14 Gün</SelectItem>
                    <SelectItem value="next_30">Önümüzdeki 30 Gün</SelectItem>
                    <SelectItem value="next_60">Önümüzdeki 60 Gün</SelectItem>
                    <SelectItem value="next_month">Gelecek Ay</SelectItem>
                    
                    {/* Karma (çevresindeki) */}
                    <SelectItem value="around_15">Çevresindeki 30 Gün</SelectItem>
                    <SelectItem value="around_30">Çevresindeki 60 Gün</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Özet rakamlar */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(selectedPeriodStats.income)}
                </div>
                <p className="text-sm text-muted-foreground">Toplam Gelir</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(selectedPeriodStats.expense)}
                </div>
                <p className="text-sm text-muted-foreground">Toplam Gider</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(selectedPeriodStats.creditDebts)}
                </div>
                <p className="text-sm text-muted-foreground">Kredi Borçları</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(selectedPeriodStats.salaryPayments)}
                </div>
                <p className="text-sm text-muted-foreground">Maaş Ödemeleri</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${selectedPeriodStats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(selectedPeriodStats.net)}
                </div>
                <p className="text-sm text-muted-foreground">Net Durum</p>
              </div>
            </div>

            {/* Grafik */}
            {showAmounts && chartData.length > 0 && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `${value.toLocaleString('tr-TR')} TL`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`,
                        name === 'gelir' ? 'Gelir' : 
                        name === 'gider' ? 'Gider' : 
                        name === 'krediBorclari' ? 'Kredi Borçları' : 
                        name === 'maasOdemeleri' ? 'Maaş Ödemeleri' : 'Net'
                      ]}
                      labelFormatter={(label) => `Tarih: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gelir" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="gider" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="krediBorclari" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="maasOdemeleri" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {!showAmounts && (
              <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <EyeOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Grafik görüntülemek için rakamları gösterin</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alt Kısım - İki Sütun */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sol Sütun */}
          <div className="space-y-6">
            {/* Yaklaşan Borçlar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Yaklaşan Borçlar
                </CardTitle>
                <CardDescription>30 gün içinde ödenecek</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingDebts.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingDebts.map((debt) => (
                      <div key={debt.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{debt.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(debt.dueDate, 'dd MMM yyyy', { locale: tr })}
                          </p>
                        </div>
                        <div className="text-red-600 font-semibold">
                          {formatCurrency(debt.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Yaklaşan borç bulunmuyor</p>
                )}
              </CardContent>
            </Card>

            {/* Yaklaşan Maaş Ödemeleri */}
            <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Yaklaşan Maaş Ödemeleri
                </CardTitle>
                <CardDescription>Bu ay ödenecek maaşlar</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSalaryPayments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingSalaryPayments.map((employee) => (
                      <div key={employee.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{employee.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {employee.position} - {format(employee.nextPaymentDate, 'dd MMM yyyy', { locale: tr })}
                          </p>
                        </div>
                        <div className="text-blue-600 font-semibold">
                          {formatCurrency(employee.adjustedAmount || employee.netSalary)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Yaklaşan maaş ödemesi bulunmuyor</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sağ Sütun */}
          <div className="space-y-6">
            {/* Yaklaşan Düzenli Ödemeler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Repeat className="h-5 w-5 mr-2 text-teal-500" />
                  Yaklaşan Düzenli Ödemeler
                </CardTitle>
                <CardDescription>30 gün içinde düzenli giderler</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingRegularPayments.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingRegularPayments.map((rp) => (
                      <div key={rp.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{rp.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(rp.dueDate, 'dd MMM yyyy', { locale: tr })}
                          </p>
                        </div>
                        <div className="text-teal-600 font-semibold">
                          {formatCurrency(rp.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Yaklaşan düzenli ödeme bulunmuyor</p>
                )}
              </CardContent>
            </Card>

            {/* Bekleyen Fatura Bakiyeleri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-purple-500" />
                  Bekleyen Fatura Bakiyeleri
                </CardTitle>
                <CardDescription>Ödenmemiş faturalar</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBalances.filter(pb => pb.status === 'pending').length > 0 ? (
                  <div className="space-y-3">
                    {pendingBalances
                      .filter(pb => pb.status === 'pending')
                      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                      .slice(0, 5)
                      .map((balance) => {
                        const client = clients.find(c => c.id === balance.clientId);
                        const isOverdue = new Date(balance.dueDate) < new Date();
                        return (
                          <div key={balance.id} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{client?.name}</p>
                              <p className={`text-sm ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {balance.description} - {format(balance.dueDate, 'dd MMM yyyy', { locale: tr })}
                                {isOverdue && ' (GECİKTİ)'}
                              </p>
                            </div>
                            <div className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-purple-600'}`}>
                              {formatCurrency(balance.amount)}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Bekleyen fatura bakiyesi bulunmuyor</p>
                )}
              </CardContent>
            </Card>

            {/* Yaklaşan Gelirler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                  Yaklaşan Gelirler
                </CardTitle>
                <CardDescription>30 gün içinde alınacak</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingIncomes.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingIncomes.map((income) => (
                      <div key={income.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{income.title}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm text-muted-foreground">
                              {format(income.dueDate, 'dd MMM yyyy', { locale: tr })}
                            </p>
                            {income.source === 'transaction' && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                Gelir Kaydı
                              </span>
                            )}
                            {income.source === 'debt' && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                                Alacak
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-green-600 font-semibold">
                          {formatCurrency(income.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Yaklaşan gelir bulunmuyor</p>
                )}
              </CardContent>
            </Card>

            {/* Kredi Borçları */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-purple-500" />
                  Kredi Borçları
                </CardTitle>
                <CardDescription>Ödenmemiş borçlar</CardDescription>
              </CardHeader>
              <CardContent>
                {creditDebts.length > 0 ? (
                  <div className="space-y-3">
                    {creditDebts.map((debt) => (
                      <div key={debt.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{debt.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Vade: {format(debt.dueDate, 'dd MMM yyyy', { locale: tr })}
                          </p>
                        </div>
                        <div className="text-purple-600 font-semibold">
                          {formatCurrency(debt.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Kredi borcu bulunmuyor</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Demo Data Button */}
        {transactions.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Demo Veriler</CardTitle>
              <CardDescription>
                Sistemi test etmek için örnek veriler oluşturun
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={createDemoData} className="w-full">
                Demo Veriler Oluştur
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Hızlı İşlemler */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
            <CardDescription>Sık kullanılan işlemlere hızlı erişim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Gelir Ekle */}
              <Dialog open={isQuickTransactionOpen && quickTransactionData.type === 'income'} 
                      onOpenChange={(open) => {
                        if (open) {
                          setQuickTransactionData(prev => ({ ...prev, type: 'income' }));
                          setIsQuickTransactionOpen(true);
                        } else {
                          setIsQuickTransactionOpen(false);
                        }
                      }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto py-4 flex flex-col space-y-2">
                    <TrendingUp className="h-6 w-6" />
                    <span>Gelir Ekle</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hızlı Gelir Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni gelir kaydı oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Tutar</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={quickTransactionData.amount}
                        onChange={(e) => setQuickTransactionData(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Açıklama</Label>
                      <Input
                        id="description"
                        placeholder="Gelir açıklaması"
                        value={quickTransactionData.description}
                        onChange={(e) => setQuickTransactionData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Kategori</Label>
                      <Select 
                        value={quickTransactionData.categoryId || 'none'} 
                        onValueChange={(value) => setQuickTransactionData(prev => ({ 
                          ...prev, 
                          categoryId: value === 'none' ? '' : value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kategori seçmeyin</SelectItem>
                          {categories.filter(c => c.type === 'income').map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="client">Cari (Opsiyonel)</Label>
                      <Select 
                        value={quickTransactionData.clientId || 'none'} 
                        onValueChange={(value) => setQuickTransactionData(prev => ({ 
                          ...prev, 
                          clientId: value === 'none' ? '' : value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Cari seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Cari seçmeyin</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsQuickTransactionOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleQuickTransaction}>
                      Gelir Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Gider Ekle */}
              <Dialog open={isQuickTransactionOpen && quickTransactionData.type === 'expense'} 
                      onOpenChange={(open) => {
                        if (open) {
                          setQuickTransactionData(prev => ({ ...prev, type: 'expense' }));
                          setIsQuickTransactionOpen(true);
                        } else {
                          setIsQuickTransactionOpen(false);
                        }
                      }}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto py-4 flex flex-col space-y-2">
                    <TrendingDown className="h-6 w-6" />
                    <span>Gider Ekle</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hızlı Gider Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni gider kaydı oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Tutar</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={quickTransactionData.amount}
                        onChange={(e) => setQuickTransactionData(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Açıklama</Label>
                      <Input
                        id="description"
                        placeholder="Gider açıklaması"
                        value={quickTransactionData.description}
                        onChange={(e) => setQuickTransactionData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Kategori</Label>
                      <Select 
                        value={quickTransactionData.categoryId || 'none'} 
                        onValueChange={(value) => setQuickTransactionData(prev => ({ 
                          ...prev, 
                          categoryId: value === 'none' ? '' : value 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kategori seçmeyin</SelectItem>
                          {categories.filter(c => c.type === 'expense').map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsQuickTransactionOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleQuickTransaction}>
                      Gider Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Cari Ekle */}
              <Dialog open={isQuickClientOpen} onOpenChange={setIsQuickClientOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-auto py-4 flex flex-col space-y-2">
                    <Users className="h-6 w-6" />
                    <span>Cari Ekle</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Hızlı Cari Ekle</DialogTitle>
                    <DialogDescription>
                      Yeni cari hesap oluşturun
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Cari Adı</Label>
                      <Input
                        id="name"
                        placeholder="Cari adı"
                        value={quickClientData.name}
                        onChange={(e) => setQuickClientData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-posta (Opsiyonel)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ornek@mail.com"
                        value={quickClientData.email}
                        onChange={(e) => setQuickClientData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon (Opsiyonel)</Label>
                      <Input
                        id="phone"
                        placeholder="+90 555 123 45 67"
                        value={quickClientData.phone}
                        onChange={(e) => setQuickClientData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Para Birimi</Label>
                      <Select 
                        value={quickClientData.currencyId} 
                        onValueChange={(value) => setQuickClientData(prev => ({ ...prev, currencyId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem key={currency.id} value={currency.id}>
                              {currency.name} ({currency.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsQuickClientOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleQuickClient}>
                      Cari Ekle
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Teklif Oluştur */}
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col space-y-2"
                onClick={() => window.location.href = '/quotes'}
              >
                <FileText className="h-6 w-6" />
                <span>Teklif Oluştur</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
