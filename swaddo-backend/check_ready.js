const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT id, status, updated_at FROM orders WHERE status = 'ready'")
  .then(res => console.log('Ready Orders:', res.rows))
  .catch(console.error)
  .finally(() => pool.end());
