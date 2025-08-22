import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { transactions, clients, employees, categories, currencies, Database } from '../connection';
import { BaseService } from './base.service';
import { Transaction } from '../../database-schema';

export class TransactionService extends BaseService {
  constructor(database: Database) {
    super(database);
  }

  /**
   * Create a new transaction
   */
  async create(transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    try {
      const newTransaction = {
        id: this.generateId(),
        ...transactionData,
        isVatIncluded: transactionData.isVatIncluded ?? false,
        vatRate: transactionData.vatRate || 0,
        isRecurring: transactionData.isRecurring ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.insert(transactions).values(newTransaction);
      return newTransaction;
    } catch (error) {
      this.handleError(error, 'create transaction');
    }
  }

  /**
   * Find transaction by ID
   */
  async findById(id: string): Promise<Transaction | null> {
    try {
      const result = await this.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'find transaction by ID');
    }
  }

  /**
   * Get all transactions for a user
   */
  async findByUserId(userId: string, limit?: number): Promise<Transaction[]> {
    try {
      const query = this.db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));

      if (limit) {
        query.limit(limit);
      }

      return await query;
    } catch (error) {
      this.handleError(error, 'get transactions by user ID');
    }
  }

  /**
   * Get transactions with related data (client, employee, category, currency)
   */
  async findByUserIdWithRelations(userId: string, limit?: number): Promise<any[]> {
    try {
      const query = this.db
        .select({
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          description: transactions.description,
          transactionDate: transactions.transactionDate,
          isVatIncluded: transactions.isVatIncluded,
          vatRate: transactions.vatRate,
          isRecurring: transactions.isRecurring,
          recurringPeriod: transactions.recurringPeriod,
          nextRecurringDate: transactions.nextRecurringDate,
          createdAt: transactions.createdAt,
          updatedAt: transactions.updatedAt,
          client: {
            id: clients.id,
            name: clients.name,
          },
          employee: {
            id: employees.id,
            name: employees.name,
          },
          category: {
            id: categories.id,
            name: categories.name,
            color: categories.color,
          },
          currency: {
            id: currencies.id,
            code: currencies.code,
            symbol: currencies.symbol,
          }
        })
        .from(transactions)
        .leftJoin(clients, eq(transactions.clientId, clients.id))
        .leftJoin(employees, eq(transactions.employeeId, employees.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .leftJoin(currencies, eq(transactions.currencyId, currencies.id))
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));

      if (limit) {
        query.limit(limit);
      }

      return await query;
    } catch (error) {
      this.handleError(error, 'get transactions with relations');
    }
  }

  /**
   * Get transactions by date range
   */
  async findByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date, 
    type?: 'income' | 'expense'
  ): Promise<Transaction[]> {
    try {
      let whereClause = and(
        eq(transactions.userId, userId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate)
      );

      if (type) {
        whereClause = and(whereClause, eq(transactions.type, type));
      }

      return await this.db
        .select()
        .from(transactions)
        .where(whereClause)
        .orderBy(desc(transactions.transactionDate));
    } catch (error) {
      this.handleError(error, 'get transactions by date range');
    }
  }

  /**
   * Get transactions by client
   */
  async findByClientId(clientId: string, userId: string): Promise<Transaction[]> {
    try {
      return await this.db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.clientId, clientId),
          eq(transactions.userId, userId)
        ))
        .orderBy(desc(transactions.transactionDate));
    } catch (error) {
      this.handleError(error, 'get transactions by client');
    }
  }

  /**
   * Get transactions by employee
   */
  async findByEmployeeId(employeeId: string, userId: string): Promise<Transaction[]> {
    try {
      return await this.db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.employeeId, employeeId),
          eq(transactions.userId, userId)
        ))
        .orderBy(desc(transactions.transactionDate));
    } catch (error) {
      this.handleError(error, 'get transactions by employee');
    }
  }

  /**
   * Update transaction
   */
  async update(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await this.db
        .update(transactions)
        .set(updateData)
        .where(eq(transactions.id, id));

      const updatedTransaction = await this.findById(id);
      if (!updatedTransaction) {
        throw new Error('Transaction not found after update');
      }

      return updatedTransaction;
    } catch (error) {
      this.handleError(error, 'update transaction');
    }
  }

  /**
   * Delete transaction
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(transactions)
        .where(eq(transactions.id, id));

      return result.affectedRows > 0;
    } catch (error) {
      this.handleError(error, 'delete transaction');
    }
  }

  /**
   * Get income/expense summary for a date range
   */
  async getSummaryByDateRange(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<{ income: number; expense: number; transactions: Transaction[] }> {
    try {
      const transactionsInRange = await this.findByDateRange(userId, startDate, endDate);
      
      const income = transactionsInRange
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = transactionsInRange
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        income,
        expense,
        transactions: transactionsInRange
      };
    } catch (error) {
      this.handleError(error, 'get summary by date range');
    }
  }

  /**
   * Get monthly revenue for current month
   */
  async getThisMonthRevenue(userId: string): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const monthlyTransactions = await this.findByDateRange(userId, startOfMonth, endOfMonth, 'income');
      
      return monthlyTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    } catch (error) {
      this.handleError(error, 'get this month revenue');
    }
  }

  /**
   * Get recurring transactions that need processing
   */
  async getRecurringTransactionsDue(): Promise<Transaction[]> {
    try {
      const now = new Date();
      
      return await this.db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.isRecurring, true),
          lte(transactions.nextRecurringDate, now)
        ));
    } catch (error) {
      this.handleError(error, 'get recurring transactions due');
    }
  }

  /**
   * Process recurring transaction (create new instance)
   */
  async processRecurringTransaction(parentTransactionId: string): Promise<Transaction | null> {
    try {
      const parentTransaction = await this.findById(parentTransactionId);
      if (!parentTransaction || !parentTransaction.isRecurring) {
        return null;
      }

      // Calculate next recurring date
      const nextDate = this.calculateNextRecurringDate(
        parentTransaction.nextRecurringDate || new Date(),
        parentTransaction.recurringPeriod || 'monthly'
      );

      // Create new transaction instance
      const newTransaction = await this.create({
        type: parentTransaction.type,
        amount: parentTransaction.amount,
        currencyId: parentTransaction.currencyId,
        categoryId: parentTransaction.categoryId,
        clientId: parentTransaction.clientId,
        employeeId: parentTransaction.employeeId,
        description: `${parentTransaction.description} (Otomatik Tekrar)`,
        transactionDate: new Date(),
        isVatIncluded: parentTransaction.isVatIncluded,
        vatRate: parentTransaction.vatRate,
        isRecurring: false,
        parentTransactionId: parentTransactionId,
        userId: parentTransaction.userId,
      });

      // Update parent transaction's next recurring date
      await this.update(parentTransactionId, {
        nextRecurringDate: nextDate
      });

      return newTransaction;
    } catch (error) {
      this.handleError(error, 'process recurring transaction');
    }
  }

  /**
   * Calculate next recurring date
   */
  private calculateNextRecurringDate(currentDate: Date, period: string): Date {
    const nextDate = new Date(currentDate);
    
    switch (period) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }
}
