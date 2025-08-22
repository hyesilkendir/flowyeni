'use client';

import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/kv-store';
import { HydrationGuard } from '@/components/hydration-guard';
import { useStoreHydration } from '@/hooks/use-store-hydration';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface AuthLayoutProps {
  children: React.ReactNode;
}

function AuthLayoutContent({ children }: AuthLayoutProps) {
  const { isAuthenticated, theme } = useAppStore();
  const router = useRouter();
  const isHydrated = useStoreHydration();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router, isHydrated]);

  useEffect(() => {
    // Apply theme class to html element
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    }
  }, [theme]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 min-h-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 min-h-0">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <HydrationGuard
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </HydrationGuard>
  );
}
