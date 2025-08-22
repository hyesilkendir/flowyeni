import { eq, and, desc } from 'drizzle-orm';
import { clients, currencies, Database } from '../connection';
import { BaseService } from './base.service';
import { Client } from '../../database-schema';

export class ClientService extends BaseService {
  constructor(database: Database) {
    super(database);
  }

  /**
   * Create a new client
   */
  async create(newClient: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client | null> {
    try {
      const clientData = {
        ...newClient,
        balance: newClient.balance.toString(), // Convert number to string for database
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await this.db.insert(clients).values(clientData);
      
      // Return the created client
      const result = await this.db
        .select()
        .from(clients)
        .where(eq(clients.id, newClient.id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  /**
   * Find client by ID
   */
  async findById(id: string): Promise<Client | null> {
    try {
      const result = await this.db
        .select()
        .from(clients)
        .where(eq(clients.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'find client by ID');
    }
  }

  /**
   * Get all clients for a user
   */
  async findByUserId(userId: string, includeInactive = false): Promise<Client[]> {
    try {
      const whereClause = includeInactive 
        ? eq(clients.userId, userId)
        : and(eq(clients.userId, userId), eq(clients.isActive, true));

      return await this.db
        .select()
        .from(clients)
        .where(whereClause)
        .orderBy(desc(clients.createdAt));
    } catch (error) {
      this.handleError(error, 'get clients by user ID');
    }
  }

  /**
   * Get clients with their currency information
   */
  async findByUserIdWithCurrency(userId: string, includeInactive = false): Promise<any[]> {
    try {
      const whereClause = includeInactive 
        ? eq(clients.userId, userId)
        : and(eq(clients.userId, userId), eq(clients.isActive, true));

      return await this.db
        .select({
          id: clients.id,
          name: clients.name,
          email: clients.email,
          phone: clients.phone,
          address: clients.address,
          taxNumber: clients.taxNumber,
          contactPerson: clients.contactPerson,
          contractStartDate: clients.contractStartDate,
          contractEndDate: clients.contractEndDate,
          balance: clients.balance,
          isActive: clients.isActive,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
          currency: {
            id: currencies.id,
            code: currencies.code,
            name: currencies.name,
            symbol: currencies.symbol,
          }
        })
        .from(clients)
        .leftJoin(currencies, eq(clients.currencyId, currencies.id))
        .where(whereClause)
        .orderBy(desc(clients.createdAt));
    } catch (error) {
      this.handleError(error, 'get clients with currency');
    }
  }

  /**
   * Update client
   */
  async update(id: string, updateData: Partial<Client>): Promise<Client | null> {
    try {
      const dataToUpdate = {
        ...updateData,
        balance: updateData.balance?.toString(), // Convert number to string if present
        updatedAt: new Date(),
      };
      
      await this.db
        .update(clients)
        .set(dataToUpdate)
        .where(eq(clients.id, id));
      
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  /**
   * Update client balance
   */
  async updateBalance(id: string, amount: number, operation: 'add' | 'subtract' = 'add'): Promise<Client> {
    try {
      const client = await this.findById(id);
      if (!client) {
        throw new Error('Client not found');
      }

      const newBalance = operation === 'add' 
        ? client.balance + amount 
        : client.balance - amount;

      return await this.update(id, { balance: newBalance });
    } catch (error) {
      this.handleError(error, 'update client balance');
    }
  }

  /**
   * Delete client (soft delete - set inactive)
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.update(id, { isActive: false });
      return true;
    } catch (error) {
      this.handleError(error, 'delete client');
    }
  }

  /**
   * Hard delete client
   */
  async hardDelete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(clients)
        .where(eq(clients.id, id));

      return result.affectedRows > 0;
    } catch (error) {
      this.handleError(error, 'hard delete client');
    }
  }

  /**
   * Search clients by name
   */
  async searchByName(userId: string, searchTerm: string): Promise<Client[]> {
    try {
      const result = await this.db
        .select()
        .from(clients)
        .where(and(
          eq(clients.userId, userId),
          eq(clients.isActive, true)
        ));

      // Simple name filtering (in production, use SQL LIKE or full-text search)
      return result.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      this.handleError(error, 'search clients by name');
    }
  }

  /**
   * Get clients with outstanding balances
   */
  async getClientsWithBalance(userId: string, balanceType: 'positive' | 'negative' | 'all' = 'all'): Promise<Client[]> {
    try {
      const allClients = await this.findByUserId(userId);
      
      switch (balanceType) {
        case 'positive':
          return allClients.filter(client => client.balance > 0);
        case 'negative':
          return allClients.filter(client => client.balance < 0);
        default:
          return allClients.filter(client => client.balance !== 0);
      }
    } catch (error) {
      this.handleError(error, 'get clients with balance');
    }
  }
}
