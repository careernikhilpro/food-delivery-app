const { Pool } = require('pg');
require('dotenv').config({ path: 'd:/swaddoapk/swaddo-backend/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    const ordersRes = await pool.query("SELECT id, status, stall_id FROM orders WHERE status = 'ready'");
    console.log("Ready Orders:", ordersRes.rows);

    const ridersRes = await pool.query("SELECT id, user_id, current_status, last_ping FROM delivery_partners WHERE current_status = 'online'");
    console.log("Online Riders:", ridersRes.rows);

    const assignments = await pool.query("SELECT * FROM delivery_assignments WHERE status IN ('pending', 'accepted', 'picked_up')");
    console.log("Active Assignments:", assignments.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
