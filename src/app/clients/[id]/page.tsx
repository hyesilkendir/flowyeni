'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAppStore } from '@/lib/kv-store';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Building, 
  FileText,
  Download,
  Upload,
  CreditCard,
  DollarSign,
  Clock,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const { 
    clients, 
    currencies, 
    transactions,
    debts,
    quotes,
    showAmounts,
    getClientBalance,
    deleteTransaction,
    pendingBalances,
    markInvoiceAsPaid,
    invoices,
    processPaymentFromTransaction,
    getClientPendingBalance
  } = useAppStore();

  const [filterPeriod, setFilterPeriod] = useState('all');

  // Cariyi bul
  const client = clients.find(c => c.id === clientId);
  
  // Client'ın bekleyen bakiyelerini bul (sadece pending olanlar)
  const clientPendingBalances = pendingBalances.filter(pb => 
    pb.clientId === clientId && pb.status === 'pending'
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Bu cariye ait işlemleri bul
  const clientTransactions = useMemo(() => {
    let filtered = transactions.filter(t => t.clientId === clientId);

    // Tarih filtresi
    if (filterPeriod !== 'all') {
      const now = new Date();
      const periodDays = parseInt(filterPeriod);
      const periodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.transactionDate);
        return !isNaN(transactionDate.getTime()) && transactionDate >= periodStart;
      });
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions, clientId, filterPeriod]);

  // Bu cariye ait borç/alacaklar
  const clientDebts = useMemo(() => {
    return debts.filter(d => d.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [debts, clientId]);

  // Bu cariye ait teklifler
  const clientQuotes = useMemo(() => {
    return quotes.filter(q => q.clientId === clientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [quotes, clientId]);

  // İstatistikler
  const stats = useMemo(() => {
    const income = clientTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = clientTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingReceivables = clientDebts
      .filter(d => d.type === 'receivable' && d.status === 'pending')
      .reduce((sum, d) => sum + d.amount, 0);

    const pendingPayables = clientDebts
      .filter(d => d.type === 'payable' && d.status === 'pending')
      .reduce((sum, d) => sum + d.amount, 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      netFlow: income - expense,
      transactionCount: clientTransactions.length,
      pendingReceivables,
      pendingPayables,
      quotesCount: clientQuotes.length
    };
  }, [clientTransactions, clientDebts, clientQuotes]);

  // Grafik verisi - son 30 günlük akış
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    return last30Days.map(date => {
      const dayTransactions = clientTransactions.filter(t => 
        new Date(t.transactionDate).toDateString() === date.toDateString()
      );
      
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(date, 'dd/MM', { locale: tr }),
        income,
        expense,
        net: income - expense
      };
    });
  }, [clientTransactions]);

  if (!client) {
    return (
      <AuthLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">Cari Bulunamadı</h1>
          <Button onClick={() => router.push('/clients')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const currency = currencies.find(c => c.id === client.currencyId);
  
  const formatCurrency = (amount: number) => {
    const value = showAmounts ? amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '***.**';
    return `${currency?.symbol || 'TL'} ${value}`;
  };

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm('Bu işlemi silmek istediğinizden emin misiniz?')) {
      deleteTransaction(transactionId);
    }
  };

  const handleMarkAsPaid = async (pendingBalanceId: string, fullAmount: boolean = true) => {
    const pendingBalance = pendingBalances.find(pb => pb.id === pendingBalanceId);
    if (!pendingBalance) return;

    const invoice = invoices.find(inv => inv.id === pendingBalance.invoiceId);
    if (!invoice) return;

    const paymentAmount = fullAmount ? pendingBalance.amount : pendingBalance.amount;
    
    try {
      await markInvoiceAsPaid(invoice.id, paymentAmount);
      // Başarı mesajı burada gösterilebilir
    } catch (error) {
      console.error('Ödeme işlemi sırasında hata:', error);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/clients')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <User className="h-8 w-8 mr-3" />
                {client.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {currency?.name} ({currency?.code}) • {format(client.createdAt, 'dd MMMM yyyy', { locale: tr })} tarihinde eklendi
              </p>
            </div>
          </div>
        </div>

        {/* Cari Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.address}</span>
                </div>
              )}
              {client.contactPerson && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{client.contactPerson}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Şirket Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.taxNumber && (
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Vergi No: {client.taxNumber}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Bakiye: {formatCurrency(getClientBalance(client.id, client.currencyId))}</span>
              </div>
              {(() => {
                const pendingBalance = getClientPendingBalance(client.id, client.currencyId);
                if (pendingBalance > 0) {
                  return (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Bekleyen: {formatCurrency(pendingBalance)}</span>
                    </div>
                  );
                }
                return null;
              })()}
              {client.contractStartDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Sözleşme: {format(new Date(client.contractStartDate), 'dd/MM/yyyy', { locale: tr })}
                    {client.contractEndDate && ` - ${format(new Date(client.contractEndDate), 'dd/MM/yyyy', { locale: tr })}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Durum:</span>
                <Badge variant={client.isActive ? "default" : "secondary"}>
                  {client.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">İşlem Sayısı:</span>
                <span className="font-medium">{stats.transactionCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Teklif Sayısı:</span>
                <span className="font-medium">{stats.quotesCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam tahsilat
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Gider</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalExpense)}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam ödeme
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Alacak</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.pendingReceivables)}
              </div>
              <p className="text-xs text-muted-foreground">
                Tahsil edilecek
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Borç</CardTitle>
              <CreditCard className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.pendingPayables)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ödenecek
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Grafik */}
        {showAmounts && (
          <Card>
            <CardHeader>
              <CardTitle>Son 30 Gün Cari Akışı</CardTitle>
              <CardDescription>Günlük gelir ve gider hareketleri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${currency?.symbol} ${Number(value).toLocaleString('tr-TR')}`,
                        name === 'income' ? 'Gelir' : name === 'expense' ? 'Gider' : 'Net'
                      ]}
                      labelFormatter={(label) => `Tarih: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="income"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="expense"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="net"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bekleyen Alacaklar */}
        {clientPendingBalances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-500" />
                Bekleyen Alacaklar
              </CardTitle>
              <CardDescription>Ödenmemiş faturalar ve bekleyen ödemeler</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fatura</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Vade Tarihi</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientPendingBalances.map((pendingBalance) => {
                    const invoice = invoices.find(inv => inv.id === pendingBalance.invoiceId);
                    const isOverdue = new Date(pendingBalance.dueDate) < new Date();
                    
                    return (
                      <TableRow key={pendingBalance.id}>
                        <TableCell>
                          <div className="font-medium">
                            {invoice?.invoiceNumber || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {pendingBalance.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center space-x-2 ${isOverdue ? 'text-red-600' : ''}`}>
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(pendingBalance.dueDate), 'dd MMM yyyy', { locale: tr })}
                              {isOverdue && ' (GECİKTİ)'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                            {formatCurrency(pendingBalance.amount)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isOverdue ? 'destructive' : 'secondary'}>
                            {isOverdue ? 'Gecikti' : 'Bekliyor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(pendingBalance.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Ödendi
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* İşlem Geçmişi */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Cari Hareketleri</CardTitle>
                <CardDescription>Bu cariye ait tüm gelir ve gider işlemleri</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Zamanlar</SelectItem>
                    <SelectItem value="7">Son 7 Gün</SelectItem>
                    <SelectItem value="30">Son 30 Gün</SelectItem>
                    <SelectItem value="90">Son 3 Ay</SelectItem>
                    <SelectItem value="180">Son 6 Ay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {clientTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>KDV</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {(() => {
                              const transactionDate = new Date(transaction.transactionDate);
                              if (isNaN(transactionDate.getTime())) {
                                return 'Geçersiz Tarih';
                              }
                              return format(transactionDate, 'dd MMM yyyy', { locale: tr });
                            })()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === 'income' ? 'default' : 'destructive'}
                          className={transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {transaction.type === 'income' ? (
                            <>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Gelir
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Gider
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{transaction.description}</div>
                        {transaction.notes && (
                          <div className="text-sm text-muted-foreground">{transaction.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {transaction.isVatIncluded ? (
                          <Badge variant="outline" className="text-xs">
                            KDV %{transaction.vatRate} dahil
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">KDV yok</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {/* Eğer transaction fatura ödemesiyse, ödeme butonu göster */}
                          {transaction.type === 'income' && transaction.description.includes('Fatura:') && (() => {
                            const invoiceNumber = transaction.description.match(/Fatura: ([^\s]+)/)?.[1];
                            const relatedInvoice = invoices.find(inv => inv.invoiceNumber === invoiceNumber);
                            const pendingBalance = pendingBalances.find(pb => 
                              pb.invoiceId === relatedInvoice?.id && pb.status === 'pending'
                            );
                            
                            if (pendingBalance) {
                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsPaid(pendingBalance.id)}
                                  className="text-green-600 hover:text-green-700 border-green-200"
                                >
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  Ödendi
                                </Button>
                              );
                            }
                            return null;
                          })()}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz hareket yok
                </h3>
                <p className="text-gray-500 mb-4">
                  Bu cariye ait henüz herhangi bir işlem bulunmuyor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Borç/Alacak Listesi */}
        {clientDebts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Borç/Alacak Durumu</CardTitle>
              <CardDescription>Bu cariye ait bekleyen ödemeler</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oluşturma Tarihi</TableHead>
                    <TableHead>Vade Tarihi</TableHead>
                    <TableHead>Tür</TableHead>
                    <TableHead>Açıklama</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientDebts.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell>
                        {format(new Date(debt.createdAt), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(debt.dueDate), 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={debt.type === 'receivable' ? 'default' : 'secondary'}>
                          {debt.type === 'receivable' ? 'Alacak' : 'Borç'}
                        </Badge>
                      </TableCell>
                      <TableCell>{debt.description}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={debt.status === 'paid' ? 'default' : debt.status === 'pending' ? 'secondary' : 'destructive'}
                        >
                          {debt.status === 'paid' ? 'Ödendi' : debt.status === 'pending' ? 'Bekliyor' : 'Gecikmiş'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={debt.type === 'receivable' ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(debt.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthLayout>
  );
}