const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("ALTER TABLE delivery_assignments ADD CONSTRAINT delivery_assignments_order_id_key UNIQUE (order_id);")
  .then(res => console.log('Added UNIQUE constraint!'))
  .catch(console.error)
  .finally(() => pool.end());
