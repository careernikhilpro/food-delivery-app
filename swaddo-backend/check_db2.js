const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT * FROM delivery_assignments WHERE status IN ('accepted', 'picked_up')")
  .then(res => console.log('Remaining stuck assignments:', res.rowCount))
  .catch(console.error)
  .finally(() => pool.end());
