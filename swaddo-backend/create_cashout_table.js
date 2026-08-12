require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTableQuery = `
CREATE TABLE IF NOT EXISTS cashout_requests (
    id SERIAL PRIMARY KEY,
    delivery_partner_id INTEGER REFERENCES delivery_partners(id),
    amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE delivery_assignments ADD COLUMN IF NOT EXISTS cashed_out BOOLEAN DEFAULT false;
`;

pool.query(createTableQuery)
  .then(() => {
    console.log('Tables setup successfully');
    pool.end();
  })
  .catch(err => {
    console.error('Error:', err);
    pool.end();
  });
