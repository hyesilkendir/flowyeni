'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAppStore } from '@/lib/kv-store';
import { Plus, Edit, Trash2, Wallet, DollarSign, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function CashAccountsPage() {
  const router = useRouter();
  const { 
    cashAccounts, 
    currencies, 
    transactions,
    addCashAccount, 
    updateCashAccount, 
    deleteCashAccount 
  } = useAppStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    currencyId: '1', // TRY default
    balance: '0',
    isDefault: false
  });

  const resetForm = () => {
    setFormData({
      name: '',
      currencyId: '1',
      balance: '0',
      isDefault: false
    });
    setEditingAccount(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    if (editingAccount) {
      updateCashAccount(editingAccount, {
        name: formData.name,
        currencyId: formData.currencyId,
        balance: parseFloat(formData.balance) || 0,
        isDefault: formData.isDefault
      });
    } else {
      addCashAccount({
        name: formData.name,
        currencyId: formData.currencyId,
        balance: parseFloat(formData.balance) || 0,
        isDefault: formData.isDefault,
        isActive: true,
        userId: '1'
      });
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (account: any) => {
    setFormData({
      name: account.name,
      currencyId: account.currencyId,
      balance: account.balance.toString(),
      isDefault: account.isDefault
    });
    setEditingAccount(account.id);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bu kasayı silmek istediğinizden emin misiniz?')) {
      deleteCashAccount(id);
    }
  };

  const handleViewDetail = (accountId: string) => {
    router.push(`/cash-accounts/${accountId}`);
  };

  // Kasa bakiye hesaplama (işlemlerden)
  const calculateAccountBalance = (accountId: string) => {
    const accountTransactions = transactions.filter(t => 
      t.cashAccountId === accountId || (!t.cashAccountId && cashAccounts.find(ca => ca.id === accountId)?.isDefault)
    );
    
    const baseBalance = cashAccounts.find(ca => ca.id === accountId)?.balance || 0;
    
    return accountTransactions.reduce((balance, transaction) => {
      return transaction.type === 'income' 
        ? balance + transaction.amount 
        : balance - transaction.amount;
    }, baseBalance);
  };

  const formatCurrency = (amount: number, currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return `${currency?.symbol || 'TL'} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Kasa Yönetimi</h1>
            <p className="text-muted-foreground mt-2">
              Nakit hesaplarınızı yönetin ve takip edin
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Kasa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? 'Kasa Düzenle' : 'Yeni Kasa Ekle'}
                </DialogTitle>
                <DialogDescription>
                  {editingAccount 
                    ? 'Mevcut kasa bilgilerini güncelleyin' 
                    : 'Yeni nakit hesabı oluşturun'
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Kasa Adı</Label>
                  <Input
                    id="name"
                    placeholder="Ana Kasa"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
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
                          {currency.name} ({currency.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="balance">Başlangıç Bakiyesi</Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="0.00"
                    value={formData.balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                  />
                  <Label htmlFor="isDefault">Ana kasa olarak ayarla</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleSubmit}>
                  {editingAccount ? 'Güncelle' : 'Ekle'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kasa Özeti */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kasa</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cashAccounts.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Aktif kasa sayısı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Bakiye</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  cashAccounts.reduce((total, account) => 
                    total + calculateAccountBalance(account.id), 0
                  ), 
                  '1' // TRY
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Tüm kasaların toplamı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ana Kasa</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(() => {
                  const defaultAccount = cashAccounts.find(ca => ca.isDefault);
                  return defaultAccount 
                    ? formatCurrency(calculateAccountBalance(defaultAccount.id), defaultAccount.currencyId)
                    : 'TL 0.00';
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                {cashAccounts.find(ca => ca.isDefault)?.name || 'Tanımlanmamış'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kasa Listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Kasa Hesapları</CardTitle>
            <CardDescription>
              Mevcut nakit hesaplarınızın listesi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cashAccounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kasa Adı</TableHead>
                    <TableHead>Para Birimi</TableHead>
                    <TableHead>Mevcut Bakiye</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Oluşturulma</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashAccounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        {account.name}
                        {account.isDefault && (
                          <Badge variant="secondary" className="ml-2">Ana</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {currencies.find(c => c.id === account.currencyId)?.code || 'TRY'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(calculateAccountBalance(account.id), account.currencyId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.isActive ? "default" : "secondary"}>
                          {account.isActive ? 'Aktif' : 'Pasif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(account.createdAt, 'dd MMM yyyy', { locale: tr })}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(account.id)}
                            title="Kasa Detayları"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(account)}
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!account.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(account.id)}
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Henüz kasa hesabı yok
                </h3>
                <p className="text-gray-500 mb-4">
                  İlk kasa hesabınızı oluşturmak için yukarıdaki butonu kullanın.
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  İlk Kasayı Oluştur
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
