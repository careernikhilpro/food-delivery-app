
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      DO $$ BEGIN
        ALTER TABLE stalls ADD COLUMN commission_rate DECIMAL(5,2) DEFAULT 22.00;
      EXCEPTION WHEN duplicate_column THEN null; END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_payouts (
        id SERIAL PRIMARY KEY,
        stall_id INTEGER REFERENCES stalls(id),
        date DATE NOT NULL,
        gross_amount DECIMAL(10,2) NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(10,2) NOT NULL,
        net_amount DECIMAL(10,2) NOT NULL,
        orders_count INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Migration for payouts complete.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
require('dotenv').config();
