const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("UPDATE delivery_assignments SET status = 'cancelled' WHERE status IN ('accepted', 'picked_up') AND assigned_at < NOW() - INTERVAL '1 day'")
  .then(res => console.log('Fixed stuck assignments:', res.rowCount))
  .catch(console.error)
  .finally(() => pool.end());
