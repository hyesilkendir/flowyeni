'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, Palette, Users, Building, Upload, Download, FileText, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { useAppStore } from '../../lib/kv-store';
import { AuthLayout } from '../../components/layout/auth-layout';
import type { Category, User, TevkifatRate } from '../../lib/database-schema';

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#6b7280', '#374151', '#1f2937'
];

export default function SettingsPage() {
  const { 
    categories, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    user,
    users,
    addUser,
    updateUser,
    deleteUser,
    companySettings,
    updateCompanySettings,
    addTevkifatRate,
    updateTevkifatRate,
    deleteTevkifatRate,
    theme,
    setTheme,
    changePassword,
    error,
    setError
  } = useAppStore();
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isTevkifatDialogOpen, setIsTevkifatDialogOpen] = useState(false);
  const [editingTevkifat, setEditingTevkifat] = useState<TevkifatRate | null>(null);

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'expense' as const,
    color: '#ef4444',
  });

  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'user' as const,
    companyName: '',
  });

  const [companyFormData, setCompanyFormData] = useState({
    companyName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxNumber: '',
  });

  const [tevkifatFormData, setTevkifatFormData] = useState({
    code: '',
    numerator: 1,
    denominator: 10,
    description: '',
    isActive: true,
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Company settings değiştiğinde form data'sını güncelle
  useEffect(() => {
    if (companySettings) {
      setCompanyFormData({
        companyName: companySettings.companyName || '',
        address: companySettings.address || '',
        phone: companySettings.phone || '',
        email: companySettings.email || '',
        website: companySettings.website || '',
        taxNumber: companySettings.taxNumber || '',
      });
    }
  }, [companySettings]);

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      type: 'expense',
      color: '#ef4444',
    });
    setEditingCategory(null);
  };

  const openAddCategoryDialog = () => {
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const openEditCategoryDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      type: category.type,
      color: category.color,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryFormData.name.trim()) {
      return;
    }

    const categoryData = {
      name: categoryFormData.name,
      type: categoryFormData.type,
      color: categoryFormData.color,
      isDefault: false,
      userId: user?.id || '1',
    };

    if (editingCategory) {
      updateCategory(editingCategory.id, categoryData);
    } else {
      addCategory(categoryData);
    }

    setIsCategoryDialogOpen(false);
    resetCategoryForm();
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.isDefault) {
      alert('Varsayılan kategoriler silinemez.');
      return;
    }
    
    if (confirm(`${category.name} kategorisini silmek istediğinizden emin misiniz?`)) {
      deleteCategory(category.id);
    }
  };

  // User management functions
  const resetUserForm = () => {
    setUserFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      role: 'user',
      companyName: '',
    });
    setEditingUser(null);
  };

  const openAddUserDialog = () => {
    resetUserForm();
    setIsUserDialogOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.username.trim() || !userFormData.name.trim()) return;

    const userData = {
      username: userFormData.username,
      name: userFormData.name,
      email: userFormData.email,
      role: userFormData.role,
      companyName: userFormData.companyName,
    };

    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }

    setIsUserDialogOpen(false);
    resetUserForm();
  };

  // Company settings functions
  const handleCompanySettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(companyFormData);
    alert('Şirket bilgileri güncellendi!');
  };

  const handleLogoUpload = (type: 'light' | 'dark' | 'quote', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const updates: any = {};
      
      if (type === 'light') updates.lightModeLogo = base64;
      else if (type === 'dark') updates.darkModeLogo = base64;
      else if (type === 'quote') updates.quoteLogo = base64;
      
      updateCompanySettings(updates);
      alert(`${type} logo güncellendi!`);
    };
    reader.readAsDataURL(file);
  };

  // Tevkifat management functions
  const resetTevkifatForm = () => {
    setTevkifatFormData({
      code: '',
      numerator: 1,
      denominator: 10,
      description: '',
      isActive: true,
    });
    setEditingTevkifat(null);
  };

  const openAddTevkifatDialog = () => {
    resetTevkifatForm();
    setIsTevkifatDialogOpen(true);
  };

  const openEditTevkifatDialog = (tevkifat: TevkifatRate) => {
    setTevkifatFormData({
      code: tevkifat.code,
      numerator: tevkifat.numerator,
      denominator: tevkifat.denominator,
      description: tevkifat.description,
      isActive: tevkifat.isActive,
    });
    setEditingTevkifat(tevkifat);
    setIsTevkifatDialogOpen(true);
  };

  const handleTevkifatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tevkifatFormData.code.trim() || !tevkifatFormData.description.trim()) return;

    const tevkifatData = {
      code: tevkifatFormData.code,
      numerator: tevkifatFormData.numerator,
      denominator: tevkifatFormData.denominator,
      description: tevkifatFormData.description,
      isActive: tevkifatFormData.isActive,
    };

    if (editingTevkifat) {
      updateTevkifatRate(editingTevkifat.id, tevkifatData);
    } else {
      addTevkifatRate(tevkifatData);
    }

    setIsTevkifatDialogOpen(false);
    resetTevkifatForm();
  };

  // Password change functions
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validation
    if (!passwordFormData.currentPassword || !passwordFormData.newPassword || !passwordFormData.confirmPassword) {
      setError('Tüm alanları doldurun.');
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (passwordFormData.newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    const success = await changePassword(passwordFormData.currentPassword, passwordFormData.newPassword);
    
    if (success) {
      setPasswordFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Şifre başarıyla değiştirildi! Güvenlik nedeniyle oturumunuz kapatılacak. Lütfen yeni şifrenizle tekrar giriş yapın.');
    }
  };

  const resetPasswordForm = () => {
    setPasswordFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError(null);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ayarlar</h1>
          <p className="text-muted-foreground">
            Sistem ayarlarınızı ve tercihlerinizi yönetin
          </p>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList>
            <TabsTrigger value="categories">Kategoriler</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="company">Şirket Bilgileri</TabsTrigger>
            <TabsTrigger value="tevkifat">Tevkifat Oranları</TabsTrigger>
            <TabsTrigger value="branding">Logo & Tasarım</TabsTrigger>
            <TabsTrigger value="general">Genel</TabsTrigger>
          </TabsList>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Kategori Yönetimi</h2>
                <p className="text-muted-foreground">
                  Gelir ve gider kategorilerinizi düzenleyin
                </p>
              </div>
              
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddCategoryDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kategori
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
                    </DialogTitle>
                    <DialogDescription>
                      Kategori bilgilerini girin.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cat-name">Kategori Adı *</Label>
                      <Input
                        id="cat-name"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Kategori adı"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cat-type">Tür</Label>
                      <Select
                        value={categoryFormData.type}
                        onValueChange={(value: any) => setCategoryFormData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Gelir</SelectItem>
                          <SelectItem value="expense">Gider</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Renk</Label>
                      <div className="grid grid-cols-10 gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${
                              categoryFormData.color === color ? 'border-gray-900' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setCategoryFormData(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit">
                        {editingCategory ? 'Güncelle' : 'Kaydet'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Income Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Gelir Kategorileri</CardTitle>
                  <CardDescription>
                    {incomeCategories.length} kategori
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {incomeCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                          {category.isDefault && (
                            <Badge variant="outline" className="text-xs">Varsayılan</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCategoryDialog(category)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!category.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {incomeCategories.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Henüz gelir kategorisi eklenmemiş.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Expense Categories */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Gider Kategorileri</CardTitle>
                  <CardDescription>
                    {expenseCategories.length} kategori
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expenseCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                          {category.isDefault && (
                            <Badge variant="outline" className="text-xs">Varsayılan</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCategoryDialog(category)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!category.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {expenseCategories.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Henüz gider kategorisi eklenmemiş.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Kullanıcı Yönetimi
                </h2>
                <p className="text-muted-foreground">
                  Sistem kullanıcılarını yönetin
                </p>
              </div>
              
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddUserDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kullanıcı
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
                    <DialogDescription>
                      Kullanıcı bilgilerini girin.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Kullanıcı Adı *</Label>
                        <Input
                          id="username"
                          value={userFormData.username}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, username: e.target.value }))}
                          placeholder="kullanici@email.com"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad *</Label>
                        <Input
                          id="name"
                          value={userFormData.name}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Ad Soyad"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userFormData.email}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@example.com"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select
                          value={userFormData.role}
                          onValueChange={(value: any) => setUserFormData(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Kullanıcı</SelectItem>
                            <SelectItem value="admin">Yönetici</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="companyName">Şirket Adı</Label>
                        <Input
                          id="companyName"
                          value={userFormData.companyName}
                          onChange={(e) => setUserFormData(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="Şirket Adı"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit">
                        Kaydet
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mevcut Kullanıcılar</CardTitle>
                <CardDescription>
                  {users.length + 1} kullanıcı (Admin dahil)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Current user */}
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{user?.name}</span>
                        <span className="text-sm text-muted-foreground">{user?.username}</span>
                      </div>
                      <Badge variant="outline" className="text-blue-600">Aktif Kullanıcı</Badge>
                      <Badge variant="outline" className="text-green-600">Admin</Badge>
                    </div>
                  </div>
                  
                  {/* Other users */}
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{u.name}</span>
                          <span className="text-sm text-muted-foreground">{u.username}</span>
                        </div>
                        <Badge variant="outline" className={u.role === 'admin' ? 'text-green-600' : 'text-blue-600'}>
                          {u.role === 'admin' ? 'Yönetici' : 'Kullanıcı'}
                        </Badge>
                        {!u.isActive && <Badge variant="destructive">Pasif</Badge>}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteUser(u.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {users.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Henüz ek kullanıcı eklenmemiş.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings Tab */}
          <TabsContent value="company" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Şirket Bilgileri
              </h2>
              <p className="text-muted-foreground">
                Tekliflerde görünecek şirket bilgilerinizi düzenleyin
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Şirket Detayları</CardTitle>
                <CardDescription>
                  Bu bilgiler PDF tekliflerinde görünecektir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCompanySettingsSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Şirket Adı *</Label>
                      <Input
                        id="companyName"
                        value={companyFormData.companyName}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="CALAF.CO"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        value={companyFormData.phone}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+90 212 555 0000"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={companyFormData.email}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="info@calaf.co"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={companyFormData.website}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="www.calaf.co"
                      />
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="address">Adres *</Label>
                      <Textarea
                        id="address"
                        value={companyFormData.address}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="İstanbul, Türkiye"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">Vergi Numarası</Label>
                      <Input
                        id="taxNumber"
                        value={companyFormData.taxNumber}
                        onChange={(e) => setCompanyFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Kaydet
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tevkifat Rates Tab */}
          <TabsContent value="tevkifat" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Tevkifat Oranları
                </h2>
                <p className="text-muted-foreground">
                  Tevkifatlı faturalar için oranları yönetin
                </p>
              </div>
              
              <Dialog open={isTevkifatDialogOpen} onOpenChange={setIsTevkifatDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddTevkifatDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Tevkifat Oranı
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingTevkifat ? 'Tevkifat Oranını Düzenle' : 'Yeni Tevkifat Oranı Ekle'}
                    </DialogTitle>
                    <DialogDescription>
                      Tevkifat oranı bilgilerini girin.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleTevkifatSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tevkifat-code">Oran Kodu *</Label>
                        <Input
                          id="tevkifat-code"
                          value={tevkifatFormData.code}
                          onChange={(e) => setTevkifatFormData(prev => ({ ...prev, code: e.target.value }))}
                          placeholder="9/10"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Aktif</Label>
                        <Select
                          value={tevkifatFormData.isActive.toString()}
                          onValueChange={(value) => setTevkifatFormData(prev => ({ ...prev, isActive: value === 'true' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Aktif</SelectItem>
                            <SelectItem value="false">Pasif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="numerator">Pay</Label>
                        <Input
                          id="numerator"
                          type="number"
                          min="1"
                          value={tevkifatFormData.numerator}
                          onChange={(e) => setTevkifatFormData(prev => ({ ...prev, numerator: parseInt(e.target.value) || 1 }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="denominator">Payda</Label>
                        <Input
                          id="denominator"
                          type="number"
                          min="1"
                          value={tevkifatFormData.denominator}
                          onChange={(e) => setTevkifatFormData(prev => ({ ...prev, denominator: parseInt(e.target.value) || 10 }))}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="tevkifat-description">Açıklama *</Label>
                        <Input
                          id="tevkifat-description"
                          value={tevkifatFormData.description}
                          onChange={(e) => setTevkifatFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Mimarlık ve Mühendislik Hizmetleri"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsTevkifatDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit">
                        {editingTevkifat ? 'Güncelle' : 'Kaydet'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Mevcut Tevkifat Oranları</CardTitle>
                <CardDescription>
                  {companySettings?.tevkifatRates?.length || 0} tevkifat oranı tanımlı
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {companySettings?.tevkifatRates?.map((rate) => (
                    <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-lg">{rate.code}</span>
                            <span className="text-sm text-muted-foreground">
                              ({rate.numerator}/{rate.denominator})
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">{rate.description}</span>
                        </div>
                        {rate.isActive ? (
                          <Badge variant="outline" className="text-green-600">Aktif</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">Pasif</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditTevkifatDialog(rate)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTevkifatRate(rate.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {(!companySettings?.tevkifatRates || companySettings.tevkifatRates.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">
                      Henüz tevkifat oranı eklenmemiş.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Logo & Tasarım
              </h2>
              <p className="text-muted-foreground">
                Uygulama ve teklif logolarınızı yönetin
              </p>
            </div>

            <div className="grid gap-6">
              {/* App Logos */}
              <Card>
                <CardHeader>
                  <CardTitle>Uygulama Logoları</CardTitle>
                  <CardDescription>
                    Aydınlık ve karanlık mod için farklı logolar yükleyebilirsiniz
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Aydınlık Mod Logo</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {companySettings?.lightModeLogo ? (
                          <img src={companySettings.lightModeLogo} alt="Light Logo" className="max-h-20 mx-auto" />
                        ) : (
                          <p className="text-muted-foreground">Logo yüklenmemiş</p>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoUpload('light', e)}
                          className="hidden"
                          id="light-logo"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => document.getElementById('light-logo')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Logo Yükle
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Karanlık Mod Logo</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {companySettings?.darkModeLogo ? (
                          <img src={companySettings.darkModeLogo} alt="Dark Logo" className="max-h-20 mx-auto" />
                        ) : (
                          <p className="text-muted-foreground">Logo yüklenmemiş</p>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLogoUpload('dark', e)}
                          className="hidden"
                          id="dark-logo"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => document.getElementById('dark-logo')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Logo Yükle
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quote Logo */}
              <Card>
                <CardHeader>
                  <CardTitle>Teklif Logosu</CardTitle>
                  <CardDescription>
                    PDF tekliflerinde görünecek logo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Teklif PDF Logosu</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {companySettings?.quoteLogo ? (
                        <img src={companySettings.quoteLogo} alt="Quote Logo" className="max-h-24 mx-auto" />
                      ) : (
                        <p className="text-muted-foreground">Teklif logosu yüklenmemiş</p>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoUpload('quote', e)}
                        className="hidden"
                        id="quote-logo"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-4"
                        onClick={() => document.getElementById('quote-logo')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Teklif Logosu Yükle
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Önerilen boyut: 400x100 piksel, PNG veya JPG formatında
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Genel Ayarlar</h2>
              <p className="text-muted-foreground">
                Uygulama genel ayarlarını düzenleyin
              </p>
            </div>

            <div className="grid gap-6">
              {/* Theme Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2" />
                    Tema Ayarları
                  </CardTitle>
                  <CardDescription>
                    Uygulama temasını seçin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Label htmlFor="theme">Tema</Label>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Aydınlık</SelectItem>
                          <SelectItem value="dark">Karanlık</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Profile */}
              <Card>
                <CardHeader>
                  <CardTitle>Kullanıcı Profili</CardTitle>
                  <CardDescription>
                    Kullanıcı bilgilerinizi görüntüleyin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="user-name">Ad Soyad</Label>
                        <Input
                          id="user-name"
                          value={user?.name || ''}
                          placeholder="Ad Soyad"
                          readOnly
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="user-email">E-posta</Label>
                        <Input
                          id="user-email"
                          value={user?.email || ''}
                          placeholder="E-posta"
                          readOnly
                        />
                      </div>
                      
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="company-name">Şirket Adı</Label>
                        <Input
                          id="company-name"
                          value={user?.companyName || ''}
                          placeholder="Şirket Adı"
                          readOnly
                        />
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Kullanıcı bilgileri şu anda salt okunur modda.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="h-5 w-5 mr-2" />
                    Şifre Değiştir
                  </CardTitle>
                  <CardDescription>
                    Hesap güvenliğiniz için şifrenizi güncelleyin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Mevcut Şifre *</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordFormData.currentPassword}
                            onChange={(e) => setPasswordFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Mevcut şifrenizi girin"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPasswords.current ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Yeni Şifre *</Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordFormData.newPassword}
                            onChange={(e) => setPasswordFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                            placeholder="Yeni şifrenizi girin (min. 6 karakter)"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPasswords.new ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Yeni Şifre Tekrar *</Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordFormData.confirmPassword}
                            onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            placeholder="Yeni şifrenizi tekrar girin"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPasswords.confirm ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetPasswordForm}
                      >
                        Temizle
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                        <Lock className="h-4 w-4 mr-2" />
                        Şifreyi Değiştir
                      </Button>
                    </div>
                  </form>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="text-sm text-blue-700">
                      <strong>Şifre Güvenlik İpuçları:</strong>
                      <ul className="mt-2 list-disc list-inside space-y-1">
                        <li>En az 6 karakter kullanın</li>
                        <li>Büyük ve küçük harf karışımı kullanın</li>
                        <li>Sayı ve özel karakterler ekleyin</li>
                        <li>Kişisel bilgilerinizi kullanmayın</li>
                      </ul>
                    </div>
                  </div>
                  
                </CardContent>
              </Card>

              {/* System Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Sistem Bilgileri</CardTitle>
                  <CardDescription>
                    Uygulama ve sistem bilgileri
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uygulama Adı:</span>
                      <span className="font-medium">Calaf.co Muhasebe & CRM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Versiyon:</span>
                      <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Son Güncelleme:</span>
                      <span className="font-medium">{new Date().toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Veritabanı:</span>
                      <span className="font-medium">LocalStorage (Demo)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Keyboard Shortcuts */}
              <Card>
                <CardHeader>
                  <CardTitle>Klavye Kısayolları</CardTitle>
                  <CardDescription>
                    Hızlı kullanım için klavye kısayolları
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Yeni Gelir Ekle:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl + I</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Yeni Gider Ekle:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl + E</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Yeni Cari Ekle:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl + C</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Arama:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl + K</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ana Sayfa:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl + H</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ayarlar:</span>
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">Ctrl + ,</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-xs text-muted-foreground">
                    Not: Klavye kısayolları şu anda demo amaçlı gösterilmektedir. Gelecek sürümlerde aktif hale getirilecektir.
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  );
}
