import { Database } from '../connection';

/**
 * Base service class with common database operations
 */
export abstract class BaseService {
  protected db: Database;

  constructor(database: Database) {
    this.db = database;
  }

  /**
   * Generate a unique ID
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle database errors uniformly
   */
  protected handleError(error: any, operation: string): never {
    console.error(`Database error in ${operation}:`, error);
    throw new Error(`Failed to ${operation}: ${error.message || 'Unknown database error'}`);
  }

  /**
   * Execute a transaction safely
   */
  protected async executeTransaction<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      this.handleError(error, 'execute transaction');
    }
  }
}
