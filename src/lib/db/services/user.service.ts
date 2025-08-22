import { eq } from 'drizzle-orm';
import { users, Database } from '../connection';
import { BaseService } from './base.service';
import { User } from '../../database-schema';

export class UserService extends BaseService {
  constructor(database: Database) {
    super(database);
  }

  /**
   * Create a new user
   */
  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const newUser = {
        id: this.generateId(),
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.db.insert(users).values(newUser);
      return newUser;
    } catch (error) {
      this.handleError(error, 'create user');
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'find user by email');
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'find user by ID');
    }
  }

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id));

      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      return updatedUser;
    } catch (error) {
      this.handleError(error, 'update user');
    }
  }

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.db
        .delete(users)
        .where(eq(users.id, id));

      return result.affectedRows > 0;
    } catch (error) {
      this.handleError(error, 'delete user');
    }
  }

  /**
   * Get all users
   */
  async findAll(): Promise<User[]> {
    try {
      return await this.db.select().from(users);
    } catch (error) {
      this.handleError(error, 'get all users');
    }
  }

  /**
   * Verify user password (placeholder - implement with bcrypt)
   */
  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return null;
      }

      // TODO: Implement proper password hashing with bcrypt
      // For now, simple comparison for demo purposes
      if (user.password === password) {
        return user;
      }

      return null;
    } catch (error) {
      this.handleError(error, 'verify user password');
    }
  }
}
