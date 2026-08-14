import cron from 'node-cron';
import { pool } from '../db';
import { logger } from '../utils/logger';

export const startPayoutJob = () => {
  // Runs at 11:59 PM every day IST
  cron.schedule('59 23 * * *', async () => {
    logger.info('Running daily merchant payout calculation job');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const stallsRes = await client.query('SELECT id, commission_rate FROM stalls');
      
      for (const stall of stallsRes.rows) {
        const stallId = stall.id;
        const commissionRate = parseFloat(stall.commission_rate || 22.00);

        // Compute today's revenue
        const todayRes = await client.query(`
          SELECT 
            COUNT(DISTINCT o.id) as orders,
            COALESCE(SUM(oi.price_at_time * oi.quantity), 0) as amount
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.stall_id = $1 AND o.status = 'delivered' AND DATE(o.created_at AT TIME ZONE 'Asia/Kolkata') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
        `, [stallId]);
        
        const ordersCount = parseInt(todayRes.rows[0].orders);
        const grossAmount = parseFloat(todayRes.rows[0].amount);

        if (ordersCount > 0) {
          const commissionAmount = grossAmount * (commissionRate / 100);
          const netAmount = grossAmount - commissionAmount;

          await client.query(`
            INSERT INTO vendor_payouts 
            (stall_id, date, gross_amount, commission_rate, commission_amount, net_amount, orders_count, status)
            VALUES ($1, DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'), $2, $3, $4, $5, $6, 'pending')
            ON CONFLICT (stall_id, date) DO UPDATE SET
              gross_amount = EXCLUDED.gross_amount,
              commission_amount = EXCLUDED.commission_amount,
              net_amount = EXCLUDED.net_amount,
              orders_count = EXCLUDED.orders_count
          `, [stallId, grossAmount, commissionRate, commissionAmount, netAmount, ordersCount]);
        }
      }
      
      await client.query('COMMIT');
      logger.info('Daily merchant payout calculation job completed successfully.');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to run daily merchant payout calculation job', error);
    } finally {
      client.release();
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
};
