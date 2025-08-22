'use client';

import React from 'react';
import { useState } from 'react';
import { Plus, Search, Filter, TrendingDown, Calendar, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/lib/kv-store';
import { AuthLayout } from '@/components/layout/auth-layout';
import type { Transaction } from '@/lib/database-schema';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ExpensesPage() {
  const { 
    transactions, 
    categories, 
    currencies, 
    clients,
    employees,
    bonuses,
    cashAccounts,
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    user 
  } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dateFilter, setDateFilter] = useState('thisMonth');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    clientId: 'none',
    employeeId: 'none',
    cashAccountId: 'none',
    description: '',
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
    isVatIncluded: false,
    vatRate: '18',
    isRecurring: false,
    recurringPeriod: 'monthly' as const,
  });

  // Filter transactions for expenses only
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Bonus türü etiketleri
  const getBonusTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bonus: 'Prim',
      advance: 'Avans',
      overtime: 'Mesai',
      commission: 'Komisyon',
    };
    return labels[type] || type;
  };

  // Bonus'ları transaction formatına çevir
  const bonusTransactions = bonuses.map(bonus => ({
    id: `bonus-${bonus.id}`,
    type: 'expense' as const,
    amount: bonus.amount,
    currencyId: bonus.currencyId,
    categoryId: '4', // Maaş Ödemeleri kategorisi
    clientId: undefined,
    employeeId: bonus.employeeId,
    cashAccountId: undefined,
    description: `${bonus.description} (${getBonusTypeLabel(bonus.type)})`,
    transactionDate: bonus.paymentDate,
    isVatIncluded: false,
    vatRate: 0,
    isRecurring: false,
    recurringPeriod: undefined,
    parentTransactionId: undefined,
    userId: bonus.userId,
    createdAt: bonus.createdAt,
    updatedAt: bonus.createdAt,
    source: 'bonus' as const
  }));

  // Tüm giderleri birleştir (transaction + bonus)
  const allExpenses = [...expenseTransactions, ...bonusTransactions];

  // Apply filters
  const filteredTransactions = allExpenses.filter(transaction => {
    // Search filter
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clients.find(c => c.id === transaction.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employees.find(e => e.id === transaction.employeeId)?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categories.find(c => c.id === transaction.categoryId)?.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Date filter
    const transactionDate = new Date(transaction.transactionDate);
    const now = new Date();
    
    switch (dateFilter) {
      case 'thisMonth':
        const startMonth = startOfMonth(now);
        const endMonth = endOfMonth(now);
        if (transactionDate < startMonth || transactionDate > endMonth) return false;
        break;
      case 'lastMonth':
        const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
        const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
        if (transactionDate < lastMonthStart || transactionDate > lastMonthEnd) return false;
        break;
      case 'last3Months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3);
        if (transactionDate < threeMonthsAgo) return false;
        break;
    }

    // Category filter
    if (categoryFilter !== 'all' && transaction.categoryId !== categoryFilter) return false;

    // Client filter
    if (clientFilter !== 'all' && transaction.clientId !== clientFilter) return false;

    // Employee filter
    if (employeeFilter !== 'all' && transaction.employeeId !== employeeFilter) return false;

    return true;
  });

  const formatCurrency = (amount: number, currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return `${currency?.symbol || '₺'} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const calculateVatAmount = (amount: number, vatRate: number, isVatIncluded: boolean) => {
    if (isVatIncluded) {
      return (amount * vatRate) / (100 + vatRate);
    } else {
      return (amount * vatRate) / 100;
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      categoryId: '',
      clientId: 'none',
      employeeId: 'none',
      cashAccountId: 'none',
      description: '',
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
      isVatIncluded: false,
      vatRate: '18',
      isRecurring: false,
      recurringPeriod: 'monthly',
    });
    setEditingTransaction(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId,
      clientId: transaction.clientId || 'none',
      employeeId: transaction.employeeId || 'none',
      cashAccountId: transaction.cashAccountId || 'none',
      description: transaction.description,
      transactionDate: format(transaction.transactionDate, 'yyyy-MM-dd'),
      isVatIncluded: transaction.isVatIncluded,
      vatRate: transaction.vatRate.toString(),
      isRecurring: transaction.isRecurring,
      recurringPeriod: transaction.recurringPeriod || 'monthly',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.categoryId || !formData.description.trim()) {
      return;
    }

    const amount = parseFloat(formData.amount);
    const vatRate = parseFloat(formData.vatRate);
    
    // Ana kasa seçimi
    const defaultCashAccount = cashAccounts.find(ca => ca.isDefault);
    
    const transactionData = {
      type: 'expense' as const,
      amount,
      currencyId: '1', // Default TRY
      categoryId: formData.categoryId,
      clientId: formData.clientId && formData.clientId !== 'none' ? formData.clientId : undefined,
      employeeId: formData.employeeId && formData.employeeId !== 'none' ? formData.employeeId : undefined,
      cashAccountId: formData.cashAccountId && formData.cashAccountId !== 'none' 
        ? formData.cashAccountId 
        : defaultCashAccount?.id,
      description: formData.description,
      transactionDate: new Date(formData.transactionDate),
      isVatIncluded: formData.isVatIncluded,
      vatRate,
      isRecurring: formData.isRecurring,
      recurringPeriod: formData.isRecurring ? formData.recurringPeriod : undefined,
      nextRecurringDate: formData.isRecurring ? 
        new Date(new Date(formData.transactionDate).getTime() + (30 * 24 * 60 * 60 * 1000)) : // 30 days later
        undefined,
      userId: user?.id || '1',
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (transaction: Transaction) => {
    if (confirm('Bu gider kaydını silmek istediğinizden emin misiniz?')) {
      deleteTransaction(transaction.id);
    }
  };

  const totalExpense = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalVat = filteredTransactions.reduce((sum, t) => 
    sum + calculateVatAmount(t.amount, t.vatRate, t.isVatIncluded), 0
  );

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gider Takibi</h1>
            <p className="text-muted-foreground">
              Gider kayıtlarınızı yönetin ve takip edin
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Gider Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Gider Kaydını Düzenle' : 'Yeni Gider Kaydı'}
                </DialogTitle>
                <DialogDescription>
                  Gider bilgilerini girin. Zorunlu alanlar (*) ile işaretlenmiştir.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Tutar *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="1000.00"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="transactionDate">Tarih *</Label>
                    <Input
                      id="transactionDate"
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Kategori *</Label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Cari (Opsiyonel)</Label>
                    <Select
                      value={formData.clientId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Cari seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Cari Seçmeyin</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Personel (Opsiyonel)</Label>
                    <Select
                      value={formData.employeeId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Personel seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Personel Seçmeyin</SelectItem>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cashAccountId">Kasa (Opsiyonel)</Label>
                    <Select
                      value={formData.cashAccountId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cashAccountId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kasa seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ana Kasa (Varsayılan)</SelectItem>
                        {cashAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.name} {account.isDefault && '(Ana)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vatRate">KDV Oranı (%)</Label>
                    <Select
                      value={formData.vatRate}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, vatRate: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">%0 (KDV Yok)</SelectItem>
                        <SelectItem value="1">%1</SelectItem>
                        <SelectItem value="8">%8</SelectItem>
                        <SelectItem value="18">%18</SelectItem>
                        <SelectItem value="20">%20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isVatIncluded"
                        checked={formData.isVatIncluded}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, isVatIncluded: checked as boolean }))
                        }
                      />
                      <Label htmlFor="isVatIncluded">KDV Dahil</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Gider açıklaması"
                    required
                  />
                </div>
                
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isRecurring: checked as boolean }))
                      }
                    />
                    <Label htmlFor="isRecurring">Tekrar Eden Kayıt</Label>
                  </div>
                  
                  {formData.isRecurring && (
                    <div className="ml-6 space-y-2">
                      <Label htmlFor="recurringPeriod">Tekrar Periyodu</Label>
                      <Select
                        value={formData.recurringPeriod}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, recurringPeriod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Günlük</SelectItem>
                          <SelectItem value="weekly">Haftalık</SelectItem>
                          <SelectItem value="monthly">Aylık</SelectItem>
                          <SelectItem value="quarterly">3 Aylık</SelectItem>
                          <SelectItem value="yearly">Yıllık</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {formData.amount && formData.vatRate && parseFloat(formData.vatRate) > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">KDV Hesaplaması</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Ana Tutar:</span>
                        <span>
                          {formData.isVatIncluded 
                            ? formatCurrency(
                                parseFloat(formData.amount) - calculateVatAmount(
                                  parseFloat(formData.amount), 
                                  parseFloat(formData.vatRate), 
                                  true
                                ), 
                                '1'
                              )
                            : formatCurrency(parseFloat(formData.amount), '1')
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>KDV Tutarı:</span>
                        <span>
                          {formatCurrency(
                            calculateVatAmount(
                              parseFloat(formData.amount), 
                              parseFloat(formData.vatRate), 
                              formData.isVatIncluded
                            ), 
                            '1'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-medium border-t pt-1">
                        <span>Toplam:</span>
                        <span>
                          {formData.isVatIncluded 
                            ? formatCurrency(parseFloat(formData.amount), '1')
                            : formatCurrency(
                                parseFloat(formData.amount) + calculateVatAmount(
                                  parseFloat(formData.amount), 
                                  parseFloat(formData.vatRate), 
                                  false
                                ), 
                                '1'
                              )
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700">
                    {editingTransaction ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Gider ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">Bu Ay</SelectItem>
              <SelectItem value="lastMonth">Geçen Ay</SelectItem>
              <SelectItem value="last3Months">Son 3 Ay</SelectItem>
              <SelectItem value="all">Tüm Zamanlar</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Cariler</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Personel</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalExpense, '1')}
              </div>
              <p className="text-xs text-muted-foreground">
                {filteredTransactions.length} kayıt
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam KDV</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalVat, '1')}
              </div>
              <p className="text-xs text-muted-foreground">
                KDV tutarı
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Gider</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalExpense - totalVat, '1')}
              </div>
              <p className="text-xs text-muted-foreground">
                KDV hariç
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction List */}
        <Card>
          <CardHeader>
            <CardTitle>Gider Kayıtları</CardTitle>
            <CardDescription>
              {filteredTransactions.length} kayıt gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions
                  .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                  .map((transaction) => {
                    const category = categories.find(c => c.id === transaction.categoryId);
                    const client = clients.find(c => c.id === transaction.clientId);
                    const employee = employees.find(e => e.id === transaction.employeeId);
                    const vatAmount = calculateVatAmount(transaction.amount, transaction.vatRate, transaction.isVatIncluded);
                    
                    return (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            {category && (
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                            <div>
                              <h3 className="font-medium">{transaction.description}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span>{format(transaction.transactionDate, 'dd MMM yyyy', { locale: tr })}</span>
                                <span>{category?.name}</span>
                                {client && <span>{client.name}</span>}
                                {employee && <span>{employee.name}</span>}
                                {(transaction as any).source === 'bonus' && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                    Personel Ödemesi
                                  </span>
                                )}
                                {transaction.isRecurring && (
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    Tekrar Eden
                                  </span>
                                )}
                              </div>
                              {transaction.vatRate > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  KDV: {formatCurrency(vatAmount, transaction.currencyId)} (%{transaction.vatRate})
                                  {transaction.isVatIncluded ? ' (Dahil)' : ' (Hariç)'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-red-600">
                              -{formatCurrency(transaction.amount, transaction.currencyId)}
                            </div>
                            {transaction.vatRate > 0 && !transaction.isVatIncluded && (
                              <div className="text-sm text-muted-foreground">
                                + KDV: {formatCurrency(vatAmount, transaction.currencyId)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {(transaction as any).source !== 'bonus' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditDialog(transaction)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(transaction)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {(transaction as any).source === 'bonus' && (
                              <span className="text-xs text-muted-foreground">
                                Personel sayfasından düzenlenebilir
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || dateFilter !== 'all' || categoryFilter !== 'all' || clientFilter !== 'all' || employeeFilter !== 'all'
                    ? 'Filtrelere uygun gider kaydı bulunamadı.'
                    : 'Henüz gider kaydı eklenmemiş.'
                  }
                </p>
                {!searchTerm && dateFilter === 'all' && categoryFilter === 'all' && clientFilter === 'all' && employeeFilter === 'all' && (
                  <Button onClick={openAddDialog} className="mt-4 bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk gider kaydınızı ekleyin
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
