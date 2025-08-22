import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

// Validate environment variables
const requiredEnvVars = {
  DB_HOST: process.env.DB_HOST,
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_DATABASE: process.env.DB_DATABASE,
  DB_PORT: process.env.DB_PORT,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Create connection pool for better performance
const pool = mysql.createPool({
  host: requiredEnvVars.DB_HOST!,
  user: requiredEnvVars.DB_USERNAME!,
  password: requiredEnvVars.DB_PASSWORD!,
  database: requiredEnvVars.DB_DATABASE!,
  port: parseInt(requiredEnvVars.DB_PORT!),
  charset: 'utf8mb4',
  timezone: '+03:00', // Turkey timezone
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create database instance
export const db = drizzle(pool, { 
  schema, 
  mode: 'default',
  logger: process.env.NODE_ENV === 'development'
});

// Export types
export type Database = typeof db;
export * from './schema';
