import React from 'react';
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { HydrationGuard } from '../components/hydration-guard'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Calaf.co Hesap Defteri',
  description: 'Modern muhasebe ve CRM sistemi',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow',
  authors: [{ name: 'Calaf.co' }],
  keywords: ['muhasebe', 'crm', 'hesap defteri', 'finans'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <HydrationGuard>
          {children}
        </HydrationGuard>
      </body>
    </html>
  )
}
