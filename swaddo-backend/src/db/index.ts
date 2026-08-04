import { Pool } from 'pg';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ...(process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.com') ? { ssl: { rejectUnauthorized: false } } : {})
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
});
