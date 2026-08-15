const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    // 1. Delete duplicate payouts for August 14
    await pool.query('DELETE FROM vendor_payouts WHERE date = \'2026-08-14\'');
    console.log('Deleted old August 14 payouts');

    // 2. Add Unique constraint if not exists
    try {
      await pool.query('ALTER TABLE vendor_payouts ADD CONSTRAINT vendor_payouts_stall_date_key UNIQUE (stall_id, date)');
      console.log('Added unique constraint');
    } catch(err) {
      console.log('Unique constraint might already exist or error: ' + err.message);
      // Clean up duplicates across all dates just in case
      await pool.query(`
        DELETE FROM vendor_payouts
        WHERE id NOT IN (
          SELECT MIN(id) FROM vendor_payouts GROUP BY stall_id, date
        )
      `);
      await pool.query('ALTER TABLE vendor_payouts ADD CONSTRAINT vendor_payouts_stall_date_key UNIQUE (stall_id, date)');
      console.log('Cleaned up all duplicates and added unique constraint');
    }

    // 3. Recalculate accurately for August 14 for all stalls
    const res = await pool.query(`
      INSERT INTO vendor_payouts (stall_id, date, gross_amount, commission_rate, commission_amount, net_amount, orders_count, status)
      SELECT 
        s.id,
        '2026-08-14'::date,
        COALESCE(SUM(oi.price_at_time * oi.quantity), 0) as gross_amount,
        COALESCE(s.commission_rate, 22.00) as commission_rate,
        COALESCE(SUM(oi.price_at_time * oi.quantity), 0) * (COALESCE(s.commission_rate, 22.00) / 100) as commission_amount,
        COALESCE(SUM(oi.price_at_time * oi.quantity), 0) - (COALESCE(SUM(oi.price_at_time * oi.quantity), 0) * (COALESCE(s.commission_rate, 22.00) / 100)) as net_amount,
        COUNT(DISTINCT o.id) as orders_count,
        'pending' as status
      FROM stalls s
      JOIN orders o ON o.stall_id = s.id AND o.status = 'delivered' AND DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') = '2026-08-14'
      JOIN order_items oi ON o.id = oi.order_id
      GROUP BY s.id
      HAVING COUNT(DISTINCT o.id) > 0
    `);
    console.log('Recalculated and inserted ' + res.rowCount + ' accurate records for Aug 14');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
