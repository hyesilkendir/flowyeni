'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '../lib/kv-store';

export function useStoreHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist store'u rehydrate et
    const unsubHydrate = useAppStore.persist.onHydrate(() => {
      // noop
    });

    const unsubFinishHydration = useAppStore.persist.onFinishHydration((state) => {
      try {
        // Persist'ten gelen string tarihleri tekrar Date'e çevir
        const toDate = (value: any) => {
          if (!value) return value as any;
          const d = new Date(value as any);
          return isNaN(d.getTime()) ? (value as any) : (d as any);
        };

        const reviveArray = <T extends Record<string, any>>(arr: T[] | undefined, dateKeys: string[]): T[] => {
          if (!Array.isArray(arr)) return [] as T[];
          return arr.map((item) => {
            const revived: Record<string, any> = { ...item };
            for (const key of dateKeys) {
              if (key in revived && revived[key] != null) {
                revived[key] = toDate(revived[key]);
              }
            }
            return revived as T;
          });
        };

        const revivedState = {
          // Users
          users: reviveArray(state.users as any, ['createdAt', 'updatedAt']),
          // Clients
          clients: reviveArray(state.clients as any, ['contractStartDate', 'contractEndDate', 'createdAt', 'updatedAt']),
          // Employees
          employees: reviveArray(state.employees as any, ['createdAt', 'updatedAt']),
          // Transactions
          transactions: reviveArray(state.transactions as any, ['transactionDate', 'createdAt', 'updatedAt']),
          // Categories
          categories: reviveArray(state.categories as any, ['createdAt']),
          // Currencies (no date fields usually)
          currencies: state.currencies,
          // Quotes
          quotes: reviveArray(state.quotes as any, ['validUntil', 'createdAt', 'updatedAt']),
          // Debts
          debts: reviveArray(state.debts as any, ['dueDate', 'createdAt', 'updatedAt']),
          // Bonuses
          bonuses: reviveArray(state.bonuses as any, ['paymentDate', 'createdAt']),
          // Cash Accounts
          cashAccounts: reviveArray(state.cashAccounts as any, ['createdAt', 'updatedAt']),
          // Invoices
          invoices: reviveArray(state.invoices as any, ['issueDate', 'dueDate', 'paymentDate', 'createdAt', 'updatedAt']),
          // Pending Balances
          pendingBalances: reviveArray(state.pendingBalances as any, ['dueDate', 'createdAt']),
          // Regular Payments
          regularPayments: reviveArray(state.regularPayments as any, ['dueDate', 'createdAt', 'updatedAt']),
          // Notifications
          notifications: reviveArray(state.notifications as any, ['date', 'createdAt']),
          // Company Settings
          companySettings: state.companySettings
            ? {
                ...state.companySettings,
                createdAt: toDate((state.companySettings as any).createdAt),
                updatedAt: toDate((state.companySettings as any).updatedAt),
              }
            : state.companySettings,
        } as any;

        // State'i tek seferde güncelle
        useAppStore.setState((prev) => ({ ...prev, ...revivedState }));
      } catch {}

      setIsHydrated(true);
    });

    // Store'u manuel olarak rehydrate et
    useAppStore.persist.rehydrate();

    return () => {
      unsubHydrate();
      unsubFinishHydration();
    };
  }, []);

  return isHydrated;
}
