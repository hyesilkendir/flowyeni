#!/usr/bin/env node

import { config } from 'dotenv';
config();

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Migration Runner with Enhanced Error Handling
 */
class MigrationRunner {
  private connection: mysql.Connection | null = null;

  async connect(): Promise<void> {
    try {
      // Validate environment variables
      const requiredEnvVars = {
        DB_HOST: process.env.DB_HOST,
        DB_USERNAME: process.env.DB_USERNAME,
        DB_PASSWORD: process.env.DB_PASSWORD,
        DB_PORT: process.env.DB_PORT,
      };

      const missingVars = Object.entries(requiredEnvVars)
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      }

      this.connection = await mysql.createConnection({
        host: requiredEnvVars.DB_HOST!,
        user: requiredEnvVars.DB_USERNAME!,
        password: requiredEnvVars.DB_PASSWORD!,
        port: parseInt(requiredEnvVars.DB_PORT!),
        multipleStatements: true,
        charset: 'utf8mb4',
        timezone: '+03:00',
      });

      console.log('✅ Connected to MySQL database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async createDatabaseIfNotExists(): Promise<void> {
    if (!this.connection) {
      throw new Error('Database connection not established');
    }

    const dbName = process.env.DB_DATABASE || 'calafco_accounting';
    
    try {
      await this.connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await this.connection.query(`USE \`${dbName}\``);
      console.log(`✅ Database '${dbName}' is ready`);
    } catch (error) {
      console.error('❌ Failed to create/use database:', error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    if (!this.connection) {
      throw new Error('Database connection not established');
    }

    try {
      const migrationsDir = path.join(__dirname, 'migrations');
      
      if (!fs.existsSync(migrationsDir)) {
        console.log('📁 Migrations directory not found, skipping migrations');
        return;
      }

      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log(`📄 Found ${files.length} migration files`);

      for (const file of files) {
        try {
          console.log(`🔄 Running migration: ${file}`);
          const filePath = path.join(migrationsDir, file);
          const sqlContent = fs.readFileSync(filePath, 'utf8');
          
          // Split and execute statements
          const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

          for (const statement of statements) {
            if (statement.trim()) {
              await this.connection!.execute(statement);
            }
          }
          
          console.log(`✅ Migration ${file} completed successfully`);
        } catch (error) {
          console.error(`❌ Migration ${file} failed:`, error);
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ Migration process failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Main execution
async function main() {
  const runner = new MigrationRunner();
  
  try {
    console.log('🚀 Starting migration process...');
    
    await runner.connect();
    await runner.createDatabaseIfNotExists();
    await runner.runMigrations();
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
