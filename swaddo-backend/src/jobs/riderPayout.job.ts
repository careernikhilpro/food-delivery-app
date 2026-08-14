import cron from 'node-cron';
import { pool } from '../db';
import { logger } from '../utils/logger';

export const startRiderPayoutJob = () => {
  // Runs at 11:59 PM every day in Asia/Kolkata timezone
  cron.schedule('59 23 * * *', async () => {
    logger.info('Running daily rider automated cashout job');
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate available amount for each rider: SUM(earnings_amount) from delivery_assignments where cashed_out = false and status = 'completed'
      const partnersRes = await client.query(`
        SELECT delivery_partner_id, SUM(earnings_amount) as total 
        FROM delivery_assignments 
        WHERE status = 'completed' AND cashed_out = false
        GROUP BY delivery_partner_id
        HAVING SUM(earnings_amount) > 0
      `);

      for (const partner of partnersRes.rows) {
        const partnerId = partner.delivery_partner_id;
        const availableAmount = parseFloat(partner.total);
        
        // Let's check if there is an ALREADY PENDING cashout request for this rider.
        const pendingRes = await client.query(`
          SELECT id, amount FROM cashout_requests 
          WHERE delivery_partner_id = $1 AND status = 'pending'
        `, [partnerId]);
        
        if (pendingRes.rows.length > 0) {
          // If there's already a pending request, just UPDATE its amount to include the latest total!
          await client.query(`
            UPDATE cashout_requests 
            SET amount = $1, updated_at = NOW()
            WHERE id = $2
          `, [availableAmount, pendingRes.rows[0].id]);
        } else {
          // Create a new cashout request
          await client.query(`
            INSERT INTO cashout_requests (delivery_partner_id, amount, status)
            VALUES ($1, $2, 'pending')
          `, [partnerId, availableAmount]);
        }
      }
      
      await client.query('COMMIT');
      logger.info('Daily rider automated cashout job completed successfully.');
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to run daily rider automated cashout job', error);
    } finally {
      client.release();
    }
  }, {
    timezone: 'Asia/Kolkata'
  });
};
