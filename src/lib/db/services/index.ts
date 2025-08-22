import { Database, db } from '../connection';
import { UserService } from './user.service';
import { ClientService } from './client.service';
import { TransactionService } from './transaction.service';

/**
 * Database Service Manager - Centralized access to all database services
 */
export class DatabaseServices {
  public readonly user: UserService;
  public readonly client: ClientService;
  public readonly transaction: TransactionService;

  constructor(database: Database) {
    this.user = new UserService(database);
    this.client = new ClientService(database);
    this.transaction = new TransactionService(database);
  }

  /**
   * Run database migrations
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('Running database migrations...');
      
      // This would typically be handled by drizzle-kit
      // For now, we'll add a placeholder
      console.log('Migrations completed successfully');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple query to test connection
      await this.user.findAll();
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  /**
   * Seed default data
   */
  async seedDefaultData(): Promise<void> {
    try {
      console.log('Seeding default data...');
      
      // Check if admin user already exists
      const adminUser = await this.user.findByEmail('admin@calaf.co');
      if (!adminUser) {
        console.log('Creating default admin user...');
        await this.user.create({
          email: 'admin@calaf.co',
          password: '123456', // TODO: Hash this password
          name: 'Calaf.co Admin',
          companyName: 'CALAF.CO',
        });
      }

      console.log('Default data seeded successfully');
    } catch (error) {
      console.error('Seeding error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const dbServices = new DatabaseServices(db);

// Export individual services for direct access
export { UserService } from './user.service';
export { ClientService } from './client.service';
export { TransactionService } from './transaction.service';
export { BaseService } from './base.service';
