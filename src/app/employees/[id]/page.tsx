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
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  DollarSign,
  Activity,
  Clock,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  FileText,
  Wallet,
  Gift,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  
  const { 
    employees, 
    currencies, 
    transactions,
    bonuses,
    showAmounts,
    deleteBonus
  } = useAppStore();

  const [filterPeriod, setFilterPeriod] = useState('all');

  // Personeli bul
  const employee = employees.find(e => e.id === employeeId);

  // Bonus silme fonksiyonu
  const handleDeleteBonus = (bonusId: string) => {
    if (confirm('Bu ek ödemeyi silmek istediğinizden emin misiniz?')) {
      deleteBonus(bonusId);
    }
  };

  const getBonusTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      bonus: 'Prim',
      advance: 'Avans',
      overtime: 'Mesai',
      commission: 'Komisyon',
    };
    return labels[type] || type;
  };

  // Bu personele ait maaş/avans/prim işlemleri
  const employeeTransactions = useMemo(() => {
    if (!employee) return [];
    
    // Sadece bonus kayıtlarını göster (transaction'lardan personel ödemelerini çıkar)
    let allItems = bonuses.filter(b => b.employeeId === employee.id).map(b => ({
      id: b.id,
      date: b.paymentDate,
      amount: b.amount,
      description: b.description,
      notes: `${getBonusTypeLabel(b.type)} - ${format(b.paymentDate, 'dd MMM yyyy', { locale: tr })}`,
      type: b.type,
      category: 'expense' as const,
      source: 'bonus'
    }));

    // Tarih filtresi
    if (filterPeriod !== 'all') {
      const now = new Date();
      const periodDays = parseInt(filterPeriod);
      const periodStart = new Date(now.getTime() - (periodDays * 24 * 60 * 60 * 1000));
      allItems = allItems.filter(t => new Date(t.date) >= periodStart);
    }

    return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bonuses, employee, filterPeriod]);

  // Personel maaş hesaplamaları
  const salaryCalculations = useMemo(() => {
    if (!employee) return {
      netSalary: 0,
      totalAdvances: 0,
      totalBonuses: 0,
      remaining: 0,
      nextPaymentDate: new Date()
    };

    const netSalary = employee.netSalary;
    
    // Bu ayki bonusları hesapla
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthBonuses = bonuses.filter(b => 
      b.employeeId === employee.id &&
      new Date(b.paymentDate).getMonth() === currentMonth &&
      new Date(b.paymentDate).getFullYear() === currentYear
    );
    
    const totalAdvances = thisMonthBonuses
      .filter(b => b.type === 'advance')
      .reduce((sum, b) => sum + b.amount, 0);
      
    const totalBonuses = thisMonthBonuses
      .filter(b => ['bonus', 'overtime', 'commission'].includes(b.type))
      .reduce((sum, b) => sum + b.amount, 0);
    
    const remaining = netSalary + totalBonuses - totalAdvances;

    return {
      netSalary,
      totalAdvances,
      totalBonuses,
      remaining,
      nextPaymentDate: new Date(new Date().getFullYear(), new Date().getMonth(), employee.paymentDay)
    };
  }, [employee, bonuses]);

  // İstatistikler
  const stats = useMemo(() => {
    if (!employee) return {
      totalSalaryPayments: 0,
      totalAdvances: 0,
      totalBonuses: 0,
      transactionCount: 0
    };

    // Transaction'lardan maaş ödemelerini bul
    const salaryPayments = transactions
      .filter(t => t.employeeId === employee.id && t.description.toLowerCase().includes('maaş'))
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Bonuslardan avansları ve primleri ayır
    const employeeBonuses = bonuses.filter(b => b.employeeId === employee.id);
    
    const advances = employeeBonuses
      .filter(b => b.type === 'advance')
      .reduce((sum, b) => sum + b.amount, 0);

    const bonusPayments = employeeBonuses
      .filter(b => ['bonus', 'overtime', 'commission'].includes(b.type))
      .reduce((sum, b) => sum + b.amount, 0);

    return {
      totalSalaryPayments: salaryPayments,
      totalAdvances: advances,
      totalBonuses: bonusPayments,
      transactionCount: employeeTransactions.length
    };
  }, [bonuses, employee, transactions]);

  // Grafik verisi - son 12 aylık maaş ödemeleri
  const chartData = useMemo(() => {
    if (!employee) return [];

    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return date;
    });

    return last12Months.map(date => {
             // Bu ay için transaction'ları bul
       const monthTransactions = transactions.filter(t => {
         if (t.employeeId !== employee.id) return false;
         const tDate = new Date(t.transactionDate);
         return tDate.getFullYear() === date.getFullYear() && 
                tDate.getMonth() === date.getMonth() &&
                t.description.toLowerCase().includes('maaş');
       });
      
      // Bu ay için bonusları bul
      const monthBonuses = bonuses.filter(b => {
        if (b.employeeId !== employee.id) return false;
        const bDate = new Date(b.paymentDate);
        return bDate.getFullYear() === date.getFullYear() && 
               bDate.getMonth() === date.getMonth();
      });
      
             const salary = monthTransactions
         .reduce((sum, t) => sum + t.amount, 0);
      
      const advance = monthBonuses
        .filter(b => b.type === 'advance')
        .reduce((sum, b) => sum + b.amount, 0);

      const bonus = monthBonuses
        .filter(b => ['bonus', 'overtime', 'commission'].includes(b.type))
        .reduce((sum, b) => sum + b.amount, 0);

      return {
        month: format(date, 'MMM yyyy', { locale: tr }),
        salary,
        advance,
        bonus,
        net: salary + bonus - advance
             };
     });
   }, [bonuses, employee, transactions]);

  const currency = currencies.find(c => c.id === '1'); // TRY default
  
  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return `${currency?.symbol || 'TL'} 0.00`;
    }
    const value = showAmounts ? amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : '***.**';
    return `${currency?.symbol || 'TL'} ${value}`;
  };

  if (!employee) {
    return (
      <AuthLayout>
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold mb-4">Personel Bulunamadı</h1>
          <Button onClick={() => router.push('/employees')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.push('/employees')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <User className="h-8 w-8 mr-3" />
                {employee.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                {employee.position} • {format(employee.createdAt, 'dd MMMM yyyy', { locale: tr })} tarihinde işe başladı
              </p>
            </div>
          </div>
        </div>

        {/* Personel Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {employee.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.email}</span>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.phone}</span>
                </div>
              )}
              {employee.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employee.address}</span>
                </div>
              )}
              {employee.emergencyContact && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Acil: {employee.emergencyContact}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">İş Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Pozisyon: {employee.position}</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Aylık Maaş: {formatCurrency(employee.netSalary)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Ödeme Günü: Her ayın {employee.paymentDay}. günü</span>
              </div>
              {employee.contractStartDate && (
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Sözleşme: {format(new Date(employee.contractStartDate), 'dd/MM/yyyy', { locale: tr })}
                    {employee.contractEndDate && ` - ${format(new Date(employee.contractEndDate), 'dd/MM/yyyy', { locale: tr })}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Bu Ay Durum</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Durum:</span>
                <Badge variant={employee.isActive ? "default" : "secondary"}>
                  {employee.isActive ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Net Maaş:</span>
                <span className="font-medium">{formatCurrency(salaryCalculations.netSalary)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Prim:</span>
                <span className="font-medium text-blue-600">+{formatCurrency(salaryCalculations.totalBonuses)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avans:</span>
                <span className="font-medium text-red-600">-{formatCurrency(salaryCalculations.totalAdvances)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kalan:</span>
                <span className="font-medium text-green-600">{formatCurrency(salaryCalculations.remaining)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Maaş</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalSalaryPayments)}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam ödenen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Avans</CardTitle>
              <Wallet className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalAdvances)}
              </div>
              <p className="text-xs text-muted-foreground">
                Avans ödemeleri
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Prim</CardTitle>
              <Gift className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.totalBonuses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Prim & İkramiye
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İşlem Sayısı</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.transactionCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam hareket
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Grafik */}
        {showAmounts && (
          <Card>
            <CardHeader>
              <CardTitle>Son 12 Ay Maaş Akışı</CardTitle>
              <CardDescription>Aylık maaş, avans ve prim hareketleri</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${currency?.symbol} ${Number(value).toLocaleString('tr-TR')}`,
                        name === 'salary' ? 'Maaş' : name === 'advance' ? 'Avans' : name === 'bonus' ? 'Prim' : 'Net'
                      ]}
                      labelFormatter={(label) => `Ay: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="salary" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="salary"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="advance" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="advance"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bonus" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="bonus"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="#8b5cf6" 
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

        {/* İşlem Geçmişi */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Maaş Hareketleri</CardTitle>
                <CardDescription>Bu personele ait maaş, avans ve prim işlemleri</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Zamanlar</SelectItem>
                    <SelectItem value="30">Son 30 Gün</SelectItem>
                    <SelectItem value="90">Son 3 Ay</SelectItem>
                    <SelectItem value="180">Son 6 Ay</SelectItem>
                    <SelectItem value="365">Son 1 Yıl</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {employeeTransactions.length > 0 ? (
              <Table>
                                 <TableHeader>
                   <TableRow>
                     <TableHead>Tarih</TableHead>
                     <TableHead>Tür</TableHead>
                     <TableHead>Açıklama</TableHead>
                     <TableHead>Notlar</TableHead>
                     <TableHead className="text-right">Tutar</TableHead>
                     <TableHead className="text-center">İşlemler</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {employeeTransactions.map((transaction) => {
                    let transactionType = 'Diğer';
                    let badgeColor = 'secondary';
                    let icon = <Activity className="h-3 w-3 mr-1" />;

                                         // Bonus kaynaklı işlemler
                     transactionType = getBonusTypeLabel(transaction.type);
                     if (transaction.type === 'advance') {
                       badgeColor = 'destructive';
                       icon = <Wallet className="h-3 w-3 mr-1" />;
                     } else {
                       badgeColor = 'default';
                       icon = <Gift className="h-3 w-3 mr-1" />;
                     }

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{format(new Date(transaction.date), 'dd MMM yyyy', { locale: tr })}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badgeColor as any}>
                            {icon}
                            {transactionType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{transaction.description}</div>
                        </TableCell>
                        <TableCell>
                          {transaction.notes && (
                            <div className="text-sm text-muted-foreground">{transaction.notes}</div>
                          )}
                        </TableCell>
                                                 <TableCell className="text-right font-mono">
                           <span className={
                             transactionType === 'Avans' ? 'text-red-600' : 'text-green-600'
                           }>
                             {transactionType === 'Avans' ? '-' : '+'}
                             {formatCurrency(transaction.amount)}
                           </span>
                         </TableCell>
                         <TableCell className="text-center">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleDeleteBonus(transaction.id)}
                             className="text-red-600 hover:text-red-700 hover:bg-red-50"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         </TableCell>
                       </TableRow>
                     );
                   })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz hareket yok
                </h3>
                <p className="text-gray-500 mb-4">
                  Bu personele ait henüz herhangi bir maaş/avans işlemi bulunmuyor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}