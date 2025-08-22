'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../lib/kv-store';
import { HydrationGuard } from '../components/hydration-guard';
import { useStoreHydration } from '../hooks/use-store-hydration';

function HomeContent() {
  const { isAuthenticated } = useAppStore();
  const router = useRouter();
  const isHydrated = useStoreHydration();

  useEffect(() => {
    // Store hydrate olduktan sonra yönlendirme yap
    if (isHydrated) {
      if (isAuthenticated) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, router, isHydrated]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  );
}

export default function Home() {
  return (
    <HydrationGuard
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <HomeContent />
    </HydrationGuard>
  );
}
