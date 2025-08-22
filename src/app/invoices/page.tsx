'use client';

import { useState, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/lib/kv-store';
import { AuthLayout } from '@/components/layout/auth-layout';
import type { Invoice, InvoiceItem, Client } from '@/lib/database-schema';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Users,
  Calculator,
  RefreshCw,
} from 'lucide-react';

interface InvoiceFormData {
  clientId: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  description: string;
  items: InvoiceItem[];
  vatRate: string;
  tevkifatApplied: boolean;
  tevkifatRate: string;
  notes: string;
  isRecurring: boolean;
  recurringPeriod: 'monthly' | 'quarterly' | 'yearly';
  recurringMonths: string;
  currencyId: string;
}

export default function InvoicesPage() {
  const { 
    invoices,
    clients,
    currencies,
    companySettings,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    markInvoiceAsPaid,
    addClient,
    user 
  } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuickClientDialogOpen, setIsQuickClientDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    invoiceNumber: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    description: '',
    items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
    vatRate: '18',
    tevkifatApplied: false,
    tevkifatRate: '7/10',
    notes: '',
    isRecurring: false,
    recurringPeriod: 'monthly',
    recurringMonths: '12',
    currencyId: '1',
  });

  const [quickClientData, setQuickClientData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    currencyId: '1',
  });

  // Form hesaplamaları
  const calculations = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const vatRate = parseFloat(formData.vatRate) / 100;
    const vatAmount = subtotal * vatRate;
    const totalBeforeTevkifat = subtotal + vatAmount;
    
    let tevkifatAmount = 0;
    if (formData.tevkifatApplied && formData.tevkifatRate) {
      const [numerator, denominator] = formData.tevkifatRate.split('/').map(Number);
      tevkifatAmount = vatAmount * (numerator / denominator);
    }
    
    const total = totalBeforeTevkifat;
    const netAmountAfterTevkifat = total - tevkifatAmount;
    
    return {
      subtotal,
      vatAmount,
      tevkifatAmount,
      total,
      netAmountAfterTevkifat,
    };
  }, [formData.items, formData.vatRate, formData.tevkifatApplied, formData.tevkifatRate]);

  // Filtrelenmiş faturalar
  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesClient = clientFilter === 'all' || invoice.clientId === clientFilter;
    
    return matchesSearch && matchesStatus && matchesClient;
  });

  const formatCurrency = (amount: number, currencyId?: string) => {
    const currency = currencies.find(c => c.id === (currencyId || '1'));
    return `${currency?.symbol || '₺'} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const statusConfig = {
      draft: { label: 'Taslak', variant: 'secondary' as const, icon: Clock },
      sent: { label: 'Gönderildi', variant: 'default' as const, icon: Eye },
      paid: { label: 'Ödendi', variant: 'default' as const, icon: CheckCircle },
      overdue: { label: 'Gecikti', variant: 'destructive' as const, icon: AlertCircle },
      cancelled: { label: 'İptal', variant: 'outline' as const, icon: XCircle },
    };
    
    const config = statusConfig[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const generateInvoiceNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const existingCount = invoices.filter(inv => 
      inv.invoiceNumber.startsWith(`FAT-${year}${month}`)
    ).length;
    
    return `FAT-${year}${month}-${String(existingCount + 1).padStart(3, '0')}`;
  };

  const addInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setFormData(prev => ({ 
      ...prev, 
      items: [...prev.items, newItem] 
    }));
  };

  const removeInvoiceItem = (id: string) => {
    setFormData(prev => ({ 
      ...prev, 
      items: prev.items.filter(item => item.id !== id) 
    }));
  };

  const updateInvoiceItem = (id: string, updates: Partial<InvoiceItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      invoiceNumber: '',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      description: '',
      items: [{ id: '1', description: '', quantity: 1, unitPrice: 0, total: 0 }],
      vatRate: '18',
      tevkifatApplied: false,
      tevkifatRate: '7/10',
      notes: '',
      isRecurring: false,
      recurringPeriod: 'monthly',
      recurringMonths: '12',
      currencyId: '1',
    });
    setEditingInvoice(null);
  };

  const resetQuickClientForm = () => {
    setQuickClientData({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxNumber: '',
      currencyId: '1',
    });
  };

  const handleQuickClientSubmit = async () => {
    if (!quickClientData.name.trim()) return;

    await addClient({
      ...quickClientData,
      contactPerson: '',
      contractStartDate: new Date(),
      contractEndDate: addDays(new Date(), 365),
      balance: 0,
      isActive: true,
      userId: user?.id || '1',
    });

    // Yeni eklenen cariyi seç
    const newClient = clients[clients.length - 1];
    if (newClient) {
      setFormData(prev => ({ ...prev, clientId: newClient.id }));
    }

    resetQuickClientForm();
    setIsQuickClientDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.clientId || !formData.description || formData.items.length === 0) {
      return;
    }

    const invoiceData = {
      clientId: formData.clientId,
      invoiceNumber: formData.invoiceNumber || generateInvoiceNumber(),
      issueDate: new Date(formData.issueDate),
      dueDate: new Date(formData.dueDate),
      description: formData.description,
      items: formData.items,
      subtotal: calculations.subtotal,
      vatRate: parseFloat(formData.vatRate),
      vatAmount: calculations.vatAmount,
      tevkifatApplied: formData.tevkifatApplied,
      tevkifatRate: formData.tevkifatApplied ? formData.tevkifatRate : undefined,
      tevkifatAmount: calculations.tevkifatAmount,
      total: calculations.total,
      netAmountAfterTevkifat: calculations.netAmountAfterTevkifat,
      status: 'draft' as const,
      notes: formData.notes,
      isRecurring: formData.isRecurring,
      recurringPeriod: formData.isRecurring ? formData.recurringPeriod : undefined,
      recurringMonths: formData.isRecurring ? parseInt(formData.recurringMonths) : undefined,
      paidAmount: 0,
      remainingAmount: calculations.netAmountAfterTevkifat,
      currencyId: formData.currencyId,
      userId: user?.id || '1',
    };

    if (editingInvoice) {
      await updateInvoice(editingInvoice.id, invoiceData);
    } else {
      await addInvoice(invoiceData);
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientId: invoice.clientId,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: format(invoice.issueDate, 'yyyy-MM-dd'),
      dueDate: format(invoice.dueDate, 'yyyy-MM-dd'),
      description: invoice.description,
      items: invoice.items,
      vatRate: invoice.vatRate.toString(),
      tevkifatApplied: invoice.tevkifatApplied,
      tevkifatRate: invoice.tevkifatRate || '7/10',
      notes: invoice.notes || '',
      isRecurring: invoice.isRecurring,
      recurringPeriod: invoice.recurringPeriod || 'monthly',
      recurringMonths: invoice.recurringMonths?.toString() || '12',
      currencyId: invoice.currencyId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu faturayı silmek istediğinizden emin misiniz?')) {
      await deleteInvoice(id);
    }
  };

  const handleMarkAsPaid = async (id: string, amount: number) => {
    await markInvoiceAsPaid(id, amount);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Satış Faturaları</h1>
            <p className="text-muted-foreground">
              Müşterilerinize düzenlediğiniz faturaları yönetin
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setFormData(prev => ({ ...prev, invoiceNumber: generateInvoiceNumber() })); }}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Fatura
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Receipt className="h-5 w-5 mr-2" />
                  {editingInvoice ? 'Faturayı Düzenle' : 'Yeni Fatura Oluştur'}
                </DialogTitle>
                <DialogDescription>
                  Müşteriniz için yeni bir satış faturası oluşturun
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Temel Bilgiler */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientId">Cari Hesap *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.clientId} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Cari seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={isQuickClientDialogOpen} onOpenChange={setIsQuickClientDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Users className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Hızlı Cari Ekleme</DialogTitle>
                            <DialogDescription>
                              Yeni bir cari hesap oluşturun
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="quickClientName">Cari Adı *</Label>
                              <Input
                                id="quickClientName"
                                value={quickClientData.name}
                                onChange={(e) => setQuickClientData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Firma/Kişi adı"
                              />
                            </div>
                            <div>
                              <Label htmlFor="quickClientEmail">E-posta</Label>
                              <Input
                                id="quickClientEmail"
                                type="email"
                                value={quickClientData.email}
                                onChange={(e) => setQuickClientData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder="ornek@mail.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="quickClientPhone">Telefon</Label>
                              <Input
                                id="quickClientPhone"
                                value={quickClientData.phone}
                                onChange={(e) => setQuickClientData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="+90 555 123 45 67"
                              />
                            </div>
                            <div>
                              <Label htmlFor="quickClientTaxNumber">Vergi Numarası</Label>
                              <Input
                                id="quickClientTaxNumber"
                                value={quickClientData.taxNumber}
                                onChange={(e) => setQuickClientData(prev => ({ ...prev, taxNumber: e.target.value }))}
                                placeholder="1234567890"
                              />
                            </div>
                            <div>
                              <Label htmlFor="quickClientCurrency">Para Birimi</Label>
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
                            <Button variant="outline" onClick={() => setIsQuickClientDialogOpen(false)}>
                              İptal
                            </Button>
                            <Button onClick={handleQuickClientSubmit}>
                              Cari Ekle
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="invoiceNumber">Fatura Numarası</Label>
                    <Input
                      id="invoiceNumber"
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="Otomatik oluşturulacak"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="issueDate">Düzenleme Tarihi</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="dueDate">Vade Tarihi</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Fatura Açıklaması *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Fatura konusu"
                  />
                </div>

                {/* Fatura Kalemleri */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Fatura Kalemleri</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Kalem Ekle
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-5">
                          <Input
                            placeholder="Açıklama"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(item.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Miktar"
                            value={item.quantity}
                            onChange={(e) => updateInvoiceItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            placeholder="Birim Fiyat"
                            value={item.unitPrice}
                            onChange={(e) => updateInvoiceItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            value={formatCurrency(item.total)}
                            disabled
                          />
                        </div>
                        <div className="col-span-1">
                          {formData.items.length > 1 && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon"
                              onClick={() => removeInvoiceItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vergi ve Tevkifat */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vatRate">KDV Oranı (%)</Label>
                    <Select 
                      value={formData.vatRate} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, vatRate: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">%0</SelectItem>
                        <SelectItem value="1">%1</SelectItem>
                        <SelectItem value="8">%8</SelectItem>
                        <SelectItem value="18">%18</SelectItem>
                        <SelectItem value="20">%20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="currencyId">Para Birimi</Label>
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
                            {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="tevkifatApplied"
                    checked={formData.tevkifatApplied}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, tevkifatApplied: checked }))}
                  />
                  <Label htmlFor="tevkifatApplied">Tevkifat Uygulanacak</Label>
                </div>

                {formData.tevkifatApplied && (
                  <div>
                    <Label htmlFor="tevkifatRate">Tevkifat Oranı</Label>
                    <Select 
                      value={formData.tevkifatRate} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tevkifatRate: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {companySettings?.tevkifatRates?.map((rate) => (
                          <SelectItem key={rate.id} value={rate.code}>
                            {rate.code} - {rate.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Tekrarlama Seçenekleri */}
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Switch
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: checked }))}
                    />
                    <Label htmlFor="isRecurring" className="flex items-center">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Tekrarlanan Fatura
                    </Label>
                  </div>

                  {formData.isRecurring && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recurringPeriod">Tekrarlama Periyodu</Label>
                        <Select 
                          value={formData.recurringPeriod} 
                          onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => 
                            setFormData(prev => ({ ...prev, recurringPeriod: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Aylık</SelectItem>
                            <SelectItem value="quarterly">3 Aylık</SelectItem>
                            <SelectItem value="yearly">Yıllık</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="recurringMonths">Tekrarlama Sayısı</Label>
                        <Input
                          id="recurringMonths"
                          type="number"
                          min="1"
                          max="60"
                          value={formData.recurringMonths}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringMonths: e.target.value }))}
                          placeholder="Kaç kez tekrarlanacak"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Fatura ile ilgili notlar"
                    rows={3}
                  />
                </div>

                {/* Hesaplama Özeti */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Calculator className="h-5 w-5 mr-2" />
                      Fatura Özeti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Ara Toplam:</span>
                        <span>{formatCurrency(calculations.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>KDV ({formData.vatRate}%):</span>
                        <span>{formatCurrency(calculations.vatAmount)}</span>
                      </div>
                      {formData.tevkifatApplied && (
                        <div className="flex justify-between text-orange-600">
                          <span>Tevkifat ({formData.tevkifatRate}):</span>
                          <span>-{formatCurrency(calculations.tevkifatAmount)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>Toplam:</span>
                          <span>{formatCurrency(calculations.total)}</span>
                        </div>
                        {formData.tevkifatApplied && (
                          <div className="flex justify-between font-semibold text-green-600">
                            <span>Net Tahsilat:</span>
                            <span>{formatCurrency(calculations.netAmountAfterTevkifat)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleSubmit}>
                  {editingInvoice ? 'Güncelle' : 'Fatura Oluştur'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtreler */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Fatura numarası, açıklama veya cari ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Durum" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="sent">Gönderildi</SelectItem>
                  <SelectItem value="paid">Ödendi</SelectItem>
                  <SelectItem value="overdue">Gecikti</SelectItem>
                  <SelectItem value="cancelled">İptal</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Cari" />
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
            </div>
          </CardContent>
        </Card>

        {/* Fatura Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Faturalar ({filteredInvoices.length})</CardTitle>
            <CardDescription>
              Sistemdeki tüm satış faturalarınız
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fatura No</TableHead>
                      <TableHead>Cari</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Vade</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead className="text-right">Kalan</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const client = clients.find(c => c.id === invoice.clientId);
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                            {invoice.parentInvoiceId && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                #{invoice.recurringIndex}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{client?.name}</TableCell>
                          <TableCell>{invoice.description}</TableCell>
                          <TableCell>
                            {format(invoice.issueDate, 'dd MMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell>
                            {format(invoice.dueDate, 'dd MMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(invoice.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(invoice.total, invoice.currencyId)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(invoice.remainingAmount, invoice.currencyId)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setViewingInvoice(invoice)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(invoice)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {invoice.status !== 'paid' && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleMarkAsPaid(invoice.id, invoice.remainingAmount)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(invoice.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Henüz fatura bulunmuyor</h3>
                <p className="text-muted-foreground mb-4">
                  İlk satış faturanızı oluşturmak için yukarıdaki butonu kullanın
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
