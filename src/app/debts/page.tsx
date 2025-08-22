'use client';

import React from 'react';
import { useState } from 'react';
import { Plus, Search, Calendar, AlertTriangle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/kv-store';
import { AuthLayout } from '@/components/layout/auth-layout';
import type { Debt } from '@/lib/database-schema';
import { format, isPast, differenceInDays } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function DebtsPage() {
  const { 
    debts, 
    currencies, 
    clients,
    addDebt, 
    updateDebt, 
    deleteDebt,
    user 
  } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    currencyId: '1',
    dueDate: '',
    type: 'payable' as const,
    clientId: 'none',
    description: '',
  });

  // Apply filters
  const filteredDebts = debts.filter(debt => {
    // Search filter
    const matchesSearch = 
      debt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clients.find(c => c.id === debt.clientId)?.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Type filter
    if (typeFilter !== 'all' && debt.type !== typeFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && debt.status !== statusFilter) return false;

    return true;
  });

  const formatCurrency = (amount: number, currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return `${currency?.symbol || '₺'} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (debt: Debt) => {
    const isOverdue = isPast(debt.dueDate) && debt.status === 'pending';
    const daysUntilDue = differenceInDays(debt.dueDate, new Date());
    
    if (debt.status === 'paid') {
      return <Badge className="bg-green-100 text-green-800">Ödendi</Badge>;
    }
    
    if (isOverdue) {
      return <Badge className="bg-red-100 text-red-800">Gecikmiş</Badge>;
    }
    
    if (daysUntilDue <= 7 && debt.status === 'pending') {
      return <Badge className="bg-orange-100 text-orange-800">Yaklaşıyor</Badge>;
    }
    
    if (debt.status === 'pending') {
      return <Badge className="bg-blue-100 text-blue-800">Bekliyor</Badge>;
    }
    
    return <Badge className="bg-gray-100 text-gray-800">Bilinmiyor</Badge>;
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      currencyId: '1',
      dueDate: '',
      type: 'payable',
      clientId: 'none',
      description: '',
    });
    setEditingDebt(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt);
    setFormData({
      title: debt.title,
      amount: debt.amount.toString(),
      currencyId: debt.currencyId,
      dueDate: format(debt.dueDate, 'yyyy-MM-dd'),
      type: debt.type,
      clientId: debt.clientId || 'none',
      description: debt.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.amount || !formData.dueDate) {
      return;
    }

    const debtData = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      currencyId: formData.currencyId,
      dueDate: new Date(formData.dueDate),
      type: formData.type,
      status: 'pending' as const,
      clientId: formData.clientId && formData.clientId !== 'none' ? formData.clientId : undefined,
      description: formData.description || undefined,
      userId: user?.id || '1',
    };

    if (editingDebt) {
      updateDebt(editingDebt.id, debtData);
    } else {
      addDebt(debtData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (debt: Debt) => {
    if (confirm(`${debt.title} borç kaydını silmek istediğinizden emin misiniz?`)) {
      deleteDebt(debt.id);
    }
  };

  const markAsPaid = (debt: Debt) => {
    updateDebt(debt.id, { status: 'paid' });
  };

  const markAsPending = (debt: Debt) => {
    updateDebt(debt.id, { status: 'pending' });
  };

  // Statistics
  const totalPayables = filteredDebts
    .filter(d => d.type === 'payable' && d.status === 'pending')
    .reduce((sum, d) => sum + d.amount, 0);
    
  const totalReceivables = filteredDebts
    .filter(d => d.type === 'receivable' && d.status === 'pending')
    .reduce((sum, d) => sum + d.amount, 0);
    
  const overdueDebts = filteredDebts
    .filter(d => isPast(d.dueDate) && d.status === 'pending');

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Borç Takibi</h1>
            <p className="text-muted-foreground">
              Alacak ve borçlarınızı takip edin
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Borç/Alacak Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingDebt ? 'Borç/Alacak Düzenle' : 'Yeni Borç/Alacak Kaydı'}
                </DialogTitle>
                <DialogDescription>
                  Borç veya alacak bilgilerini girin. Zorunlu alanlar (*) ile işaretlenmiştir.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Başlık *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Kredi kartı borcu, müşteri alacağı vb."
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Tür *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payable">Ödenecek (Borç)</SelectItem>
                        <SelectItem value="receivable">Alınacak (Alacak)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
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
                    <Label htmlFor="currency">Para Birimi</Label>
                    <Select
                      value={formData.currencyId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currencyId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.id} value={currency.id}>
                            {currency.symbol} {currency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Vade Tarihi *</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="clientId">İlgili Cari (Opsiyonel)</Label>
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detaylı açıklama"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit">
                    {editingDebt ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Borç/Alacak ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Türler</SelectItem>
              <SelectItem value="payable">Ödenecek (Borç)</SelectItem>
              <SelectItem value="receivable">Alınacak (Alacak)</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="pending">Bekliyor</SelectItem>
              <SelectItem value="paid">Ödendi</SelectItem>
              <SelectItem value="overdue">Gecikmiş</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Borç</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalPayables, '1')}
              </div>
              <p className="text-xs text-muted-foreground">
                Ödenecek tutarlar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Alacak</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalReceivables, '1')}
              </div>
              <p className="text-xs text-muted-foreground">
                Alınacak tutarlar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Durum</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                totalReceivables - totalPayables >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(totalReceivables - totalPayables, '1')}
              </div>
              <p className="text-xs text-muted-foreground">
                Alacak - Borç
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gecikmiş</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {overdueDebts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Vadesi geçmiş kayıt
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Debt List */}
        <Card>
          <CardHeader>
            <CardTitle>Borç/Alacak Kayıtları</CardTitle>
            <CardDescription>
              {filteredDebts.length} kayıt gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDebts.length > 0 ? (
              <div className="space-y-4">
                {filteredDebts
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((debt) => {
                    const client = clients.find(c => c.id === debt.clientId);
                    const isOverdue = isPast(debt.dueDate) && debt.status === 'pending';
                    const daysUntilDue = differenceInDays(debt.dueDate, new Date());
                    
                    return (
                      <div key={debt.id} className={`flex items-center justify-between p-4 border rounded-lg ${
                        isOverdue ? 'border-red-200 bg-red-50' : ''
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full ${
                              debt.type === 'payable' ? 'bg-red-500' : 'bg-green-500'
                            }`} />
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{debt.title}</h3>
                                {getStatusBadge(debt)}
                                {debt.type === 'payable' && (
                                  <Badge variant="outline" className="text-red-700">Borç</Badge>
                                )}
                                {debt.type === 'receivable' && (
                                  <Badge variant="outline" className="text-green-700">Alacak</Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                <span>Vade: {format(debt.dueDate, 'dd MMM yyyy', { locale: tr })}</span>
                                {client && <span>{client.name}</span>}
                                {debt.status === 'pending' && (
                                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                    {isOverdue 
                                      ? `${Math.abs(daysUntilDue)} gün gecikmiş`
                                      : daysUntilDue === 0 
                                        ? 'Bugün'
                                        : `${daysUntilDue} gün kaldı`
                                    }
                                  </span>
                                )}
                              </div>
                              
                              {debt.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {debt.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`text-lg font-semibold ${
                              debt.type === 'payable' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {debt.type === 'payable' ? '-' : '+'}
                              {formatCurrency(debt.amount, debt.currencyId)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {debt.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {debt.status === 'pending' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsPaid(debt)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Ödendi
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsPending(debt)}
                                className="text-orange-600 hover:text-orange-700"
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Bekliyor
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(debt)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(debt)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                    ? 'Filtrelere uygun kayıt bulunamadı.'
                    : 'Henüz borç/alacak kaydı eklenmemiş.'
                  }
                </p>
                {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                  <Button onClick={openAddDialog} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk borç/alacak kaydınızı ekleyin
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
