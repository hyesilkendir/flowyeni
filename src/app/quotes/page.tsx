'use client';

import React from 'react';
import { useState, useRef } from 'react';
import { Plus, Search, FileText, Download, Send, Edit, Trash2, Eye, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/lib/kv-store';
import { AuthLayout } from '@/components/layout/auth-layout';
import type { Quote, QuoteItem } from '@/lib/database-schema';
import { format, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function QuotesPage() {
  const { 
    quotes, 
    currencies, 
    clients,
    addQuote, 
    updateQuote, 
    deleteQuote,
    user,
    companySettings
  } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'), // 30 gün sonra
    currencyId: '1',
    notes: '',
    termsAndConditions: `• Bu teklif {{validUntil}} tarihine kadar geçerlidir.
• Proje başlangıcında %50 avans, teslimde %50 bakiye ödemesi yapılacaktır.
• Proje süresi onaydan sonra başlayacaktır.
• Ek revizyon talepleri için ayrıca ücretlendirme yapılacaktır.
• Hosting ve domain hizmetleri dahil değildir.`,
    // Tevkifat alanları
    tevkifatApplied: false,
    tevkifatRate: '',
  });

  const [quoteItems, setQuoteItems] = useState<Omit<QuoteItem, 'id' | 'quoteId'>[]>([
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 18,
      total: 0,
      order: 0,
    }
  ]);

  // Apply filters
  const filteredQuotes = quotes.filter(quote => {
    // Search filter
    const client = clients.find(c => c.id === quote.clientId);
    const matchesSearch = 
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter !== 'all' && quote.status !== statusFilter) return false;

    return true;
  });

  const formatCurrency = (amount: number, currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return `${currency?.symbol || '₺'} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Taslak', className: 'bg-gray-100 text-gray-800' },
      sent: { label: 'Gönderildi', className: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'Kabul Edildi', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Reddedildi', className: 'bg-red-100 text-red-800' },
      expired: { label: 'Süresi Doldu', className: 'bg-orange-100 text-orange-800' },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const generateQuoteNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const count = quotes.length + 1;
    return `TKL-${year}${month}${day}-${String(count).padStart(3, '0')}`;
  };

  const calculateItemTotal = (item: typeof quoteItems[0]) => {
    const subtotal = item.quantity * item.unitPrice;
    const vatAmount = (subtotal * item.vatRate) / 100;
    return subtotal + vatAmount;
  };

  const calculateQuoteTotals = () => {
    const subtotal = quoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const vatAmount = quoteItems.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      return sum + (itemSubtotal * item.vatRate) / 100;
    }, 0);
    const total = subtotal + vatAmount;
    
    // Tevkifat hesaplama
    let tevkifatAmount = 0;
    let netAmountAfterTevkifat = total;
    
    if (formData.tevkifatApplied && formData.tevkifatRate) {
      const tevkifat = companySettings?.tevkifatRates?.find(rate => rate.code === formData.tevkifatRate);
      if (tevkifat) {
        // Tevkifat sadece KDV tutarı üzerinden hesaplanır
        tevkifatAmount = vatAmount * (tevkifat.numerator / tevkifat.denominator);
        netAmountAfterTevkifat = total - tevkifatAmount;
      }
    }
    
    return { subtotal, vatAmount, total, tevkifatAmount, netAmountAfterTevkifat };
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      title: '',
      validUntil: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      currencyId: '1',
      notes: '',
      termsAndConditions: `• Bu teklif {{validUntil}} tarihine kadar geçerlidir.
• Proje başlangıcında %50 avans, teslimde %50 bakiye ödemesi yapılacaktır.
• Proje süresi onaydan sonra başlayacaktır.
• Ek revizyon talepleri için ayrıca ücretlendirme yapılacaktır.
• Hosting ve domain hizmetleri dahil değildir.`,
      // Tevkifat alanları
      tevkifatApplied: false,
      tevkifatRate: '',
    });
    setQuoteItems([
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        vatRate: 18,
        total: 0,
        order: 0,
      }
    ]);
    setEditingQuote(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.title.trim() || quoteItems.length === 0) {
      return;
    }

    const totals = calculateQuoteTotals();
    
    const quoteData = {
      clientId: formData.clientId,
      quoteNumber: editingQuote?.quoteNumber || generateQuoteNumber(),
      title: formData.title,
      validUntil: new Date(formData.validUntil),
      status: 'draft' as const,
      subtotal: totals.subtotal,
      vatAmount: totals.vatAmount,
      total: totals.total,
      currencyId: formData.currencyId,
      notes: formData.notes || undefined,
      termsAndConditions: formData.termsAndConditions || undefined,
      // Tevkifat alanları
      tevkifatApplied: formData.tevkifatApplied,
      tevkifatRate: formData.tevkifatApplied ? formData.tevkifatRate : undefined,
      tevkifatAmount: formData.tevkifatApplied ? totals.tevkifatAmount : undefined,
      netAmountAfterTevkifat: formData.tevkifatApplied ? totals.netAmountAfterTevkifat : undefined,
      userId: user?.id || '1',
    };

    if (editingQuote) {
      updateQuote(editingQuote.id, quoteData);
    } else {
      addQuote(quoteData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (quote: Quote) => {
    if (confirm(`${quote.quoteNumber} numaralı teklifi silmek istediğinizden emin misiniz?`)) {
      deleteQuote(quote.id);
    }
  };

  const updateQuoteStatus = (quoteId: string, status: string) => {
    updateQuote(quoteId, { status: status as any });
  };

  const addQuoteItem = () => {
    setQuoteItems(prev => [...prev, {
      description: '',
      quantity: 1,
      unitPrice: 0,
      vatRate: 18,
      total: 0,
      order: prev.length,
    }]);
  };

  const removeQuoteItem = (index: number) => {
    setQuoteItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuoteItem = (index: number, field: string, value: any) => {
    setQuoteItems(prev => prev.map((item, i) => {
      if (i === index) {
        const updated = { ...item, [field]: value };
        updated.total = calculateItemTotal(updated);
        return updated;
      }
      return item;
    }));
  };

  const duplicateQuote = (quote: Quote) => {
    const newQuote = {
      ...quote,
      quoteNumber: generateQuoteNumber(),
      status: 'draft' as const,
      title: `${quote.title} (Kopya)`,
      validUntil: addDays(new Date(), 30),
    };
    delete (newQuote as any).id;
    delete (newQuote as any).createdAt;
    delete (newQuote as any).updatedAt;
    
    addQuote(newQuote);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (quote: Quote) => {
    setFormData({
      clientId: quote.clientId,
      title: quote.title,
      validUntil: format(quote.validUntil, 'yyyy-MM-dd'),
      currencyId: quote.currencyId,
      notes: quote.notes || '',
      termsAndConditions: quote.termsAndConditions || `• Bu teklif {{validUntil}} tarihine kadar geçerlidir.
• Proje başlangıcında %50 avans, teslimde %50 bakiye ödemesi yapılacaktır.
• Proje süresi onaydan sonra başlayacaktır.
• Ek revizyon talepleri için ayrıca ücretlendirme yapılacaktır.
• Hosting ve domain hizmetleri dahil değildir.`,
      // Tevkifat alanları
      tevkifatApplied: quote.tevkifatApplied || false,
      tevkifatRate: quote.tevkifatRate || '',
    });
    setEditingQuote(quote);
    setIsDialogOpen(true);
  };

  const openViewDialog = (quote: Quote) => {
    setViewingQuote(quote);
    setIsViewDialogOpen(true);
  };

  const downloadPDF = async () => {
    if (!viewingQuote) return;

    // PDF için gizli div oluştur
    const pdfElement = document.createElement('div');
    pdfElement.style.position = 'absolute';
    pdfElement.style.left = '-9999px';
    pdfElement.style.top = '0';
    pdfElement.style.width = '210mm'; // A4 genişliği
    pdfElement.style.backgroundColor = '#ffffff';
    pdfElement.style.fontFamily = 'Arial, sans-serif';
    pdfElement.style.fontSize = '12px';
    pdfElement.style.lineHeight = '1.4';
    pdfElement.style.color = '#000000';

    const client = clients.find(c => c.id === viewingQuote.clientId);
    const { companySettings } = useAppStore.getState();

    pdfElement.innerHTML = `
      <div style="padding: 20mm; min-height: 277mm; box-sizing: border-box;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
          <div>
            ${companySettings?.quoteLogo ? 
              `<img src="${companySettings.quoteLogo}" alt="${companySettings.companyName}" style="max-height: 60px; margin-bottom: 10px;" />` : 
              `<h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #1e40af;">${companySettings?.companyName || 'CALAF.CO'}</h1>`
            }
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${companySettings?.address || 'İstanbul, Türkiye'}</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #666;">Tel: ${companySettings?.phone || '+90 212 555 0000'}</p>
            <p style="margin: 2px 0 0 0; font-size: 12px; color: #666;">${companySettings?.email || 'info@calaf.co'}</p>
            ${companySettings?.website ? `<p style="margin: 2px 0 0 0; font-size: 12px; color: #666;">${companySettings.website}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 24px; font-weight: bold; color: #dc2626;">TEKLİF</h2>
            <p style="margin: 8px 0 0 0; font-family: monospace; font-size: 14px; font-weight: bold;">${viewingQuote.quoteNumber}</p>
            <p style="margin: 8px 0 0 0; font-size: 12px;">Tarih: ${format(viewingQuote.createdAt, 'dd/MM/yyyy', { locale: tr })}</p>
            <p style="margin: 2px 0 0 0; font-size: 12px;">Geçerlilik: ${format(viewingQuote.validUntil, 'dd/MM/yyyy', { locale: tr })}</p>
          </div>
        </div>

        <!-- Client Info -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #1e40af;">MÜŞTERİ BİLGİLERİ</h3>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; border-left: 4px solid #1e40af;">
            <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 14px;">${client?.name || 'Müşteri'}</p>
            ${client?.email ? `<p style="margin: 0 0 3px 0; font-size: 12px;">E-posta: ${client.email}</p>` : ''}
            ${client?.phone ? `<p style="margin: 0 0 3px 0; font-size: 12px;">Telefon: ${client.phone}</p>` : ''}
            ${client?.address ? `<p style="margin: 0 0 3px 0; font-size: 12px;">Adres: ${client.address}</p>` : ''}
            ${client?.contactPerson ? `<p style="margin: 0; font-size: 12px;">Yetkili: ${client.contactPerson}</p>` : ''}
          </div>
        </div>

        <!-- Project Title -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #1e40af;">PROJE DETAYI</h3>
          <h4 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #000;">${viewingQuote.title}</h4>
          ${viewingQuote.notes ? `<p style="margin: 0; font-size: 12px; color: #666; line-height: 1.5;">${viewingQuote.notes}</p>` : ''}
        </div>

        <!-- Services Table -->
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #1e40af;">HİZMET KALEMLERİ</h3>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px 8px; text-align: left; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">AÇIKLAMA</th>
                <th style="padding: 12px 8px; text-align: center; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold; width: 80px;">MİKTAR</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold; width: 100px;">BİRİM FİYAT</th>
                <th style="padding: 12px 8px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold; width: 100px;">TOPLAM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px 8px; border: 1px solid #e5e7eb; font-size: 12px;">${viewingQuote.title}</td>
                <td style="padding: 12px 8px; text-align: center; border: 1px solid #e5e7eb; font-size: 12px;">1</td>
                <td style="padding: 12px 8px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px;">${formatCurrency(viewingQuote.subtotal, viewingQuote.currencyId)}</td>
                <td style="padding: 12px 8px; text-align: right; border: 1px solid #e5e7eb; font-size: 12px; font-weight: bold;">${formatCurrency(viewingQuote.subtotal, viewingQuote.currencyId)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="margin-bottom: 40px;">
          <div style="display: flex; justify-content: flex-end;">
            <div style="width: 300px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 12px; text-align: right; font-size: 12px; border-bottom: 1px solid #e5e7eb;">Ara Toplam:</td>
                  <td style="padding: 8px 12px; text-align: right; font-size: 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">${formatCurrency(viewingQuote.subtotal, viewingQuote.currencyId)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; text-align: right; font-size: 12px; border-bottom: 1px solid #e5e7eb;">KDV (${((viewingQuote.vatAmount / viewingQuote.subtotal) * 100).toFixed(0)}%):</td>
                  <td style="padding: 8px 12px; text-align: right; font-size: 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">${formatCurrency(viewingQuote.vatAmount, viewingQuote.currencyId)}</td>
                </tr>
                ${viewingQuote.tevkifatApplied && viewingQuote.tevkifatAmount ? `
                <tr style="background-color: #fff3cd; border: 1px solid #ffeaa7;">
                  <td style="padding: 8px 12px; text-align: right; font-size: 12px; color: #856404;">Tevkifat (${viewingQuote.tevkifatRate}):</td>
                  <td style="padding: 8px 12px; text-align: right; font-size: 12px; font-weight: bold; color: #856404;">-${formatCurrency(viewingQuote.tevkifatAmount, viewingQuote.currencyId)}</td>
                </tr>
                <tr style="background-color: #1e40af; color: white;">
                  <td style="padding: 12px 12px; text-align: right; font-size: 14px; font-weight: bold;">ÖDENECEK TUTAR:</td>
                  <td style="padding: 12px 12px; text-align: right; font-size: 16px; font-weight: bold;">${formatCurrency(viewingQuote.netAmountAfterTevkifat || 0, viewingQuote.currencyId)}</td>
                </tr>
                ` : `
                <tr style="background-color: #1e40af; color: white;">
                  <td style="padding: 12px 12px; text-align: right; font-size: 14px; font-weight: bold;">ÖDENECEK TUTAR:</td>
                  <td style="padding: 12px 12px; text-align: right; font-size: 16px; font-weight: bold;">${formatCurrency(viewingQuote.total, viewingQuote.currencyId)}</td>
                </tr>
                `}
              </table>
            </div>
          </div>
        </div>
        

        <!-- Terms -->
        ${viewingQuote.termsAndConditions ? `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1e40af;">ŞARTLAR VE KOŞULLAR</h3>
          <div style="margin: 0; font-size: 11px; color: #666; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">
            ${viewingQuote.termsAndConditions.replace(/{{validUntil}}/g, format(viewingQuote.validUntil, 'dd/MM/yyyy', { locale: tr }))}
          </div>
          <div style="height: 20mm;"></div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; margin-bottom: 10mm;">
          <p style="margin: 0; font-size: 10px; color: #666;">
            Bu teklif ${companySettings?.companyName || 'Calaf.co'} tarafından hazırlanmıştır. | ${companySettings?.website || 'www.calaf.co'} | ${companySettings?.email || 'info@calaf.co'}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(pdfElement);

    try {
      // HTML elemanını canvas'a çevir (tam yüksekliği yakala)
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // PDF oluştur (çok sayfa desteği)
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth; // sayfa genişliğine oturt
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // oranı koru

      let heightLeft = imgHeight;
      let position = 0;

      // İlk sayfa
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Kalan kısımlar için ek sayfalar
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // negatif değer, görseli yukarı kaydırarak kırp
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // PDF'i indir
      pdf.save(`${viewingQuote.quoteNumber}-${viewingQuote.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);

    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      // Gizli elementi temizle
      document.body.removeChild(pdfElement);
    }
  };

  const totals = calculateQuoteTotals();

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teklif Yönetimi</h1>
            <p className="text-muted-foreground">
              Müşteri tekliflerinizi oluşturun ve yönetin
            </p>
          </div>
          
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Teklif Oluştur
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Teklif ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="draft">Taslak</SelectItem>
              <SelectItem value="sent">Gönderildi</SelectItem>
              <SelectItem value="accepted">Kabul Edildi</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
              <SelectItem value="expired">Süresi Doldu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Teklif</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{quotes.length}</div>
              <p className="text-xs text-muted-foreground">
                Tüm teklifler
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kabul Edilen</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {quotes.filter(q => q.status === 'accepted').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Onaylanan teklifler
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {quotes.filter(q => q.status === 'sent').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Yanıt beklenen
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
              <FileText className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.total, 0),
                  '1'
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Kabul edilen değer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quote List */}
        <Card>
          <CardHeader>
            <CardTitle>Teklifler</CardTitle>
            <CardDescription>
              {filteredQuotes.length} teklif gösteriliyor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredQuotes.length > 0 ? (
              <div className="space-y-4">
                {filteredQuotes
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((quote) => {
                    const client = clients.find(c => c.id === quote.clientId);
                    
                    return (
                      <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{quote.title}</h3>
                                {getStatusBadge(quote.status)}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                <span className="font-mono">{quote.quoteNumber}</span>
                                <span>{client?.name}</span>
                                <span>Vade: {format(quote.validUntil, 'dd MMM yyyy', { locale: tr })}</span>
                                <span>Oluşturulma: {format(quote.createdAt, 'dd MMM yyyy', { locale: tr })}</span>
                              </div>
                              
                              {quote.notes && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {quote.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-blue-600">
                              {formatCurrency(quote.total, quote.currencyId)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              KDV: {formatCurrency(quote.vatAmount, quote.currencyId)}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openViewDialog(quote)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => duplicateQuote(quote)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            
                            {quote.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(quote)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {quote.status === 'draft' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuoteStatus(quote.id, 'sent')}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Gönder
                              </Button>
                            )}
                            
                            {quote.status === 'sent' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuoteStatus(quote.id, 'accepted')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  Kabul Et
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateQuoteStatus(quote.id, 'rejected')}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  Reddet
                                </Button>
                              </>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(quote)}
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
                  {searchTerm || statusFilter !== 'all'
                    ? 'Filtrelere uygun teklif bulunamadı.'
                    : 'Henüz teklif oluşturulmamış.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={openAddDialog} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk teklifinizi oluşturun
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Quote Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingQuote ? 'Teklifi Düzenle' : 'Yeni Teklif Oluştur'}
              </DialogTitle>
              <DialogDescription>
                Teklif bilgilerini ve kalemlerini girin.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Müşteri *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Müşteri seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="title">Teklif Başlığı *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Web tasarım projesi"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Geçerlilik Tarihi *</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notlar</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ek notlar ve koşullar"
                />
              </div>

              {/* Quote Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Teklif Kalemleri</h3>
                  <Button type="button" onClick={addQuoteItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Kalem Ekle
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Açıklama</TableHead>
                        <TableHead className="w-20">Miktar</TableHead>
                        <TableHead className="w-32">Birim Fiyat</TableHead>
                        <TableHead className="w-20">KDV %</TableHead>
                        <TableHead className="w-32">Toplam</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quoteItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => updateQuoteItem(index, 'description', e.target.value)}
                              placeholder="Hizmet açıklaması"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuoteItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateQuoteItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.vatRate}
                              onChange={(e) => updateQuoteItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(calculateItemTotal(item), formData.currencyId)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {quoteItems.length > 1 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeQuoteItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Şartlar ve Koşullar</Label>
                  <Textarea
                    id="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                    placeholder="Teklif şartları ve koşullarını girin..."
                    className="min-h-32"
                  />
                  <p className="text-sm text-muted-foreground">
                    💡 İpucu: {`{{validUntil}}`} yazarak geçerlilik tarihini otomatik ekleyebilirsiniz.
                  </p>
                </div>

                {/* Tevkifat Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="tevkifat-applied"
                      checked={formData.tevkifatApplied}
                      onCheckedChange={(checked) => setFormData(prev => ({ 
                        ...prev, 
                        tevkifatApplied: checked,
                        tevkifatRate: checked ? prev.tevkifatRate : ''
                      }))}
                    />
                    <Label htmlFor="tevkifat-applied" className="font-medium">
                      Bu faturada tevkifat uygulanacak
                    </Label>
                  </div>
                  
                  {formData.tevkifatApplied && (
                    <div className="space-y-2">
                      <Label htmlFor="tevkifat-rate">Tevkifat Oranı *</Label>
                      <Select
                        value={formData.tevkifatRate}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, tevkifatRate: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Tevkifat oranını seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySettings?.tevkifatRates
                            ?.filter(rate => rate.isActive)
                            .map((rate) => (
                              <SelectItem key={rate.id} value={rate.code}>
                                {rate.code} - {rate.description}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {formData.tevkifatRate && (
                        <p className="text-sm text-orange-600">
                          ⚠️ Tevkifat KDV tutarı üzerinden hesaplanacak ve alıcı tarafından ödenmeyecektir.
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ara Toplam:</span>
                      <span className="font-medium">
                        {formatCurrency(totals.subtotal, formData.currencyId)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>KDV Toplamı:</span>
                      <span className="font-medium">
                        {formatCurrency(totals.vatAmount, formData.currencyId)}
                      </span>
                    </div>
                    {formData.tevkifatApplied && totals.tevkifatAmount > 0 && (
                      <>
                        <div className="flex justify-between text-orange-600">
                          <span>Tevkifat ({formData.tevkifatRate}):</span>
                          <span className="font-medium">
                            -{formatCurrency(totals.tevkifatAmount, formData.currencyId)}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 text-blue-600">
                          <span>Alıcı Tarafından Ödenecek:</span>
                          <span>{formatCurrency(totals.netAmountAfterTevkifat, formData.currencyId)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Genel Toplam:</span>
                      <span>{formatCurrency(totals.total, formData.currencyId)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingQuote ? 'Güncelle' : 'Teklif Oluştur'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Quote Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Teklif Detayı</DialogTitle>
              <DialogDescription>
                {viewingQuote?.quoteNumber} - {viewingQuote?.title}
              </DialogDescription>
            </DialogHeader>
            
            {viewingQuote && (
              <div className="space-y-6 bg-white p-6">
                {/* Quote Header */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-4">CALAF.CO</h2>
                      <p className="text-sm text-muted-foreground">Reklam Ajansı</p>
                      <p className="text-sm text-muted-foreground">İstanbul, Türkiye</p>
                    </div>
                    <div className="text-right">
                      <h3 className="text-xl font-semibold">TEKLİF</h3>
                      <p className="text-sm font-mono">{viewingQuote.quoteNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Tarih: {format(viewingQuote.createdAt, 'dd/MM/yyyy', { locale: tr })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Geçerlilik: {format(viewingQuote.validUntil, 'dd/MM/yyyy', { locale: tr })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h4 className="font-medium mb-2">MÜŞTERİ</h4>
                  <div className="bg-white p-4 border rounded-lg">
                    <p className="font-medium">{clients.find(c => c.id === viewingQuote.clientId)?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {clients.find(c => c.id === viewingQuote.clientId)?.email}
                    </p>
                  </div>
                </div>

                {/* Quote Title */}
                <div>
                  <h4 className="font-medium mb-2">PROJE</h4>
                  <p className="text-lg font-medium">{viewingQuote.title}</p>
                  {viewingQuote.notes && (
                    <p className="text-muted-foreground mt-2">{viewingQuote.notes}</p>
                  )}
                </div>

                {/* Quote Items - Simulated data since we don't have QuoteItems in store yet */}
                <div>
                  <h4 className="font-medium mb-2">HİZMETLER</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Açıklama</TableHead>
                          <TableHead className="w-20">Miktar</TableHead>
                          <TableHead className="w-32">Birim Fiyat</TableHead>
                          <TableHead className="w-32">Toplam</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>Web Tasarım ve Geliştirme</TableCell>
                          <TableCell>1</TableCell>
                          <TableCell>{formatCurrency(viewingQuote.subtotal, viewingQuote.currencyId)}</TableCell>
                          <TableCell>{formatCurrency(viewingQuote.subtotal, viewingQuote.currencyId)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Ara Toplam:</span>
                      <span className="font-medium">
                        {formatCurrency(viewingQuote.subtotal, viewingQuote.currencyId)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>KDV:</span>
                      <span className="font-medium">
                        {formatCurrency(viewingQuote.vatAmount, viewingQuote.currencyId)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Genel Toplam:</span>
                      <span>{formatCurrency(viewingQuote.total, viewingQuote.currencyId)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Kapat
                  </Button>
                  <Button onClick={downloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF İndir
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthLayout>
  );
}
