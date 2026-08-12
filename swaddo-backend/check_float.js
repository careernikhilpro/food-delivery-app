require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const floatRes = await pool.query(`
        SELECT COALESCE(SUM(o.total_amount), 0) as floating_cash
        FROM delivery_assignments da
        JOIN orders o ON da.order_id = o.id
        WHERE da.delivery_partner_id = 1
          AND da.status = 'completed' 
          AND da.cash_collected = true 
          AND da.cash_deposited = false
          AND o.payment_method = 'cod'
    `);
    console.log("Floating cash for rider 1:", floatRes.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
