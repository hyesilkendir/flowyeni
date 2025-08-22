'use client';

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Gift, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useAppStore } from '../../lib/kv-store';
import { AuthLayout } from '../../components/layout/auth-layout';
import type { Employee, Bonus } from '../../lib/database-schema';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function EmployeesPage() {
  const router = useRouter();
  const { 
    employees, 
    currencies, 
    bonuses,
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    addBonus,
    user 
  } = useAppStore();
  

  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isBonusDialogOpen, setIsBonusDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployeeForBonus, setSelectedEmployeeForBonus] = useState<Employee | null>(null);

  const [employeeFormData, setEmployeeFormData] = useState({
    name: '',
    position: '',
    netSalary: '',
    currencyId: '1',
    payrollPeriod: 'monthly' as 'monthly' | 'weekly' | 'biweekly',
    paymentDay: '1',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    contractStartDate: '',
    contractEndDate: '',
  });

  const [bonusFormData, setBonusFormData] = useState({
    type: 'bonus' as const,
    amount: '',
    currencyId: '1',
    description: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
  });

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number, currencyId: string) => {
    const currency = currencies.find(c => c.id === currencyId);
    return `${currency?.symbol || '₺'} ${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
  };

  const resetEmployeeForm = () => {
    setEmployeeFormData({
      name: '',
      position: '',
      netSalary: '',
      currencyId: '1',
      payrollPeriod: 'monthly',
      paymentDay: '1',
      email: '',
      phone: '',
      address: '',
      emergencyContact: '',
      contractStartDate: '',
      contractEndDate: '',
    });
    setEditingEmployee(null);
  };

  const resetBonusForm = () => {
    setBonusFormData({
      type: 'bonus',
      amount: '',
      currencyId: '1',
      description: '',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setSelectedEmployeeForBonus(null);
  };

  const openAddEmployeeDialog = () => {
    resetEmployeeForm();
    setIsEmployeeDialogOpen(true);
  };

  const openEditEmployeeDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeFormData({
      name: employee.name,
      position: employee.position,
      netSalary: employee.netSalary.toString(),
      currencyId: employee.currencyId,
      payrollPeriod: employee.payrollPeriod,
      paymentDay: employee.paymentDay.toString(),
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      emergencyContact: employee.emergencyContact || '',
      contractStartDate: employee.contractStartDate ? format(new Date(employee.contractStartDate), 'yyyy-MM-dd') : '',
      contractEndDate: employee.contractEndDate ? format(new Date(employee.contractEndDate), 'yyyy-MM-dd') : '',
    });
    setIsEmployeeDialogOpen(true);
  };

  const openBonusDialog = (employee: Employee) => {
    // Önce dialog'u kapat (eğer açıksa)
    setIsBonusDialogOpen(false);
    
    // State'leri temizle
    setSelectedEmployeeForBonus(null);
    resetBonusForm();
    
    // Kısa bir gecikme ile state update'ini bekle ve sonra aç
    setTimeout(() => {
      setSelectedEmployeeForBonus(employee);
      setIsBonusDialogOpen(true);
    }, 50);
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeFormData.name.trim() || !employeeFormData.position.trim() || !employeeFormData.netSalary) {
      return;
    }

    const employeeData = {
      name: employeeFormData.name,
      position: employeeFormData.position,
      netSalary: parseFloat(employeeFormData.netSalary),
      currencyId: employeeFormData.currencyId,
      payrollPeriod: employeeFormData.payrollPeriod,
      paymentDay: parseInt(employeeFormData.paymentDay),
      isActive: true,
      userId: user?.id || '1',
      email: employeeFormData.email || undefined,
      phone: employeeFormData.phone || undefined,
      address: employeeFormData.address || undefined,
      emergencyContact: employeeFormData.emergencyContact || undefined,
      contractStartDate: employeeFormData.contractStartDate ? new Date(employeeFormData.contractStartDate) : undefined,
      contractEndDate: employeeFormData.contractEndDate ? new Date(employeeFormData.contractEndDate) : undefined,
    };

    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeData);
    } else {
      addEmployee(employeeData);
    }

    setIsEmployeeDialogOpen(false);
    resetEmployeeForm();
  };

  const handleBonusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEmployeeForBonus || !bonusFormData.amount || !bonusFormData.description.trim()) {
      return;
    }

    const bonusData = {
      employeeId: selectedEmployeeForBonus.id,
      type: bonusFormData.type,
      amount: parseFloat(bonusFormData.amount),
      currencyId: bonusFormData.currencyId,
      description: bonusFormData.description,
      paymentDate: new Date(bonusFormData.paymentDate),
      userId: user?.id || '1',
    };

    addBonus(bonusData);
    alert('Ek ödeme başarıyla eklendi!');
    setIsBonusDialogOpen(false);
    resetBonusForm();
  };

  const handleDeleteEmployee = (employee: Employee) => {
    if (confirm(`${employee.name} personelini silmek istediğinizden emin misiniz?`)) {
      deleteEmployee(employee.id);
    }
  };

  const handleViewDetail = (employeeId: string) => {
    router.push(`/employees/${employeeId}`);
  };

  const getEmployeeBonuses = (employeeId: string) => {
    return bonuses.filter(b => b.employeeId === employeeId);
  };

  const getTotalBonuses = (employeeId: string) => {
    return bonuses
      .filter(b => b.employeeId === employeeId)
      .reduce((sum, b) => sum + b.amount, 0);
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

  const getPayrollPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      monthly: 'Aylık',
      weekly: 'Haftalık',
      biweekly: 'İki Haftada Bir',
    };
    return labels[period] || period;
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Personel Yönetimi</h1>
            <p className="text-muted-foreground">
              Çalışanlarınızı ve maaş ödemelerini yönetin
            </p>
          </div>
          
          <Button onClick={openAddEmployeeDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Yeni Personel Ekle
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Personel ara..."
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
              <CardTitle className="text-sm font-medium">Toplam Personel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.filter(e => e.isActive).length}</div>
              <p className="text-xs text-muted-foreground">
                Aktif çalışan
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aylık Maaş Gideri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(
                  employees
                    .filter(e => e.isActive && e.payrollPeriod === 'monthly')
                    .reduce((sum, e) => sum + e.netSalary, 0),
                  '1'
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bu Ay Primler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(
                  bonuses
                    .filter(b => new Date(b.paymentDate).getMonth() === new Date().getMonth())
                    .reduce((sum, b) => sum + b.amount, 0),
                  '1'
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Ek Ödemeler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  bonuses.reduce((sum, b) => sum + b.amount, 0),
                  '1'
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee List */}
        <div className="grid gap-4">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee) => {
              const employeeBonuses = getEmployeeBonuses(employee.id);
              const totalBonuses = getTotalBonuses(employee.id);
              
              return (
                <Card key={employee.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {employee.name.charAt(0)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-semibold">{employee.name}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                employee.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {employee.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                            
                            <p className="text-muted-foreground">{employee.position}</p>
                            
                            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(employee.netSalary, employee.currencyId)} / {getPayrollPeriodLabel(employee.payrollPeriod)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Ödeme: Her ayın {employee.paymentDay}. günü</span>
                              </div>
                              {totalBonuses > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Gift className="h-4 w-4" />
                                  <span>Toplam ek ödeme: {formatCurrency(totalBonuses, employee.currencyId)}</span>
                                </div>
                              )}
                            </div>
                            
                            {employeeBonuses.length > 0 && (
                              <div className="mt-3">
                                <h4 className="text-sm font-medium mb-2">Son Ek Ödemeler:</h4>
                                <div className="space-y-1">
                                  {employeeBonuses.slice(-3).map((bonus) => (
                                    <div key={bonus.id} className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        {getBonusTypeLabel(bonus.type)} - {bonus.description}
                                      </span>
                                      <span className="font-medium">
                                        {formatCurrency(bonus.amount, bonus.currencyId)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-semibold text-blue-600">
                              {formatCurrency(employee.netSalary, employee.currencyId)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Net Maaş
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBonusDialog(employee)}
                        >
                          <Gift className="h-4 w-4 mr-1" />
                          Ek Ödeme
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetail(employee.id)}
                          title="Personel Detayları"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditEmployeeDialog(employee)}
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee)}
                          className="text-red-600 hover:text-red-700"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Arama kriterinize uygun personel bulunamadı.' : 'Henüz personel eklenmemiş.'}
                </p>
                {!searchTerm && (
                  <Button onClick={openAddEmployeeDialog} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk personeli ekleyin
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Employee Dialog */}
        <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Personel Bilgilerini Düzenle' : 'Yeni Personel Ekle'}
              </DialogTitle>
              <DialogDescription>
                Personel bilgilerini girin. Zorunlu alanlar (*) ile işaretlenmiştir.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleEmployeeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emp-name">Ad Soyad *</Label>
                  <Input
                    id="emp-name"
                    value={employeeFormData.name}
                    onChange={(e) => setEmployeeFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ahmet Yılmaz"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="position">Pozisyon *</Label>
                  <Input
                    id="position"
                    value={employeeFormData.position}
                    onChange={(e) => setEmployeeFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Grafik Tasarımcı"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="netSalary">Net Maaş *</Label>
                  <Input
                    id="netSalary"
                    type="number"
                    value={employeeFormData.netSalary}
                    onChange={(e) => setEmployeeFormData(prev => ({ ...prev, netSalary: e.target.value }))}
                    placeholder="15000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="emp-currency">Para Birimi</Label>
                  <Select
                    value={employeeFormData.currencyId}
                    onValueChange={(value) => setEmployeeFormData(prev => ({ ...prev, currencyId: value }))}
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
                  <Label htmlFor="payrollPeriod">Bordro Periyodu</Label>
                  <Select
                    value={employeeFormData.payrollPeriod}
                    onValueChange={(value: any) => setEmployeeFormData(prev => ({ ...prev, payrollPeriod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Aylık</SelectItem>
                      <SelectItem value="weekly">Haftalık</SelectItem>
                      <SelectItem value="biweekly">İki Haftada Bir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentDay">Ödeme Günü (Ayın Kaçı)</Label>
                  <Input
                    id="paymentDay"
                    type="number"
                    min="1"
                    max="31"
                    value={employeeFormData.paymentDay}
                    onChange={(e) => setEmployeeFormData(prev => ({ ...prev, paymentDay: e.target.value }))}
                    placeholder="5"
                  />
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">İletişim Bilgileri</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={employeeFormData.email}
                      onChange={(e) => setEmployeeFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ahmet@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={employeeFormData.phone}
                      onChange={(e) => setEmployeeFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+90 555 123 45 67"
                    />
                  </div>
                  
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={employeeFormData.address}
                      onChange={(e) => setEmployeeFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Tam adres bilgisi"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Acil Durum İletişim</Label>
                    <Input
                      id="emergencyContact"
                      value={employeeFormData.emergencyContact}
                      onChange={(e) => setEmployeeFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      placeholder="+90 555 987 65 43"
                    />
                  </div>
                </div>
              </div>

              {/* Sözleşme Bilgileri */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Sözleşme Bilgileri</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractStartDate">Sözleşme Başlangıç</Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      value={employeeFormData.contractStartDate}
                      onChange={(e) => setEmployeeFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contractEndDate">Sözleşme Bitiş</Label>
                    <Input
                      id="contractEndDate"
                      type="date"
                      value={employeeFormData.contractEndDate}
                      onChange={(e) => setEmployeeFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  {editingEmployee ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bonus Dialog */}
        <Dialog open={isBonusDialogOpen} onOpenChange={setIsBonusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ek Ödeme Ekle</DialogTitle>
              <DialogDescription>
                {selectedEmployeeForBonus?.name} için ek ödeme ekleyin.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleBonusSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bonus-type">Ödeme Türü</Label>
                  <Select
                    value={bonusFormData.type}
                    onValueChange={(value: any) => setBonusFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonus">Prim</SelectItem>
                      <SelectItem value="advance">Avans</SelectItem>
                      <SelectItem value="overtime">Mesai</SelectItem>
                      <SelectItem value="commission">Komisyon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bonus-amount">Tutar *</Label>
                  <Input
                    id="bonus-amount"
                    type="number"
                    value={bonusFormData.amount}
                    onChange={(e) => setBonusFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="1000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bonus-currency">Para Birimi</Label>
                  <Select
                    value={bonusFormData.currencyId}
                    onValueChange={(value) => setBonusFormData(prev => ({ ...prev, currencyId: value }))}
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
                  <Label htmlFor="paymentDate">Ödeme Tarihi</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={bonusFormData.paymentDate}
                    onChange={(e) => setBonusFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bonus-description">Açıklama *</Label>
                <Input
                  id="bonus-description"
                  value={bonusFormData.description}
                  onChange={(e) => setBonusFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Proje tamamlama primi"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsBonusDialogOpen(false)}>
                  İptal
                </Button>
                <Button type="submit">
                  Ek Ödeme Ekle
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthLayout>
  );
}
