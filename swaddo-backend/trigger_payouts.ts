import { pool } from './src/db';
import { logger } from './src/utils/logger';
import dotenv from 'dotenv';
dotenv.config();

async function backfill() {
  logger.info('Running backfill for historical merchant payouts');
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const stallsRes = await client.query('SELECT id, commission_rate FROM stalls');
    
    for (const stall of stallsRes.rows) {
      const stallId = stall.id;
      const commissionRate = parseFloat(stall.commission_rate || 22.00);

      // Get daily revenue grouped by date for past orders
      const historicalRes = await client.query(`
        SELECT 
          DATE(o.created_at) as payout_date,
          COUNT(DISTINCT o.id) as orders,
          COALESCE(SUM(oi.price_at_time * oi.quantity), 0) as amount
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.stall_id = $1 AND o.status = 'delivered'
        GROUP BY DATE(o.created_at)
        ORDER BY payout_date ASC
      `, [stallId]);
      
      for (const row of historicalRes.rows) {
          const payoutDate = row.payout_date;
          const ordersCount = parseInt(row.orders);
          const grossAmount = parseFloat(row.amount);

          if (ordersCount > 0) {
            const commissionAmount = grossAmount * (commissionRate / 100);
            const netAmount = grossAmount - commissionAmount;

            // Check if it already exists
            const existing = await client.query('SELECT id FROM vendor_payouts WHERE stall_id = $1 AND date = $2', [stallId, payoutDate]);
            if (existing.rows.length === 0) {
                await client.query(`
                INSERT INTO vendor_payouts 
                (stall_id, date, gross_amount, commission_rate, commission_amount, net_amount, orders_count, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
                `, [stallId, payoutDate, grossAmount, commissionRate, commissionAmount, netAmount, ordersCount]);
                console.log(`Inserted historical payout for stall ${stallId} on ${payoutDate}: Net Amount ₹${netAmount}`);
            }
          }
      }
    }
    
    await client.query('COMMIT');
    logger.info('Historical backfill completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to run historical backfill', error);
  } finally {
    client.release();
    pool.end();
  }
}

backfill();
