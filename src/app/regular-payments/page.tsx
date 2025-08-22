'use client';

import { useState } from 'react';
import { AuthLayout } from '@/components/layout/auth-layout';
import { useAppStore } from '@/lib/kv-store';
import type { RegularPayment } from '@/lib/database-schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Edit, Plus, Trash2 } from 'lucide-react';

export default function RegularPaymentsPage() {
  const { currencies, regularPayments, addRegularPayment, updateRegularPayment, deleteRegularPayment, user } = useAppStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RegularPayment | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    currencyId: '1',
    dueDate: '',
    frequency: 'monthly' as RegularPayment['frequency'],
    category: 'loan' as RegularPayment['category'],
    status: 'pending' as RegularPayment['status'],
    description: '',
  });

  const openAdd = () => {
    setEditing(null);
    setFormData({ title: '', amount: '', currencyId: '1', dueDate: '', frequency: 'monthly', category: 'loan', status: 'pending', description: '' });
    setIsDialogOpen(true);
  };

  const openEdit = (p: RegularPayment) => {
    setEditing(p);
    setFormData({
      title: p.title,
      amount: p.amount.toString(),
      currencyId: p.currencyId,
      dueDate: format(p.dueDate, 'yyyy-MM-dd'),
      frequency: p.frequency,
      category: p.category,
      status: p.status,
      description: p.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.dueDate) return;

    const payload = {
      title: formData.title,
      amount: parseFloat(formData.amount),
      currencyId: formData.currencyId,
      dueDate: new Date(formData.dueDate),
      frequency: formData.frequency,
      category: formData.category,
      status: formData.status,
      description: formData.description || undefined,
      userId: user?.id || '1',
    } as Omit<RegularPayment, 'id' | 'createdAt' | 'updatedAt'>;

    if (editing) {
      updateRegularPayment(editing.id, payload);
    } else {
      addRegularPayment(payload);
    }
    setIsDialogOpen(false);
  };

  const formatCurrency = (amount: number, currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return `${currency?.symbol || '₺'} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const categoryLabels: Record<RegularPayment['category'], string> = {
    loan: 'Kredi',
    installment: 'Taksit',
    rent: 'Kira',
    utilities: 'Faturalar (Elektrik/Su/İnternet)',
    food: 'Yemek',
    insurance: 'Sigorta',
    other: 'Diğer',
  };

  const frequencyLabels: Record<RegularPayment['frequency'], string> = {
    weekly: 'Haftalık',
    monthly: 'Aylık',
    quarterly: '3 Aylık',
    yearly: 'Yıllık',
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Düzenli Ödemeler</h1>
            <p className="text-muted-foreground">Kredi, taksit, kira, yemek, sigorta gibi düzenli giderleri yönetin</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4 mr-2" /> Yeni Düzenli Ödeme
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? 'Düzenli Ödeme Düzenle' : 'Yeni Düzenli Ödeme'}</DialogTitle>
                <DialogDescription>Zorunlu alanlar (*) ile işaretlidir.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Başlık *</Label>
                    <Input id="title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Tutar *</Label>
                    <Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Para Birimi</Label>
                    <Select value={formData.currencyId} onValueChange={(value) => setFormData(prev => ({ ...prev, currencyId: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.symbol} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">İlk/Varsayılan Vade *</Label>
                    <Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Sıklık</Label>
                    <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Haftalık</SelectItem>
                        <SelectItem value="monthly">Aylık</SelectItem>
                        <SelectItem value="quarterly">3 Aylık</SelectItem>
                        <SelectItem value="yearly">Yıllık</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select value={formData.category} onValueChange={(value: any) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loan">Kredi</SelectItem>
                        <SelectItem value="installment">Taksit</SelectItem>
                        <SelectItem value="rent">Kira</SelectItem>
                        <SelectItem value="utilities">Faturalar</SelectItem>
                        <SelectItem value="food">Yemek</SelectItem>
                        <SelectItem value="insurance">Sigorta</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Açıklama</Label>
                  <Input id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                  <Button type="submit">{editing ? 'Güncelle' : 'Kaydet'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Düzenli Ödemeler</CardTitle>
            <CardDescription>{regularPayments.length} kayıt</CardDescription>
          </CardHeader>
          <CardContent>
            {regularPayments.length > 0 ? (
              <div className="space-y-4">
                {regularPayments
                  .slice()
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{p.title}</h3>
                        <span className="text-xs text-muted-foreground">{categoryLabels[p.category]} • {frequencyLabels[p.frequency]}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Vade: {format(p.dueDate, 'dd MMM yyyy', { locale: tr })}
                      </div>
                      {p.description && (
                        <div className="text-sm text-muted-foreground mt-1">{p.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`text-right ${p.status === 'pending' ? 'text-red-600' : 'text-green-600' } font-semibold`}>
                        {formatCurrency(p.amount, p.currencyId)}
                        <div className="text-xs text-muted-foreground">{p.status === 'pending' ? 'Bekliyor' : 'Ödendi'}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteRegularPayment(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Henüz düzenli ödeme eklenmemiş.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}


