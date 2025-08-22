'use client';

import React from 'react';
import { useEffect, useState } from 'react';

interface HydrationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function HydrationGuard({ children, fallback }: HydrationGuardProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Yükleniyor...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
