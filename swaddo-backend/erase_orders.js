const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearOrders() {
  try {
    console.log('Clearing all orders and related data...');
    // We use DELETE instead of TRUNCATE to respect cascade constraints cleanly, 
    // or we can just TRUNCATE CASCADE.
    await pool.query('TRUNCATE TABLE orders CASCADE');
    console.log('All old orders erased successfully.');
  } catch (error) {
    console.error('Error erasing orders:', error);
  } finally {
    pool.end();
  }
}

clearOrders();
