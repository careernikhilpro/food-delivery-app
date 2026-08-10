const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("UPDATE orders SET status = 'cancelled' WHERE status = 'ready' AND created_at < NOW() - INTERVAL '2 hours'")
  .then(res => console.log('Cleared remaining orphaned ready orders:', res.rowCount))
  .catch(console.error)
  .finally(() => pool.end());
