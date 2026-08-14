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
      const partnersRes = await client.query(\
        SELECT delivery_partner_id, SUM(earnings_amount) as total 
        FROM delivery_assignments 
        WHERE status = 'completed' AND cashed_out = false
        GROUP BY delivery_partner_id
        HAVING SUM(earnings_amount) > 0
      \);

      for (const partner of partnersRes.rows) {
        const partnerId = partner.delivery_partner_id;
        const availableAmount = parseFloat(partner.total);

        // Check if there is already a pending cashout request for today (so we don't duplicate if they manually requested recently and it wasn't approved)
        // Wait, if they manually requested at 2 PM, and then earned more by 11 PM, the new availableAmount WILL include the 2 PM amount because cashed_out is still false!
        // To be safe, let's just insert it. Admin approving the new one will just approve all cashed_out = false. 
        // Wait, if we insert a new one, admin will see TWO requests. If admin approves the first one, it sets cashed_out = true. Then the second one will be approved and set NOTHING to cashed_out = true (0 payout), but the request will say "amount: X". This is a bit messy.
        
        // Let's check if there is an ALREADY PENDING cashout request for this rider.
        const pendingRes = await client.query(\
          SELECT id, amount FROM cashout_requests 
          WHERE delivery_partner_id =  AND status = 'pending'
        \, [partnerId]);
        
        if (pendingRes.rows.length > 0) {
          // If there's already a pending request, just UPDATE its amount to include the latest total!
          await client.query(\
            UPDATE cashout_requests 
            SET amount = , updated_at = NOW()
            WHERE id = 
          \, [availableAmount, pendingRes.rows[0].id]);
        } else {
          // Create a new cashout request
          await client.query(\
            INSERT INTO cashout_requests (delivery_partner_id, amount, status)
            VALUES (, , 'pending')
          \, [partnerId, availableAmount]);
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
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
};
