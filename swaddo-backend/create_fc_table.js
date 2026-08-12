require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const createTableQuery = `
CREATE TABLE IF NOT EXISTS floating_cash_deposits (
    id SERIAL PRIMARY KEY,
    delivery_partner_id INTEGER REFERENCES delivery_partners(id),
    amount NUMERIC(10,2) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    screenshot_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

pool.query(createTableQuery)
  .then(() => {
    console.log('Table floating_cash_deposits created successfully');
    pool.end();
  })
  .catch(err => {
    console.error('Error creating table:', err);
    pool.end();
  });
