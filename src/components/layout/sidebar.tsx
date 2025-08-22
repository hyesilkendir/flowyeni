'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
import { Button } from '../ui/button';
import { useAppStore } from '../../lib/kv-store';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  TrendingUp,
  TrendingDown,
  FileText,
  Receipt,
  CreditCard,
  Repeat,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
  Wallet,
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Ana Sayfa',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Cari Hesaplar',
    href: '/clients',
    icon: Users,
  },
  {
    title: 'Personel',
    href: '/employees',
    icon: UserCheck,
  },
  {
    title: 'Gelirler',
    href: '/income',
    icon: TrendingUp,
  },
  {
    title: 'Giderler',
    href: '/expenses',
    icon: TrendingDown,
  },
  {
    title: 'Kasa Yönetimi',
    href: '/cash-accounts',
    icon: Wallet,
  },
  {
    title: 'Teklifler',
    href: '/quotes',
    icon: FileText,
  },
  {
    title: 'Faturalar',
    href: '/invoices',
    icon: Receipt,
  },
  {
    title: 'Borçlar',
    href: '/debts',
    icon: CreditCard,
  },
  {
    title: 'Düzenli Ödemeler',
    href: '/regular-payments',
    icon: Repeat,
  },
  {
    title: 'Ayarlar',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme, sidebarOpen, setSidebarOpen, logout, user, companySettings } = useAppStore();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          'flex flex-col min-h-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          theme === 'dark' && 'bg-gray-900 border-gray-700'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            {/* Logo */}
            {companySettings && (
              <>
                {theme === 'dark' && companySettings.darkModeLogo ? (
                  <img 
                    src={companySettings.darkModeLogo} 
                    alt={companySettings.companyName}
                    className="h-8 w-auto max-w-32"
                  />
                ) : theme === 'light' && companySettings.lightModeLogo ? (
                  <img 
                    src={companySettings.lightModeLogo} 
                    alt={companySettings.companyName}
                    className="h-8 w-auto max-w-32"
                  />
                ) : (
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {companySettings.companyName}
                  </h1>
                )}
              </>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {(user?.name || 'K').toString().charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 pb-24 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                {Icon ? (
                  <Icon className="h-5 w-5 shrink-0" />
                ) : (
                  <span className="h-5 w-5 shrink-0" />
                )}
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="w-full justify-start"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 mr-2" />
            ) : (
              <Sun className="h-4 w-4 mr-2" />
            )}
            {theme === 'light' ? 'Karanlık Tema' : 'Aydınlık Tema'}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </div>
    </>
  );
}
