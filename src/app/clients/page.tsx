'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Mail, Phone, MapPin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/kv-store';
import { AuthLayout } from '@/components/layout/auth-layout';
import type { Client } from '@/lib/database-schema';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ClientsPage() {
  const router = useRouter();
  const { clients, currencies, addClient, updateClient, deleteClient, user, getClientBalance, pendingBalances } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxNumber: '',
    contactPerson: '',
    contractStartDate: '',
    contractEndDate: '',
    currencyId: '1', // Default TRY
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return `${currency?.symbol || '₺'} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const getClientPendingBalance = (clientId: string, currencyId: string) => {
    return pendingBalances
      .filter(pb => pb.clientId === clientId && pb.status === 'pending')
      .reduce((sum, pb) => sum + pb.amount, 0);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxNumber: '',
      contactPerson: '',
      contractStartDate: '',
      contractEndDate: '',
      currencyId: '1',
    });
    setEditingClient(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      taxNumber: client.taxNumber || '',
      contactPerson: client.contactPerson || '',
      contractStartDate: client.contractStartDate ? format(client.contractStartDate, 'yyyy-MM-dd') : '',
      contractEndDate: client.contractEndDate ? format(client.contractEndDate, 'yyyy-MM-dd') : '',
      currencyId: client.currencyId,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    const clientData = {
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      address: formData.address || undefined,
      taxNumber: formData.taxNumber || undefined,
      contactPerson: formData.contactPerson || undefined,
      contractStartDate: formData.contractStartDate ? new Date(formData.contractStartDate) : undefined,
      contractEndDate: formData.contractEndDate ? new Date(formData.contractEndDate) : undefined,
      currencyId: formData.currencyId,
      balance: editingClient?.balance || 0,
      isActive: true,
      userId: user?.id || '1',
    };

    if (editingClient) {
      updateClient(editingClient.id, clientData);
    } else {
      addClient(clientData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (client: Client) => {
    setDeletingClient(client);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingClient) {
      deleteClient(deletingClient.id);
      setIsDeleteDialogOpen(false);
      setDeletingClient(null);
    }
  };

  const handleViewDetail = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cari Hesaplar</h1>
            <p className="text-muted-foreground">
              Müşteri ve tedarikçi hesaplarınızı yönetin
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Yeni Cari Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Cari Hesap Düzenle' : 'Yeni Cari Hesap'}
                </DialogTitle>
                <DialogDescription>
                  Cari hesap bilgilerini girin. Zorunlu alanlar (*) ile işaretlenmiştir.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Cari Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Firma/Kişi adı"
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
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ornek@firma.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+90 555 123 45 67"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Yetkili Kişi</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taxNumber">Vergi No</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                      placeholder="1234567890"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">Sözleşme Başlangıç</Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      value={formData.contractStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">Sözleşme Bitiş</Label>
                    <Input
                      id="contractEndDate"
                      type="date"
                      value={formData.contractEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Tam adres"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit">
                    {editingClient ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Silme Onay Dialog'u */}
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cari Hesabı Sil</DialogTitle>
                <DialogDescription>
                  <strong>{deletingClient?.name}</strong> cari hesabını silmek istediğinizden emin misiniz?
                  <br />
                  <span className="text-red-600 font-medium mt-2 block">
                    Bu işlem geri alınamaz ve tüm ilişkili veriler silinecektir.
                  </span>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Sil
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Cari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">
                {clients.filter(c => c.isActive).length} aktif
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Alacak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(
                  clients
                    .map(c => getClientBalance(c.id, c.currencyId))
                    .filter(balance => balance > 0)
                    .reduce((sum, balance) => sum + balance, 0),
                  '1'
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Borç</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  Math.abs(clients
                    .map(c => getClientBalance(c.id, c.currencyId))
                    .filter(balance => balance < 0)
                    .reduce((sum, balance) => sum + balance, 0)),
                  '1'
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bekleyen Alacaklar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(
                  clients
                    .map(c => getClientPendingBalance(c.id, c.currencyId))
                    .reduce((sum, balance) => sum + balance, 0),
                  '1'
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingBalances.filter(pb => pb.status === 'pending').length} fatura
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Client List */}
        <div className="grid gap-4">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <Card key={client.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-semibold">{client.name}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              client.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {client.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {client.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-4 w-4" />
                                <span>{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="h-4 w-4" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                            {client.contactPerson && (
                              <span>Yetkili: {client.contactPerson}</span>
                            )}
                          </div>
                          
                          {client.address && (
                            <div className="mt-1 flex items-center space-x-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{client.address}</span>
                            </div>
                          )}
                          
                          {(client.contractStartDate || client.contractEndDate) && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <span>
                                Sözleşme: {' '}
                                {client.contractStartDate && format(client.contractStartDate, 'dd MMM yyyy', { locale: tr })}
                                {client.contractStartDate && client.contractEndDate && ' - '}
                                {client.contractEndDate && format(client.contractEndDate, 'dd MMM yyyy', { locale: tr })}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          {(() => {
                            const balance = getClientBalance(client.id, client.currencyId);
                            const pendingBalance = getClientPendingBalance(client.id, client.currencyId);
                            return (
                              <>
                                <div className={`text-lg font-semibold ${
                                  balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : 'text-gray-600'
                                }`}>
                                  {formatCurrency(balance, client.currencyId)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {balance > 0 ? 'Alacak' : balance < 0 ? 'Borç' : 'Dengeli'}
                                </div>
                                {pendingBalance > 0 && (
                                  <div className="mt-1">
                                    <div className="text-sm font-medium text-orange-600">
                                      {formatCurrency(pendingBalance, client.currencyId)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Bekleyen
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetail(client.id)}
                        title="Cari Detayları"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(client)}
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(client)}
                        className="text-red-600 hover:text-red-700"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Arama kriterinize uygun cari bulunamadı.' : 'Henüz cari hesap eklenmemiş.'}
                </p>
                {!searchTerm && (
                  <Button onClick={openAddDialog} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk cari hesabınızı ekleyin
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}
