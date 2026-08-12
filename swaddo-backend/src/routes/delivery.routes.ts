import { Router, Response, NextFunction } from 'express';
import { pool } from '../db';
import { authenticate, requireDelivery, AuthRequest } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';
import { redis } from '../redis';
import { assignmentManager } from '../services/assignment';
import { routeETA } from '../services/maps/mapProvider';
import { emitOrderStatusUpdate } from '../utils/socketEmitters';

function calculatePickupPayout(distance: number): number {
  if (distance <= 0.4) return 0;
  if (distance <= 0.6) return 1;
  if (distance <= 0.8) return 2;
  if (distance <= 1.2) return 3;
  if (distance <= 1.8) return 4;
  if (distance <= 2.4) return 5;
  if (distance <= 3.0) return 6;
  if (distance <= 3.5) return 7;
  if (distance <= 4.0) return 8;
  return 10;
}

const router = Router();

router.post('/profile/fcm-token', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body; // 'token' here will be the JSON.stringify(subscription)
    if (!token) return res.status(400).json({ message: 'Token is required' });
    
    await pool.query(
      `UPDATE delivery_partners SET fcm_token = $1 WHERE user_id = $2`,
      [token, req.user!.id]
    );
    res.json({ message: 'Web Push subscription registered' });
  } catch (err) {
    next(err);
  }
});

router.get('/profile/vapid-key', authenticate, requireDelivery, async (req: AuthRequest, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.get('/profile', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const partnerRes = await pool.query(
      `SELECT dp.*, u.name, u.phone 
       FROM delivery_partners dp 
       JOIN users u ON dp.user_id = u.id 
       WHERE dp.user_id = $1 LIMIT 1`, 
      [userId]
    );
    
    if (partnerRes.rows.length === 0) {
      return res.json({ active: false });
    }
    
    const partner = partnerRes.rows[0];
    const partnerId = partner.id;

    // Fetch deposit history
    const depositRes = await pool.query(`
      SELECT amount, created_at as date, status
      FROM deposit_history
      WHERE delivery_partner_id = $1
      ORDER BY created_at DESC LIMIT 10
    `, [partnerId]);

    // Fetch online sessions
    const sessionRes = await pool.query(`
      SELECT date, online_minutes
      FROM rider_daily_stats
      WHERE delivery_partner_id = $1
      ORDER BY date DESC LIMIT 7
    `, [partnerId]);

    res.json({ data: {
      name: partner.name,
      phone: partner.phone,
      vehicle: partner.vehicle_details || 'Bike',
      active: partner.is_active,
      kycStatus: partner.is_active ? 'verified' : 'pending',
      documents: {
        aadharStatus: partner.id_proof_status || 'pending',
        licenseStatus: partner.dl_status || 'pending',
        rcStatus: partner.rc_status || 'pending',
        aadharNumber: partner.aadhar_number || '',
        dlNumber: partner.dl_number || '',
        rcNumber: partner.rc_number || ''
      },
      bankDetails: {
        bankName: partner.bank_name || '',
        accountName: partner.account_name || '',
        accountNumber: partner.account_number || '',
        ifscCode: partner.ifsc_code || ''
      },
      depositHistory: depositRes.rows,
      onlineSessions: sessionRes.rows
    }});
  } catch (err) {
    next(err);
  }
});

router.patch('/profile', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, vehicle, bankDetails } = req.body;
    
    // Update name in users
    if (name) {
      await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
    }
    
    // Update vehicle in delivery_partners
    if (vehicle) {
      await pool.query('UPDATE delivery_partners SET vehicle_details = $1 WHERE user_id = $2', [vehicle, userId]);
    }
    
    if (bankDetails) {
      await pool.query(
        'UPDATE delivery_partners SET bank_name = $1, account_name = $2, account_number = $3, ifsc_code = $4 WHERE user_id = $5',
        [bankDetails.bankName, bankDetails.accountName, bankDetails.accountNumber, bankDetails.ifscCode, userId]
      );
    }
    
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/profile/kyc', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { aadharNumber, dlNumber, rcNumber } = req.body;
    
    // Check if they are already filled
    const partnerRes = await pool.query(
      `SELECT aadhar_number, dl_number, rc_number FROM delivery_partners WHERE user_id = $1`,
      [userId]
    );
    
    if (partnerRes.rows.length === 0) {
      // Create the delivery partner row if it somehow doesn't exist
      await pool.query(
        `INSERT INTO delivery_partners (user_id, aadhar_number, dl_number, rc_number, id_proof_status, dl_status, rc_status, is_active)
         VALUES ($1, $2, $3, $4, 'verified', 'verified', 'verified', false)`,
        [userId, aadharNumber, dlNumber, rcNumber]
      );
      return res.json({ message: 'KYC details submitted successfully' });
    }
    
    const p = partnerRes.rows[0];
    
    if (p.aadhar_number || p.dl_number || p.rc_number) {
      return res.status(400).json({ message: 'KYC details have already been submitted. You can only submit them once.' });
    }
    
    if (!aadharNumber || !dlNumber || !rcNumber) {
      return res.status(400).json({ message: 'Please provide all KYC document numbers.' });
    }

    await pool.query(
      `UPDATE delivery_partners 
       SET aadhar_number = $1, dl_number = $2, rc_number = $3,
           id_proof_status = 'verified', dl_status = 'verified', rc_status = 'verified'
       WHERE user_id = $4`,
      [aadharNumber, dlNumber, rcNumber, userId]
    );
    
    res.json({ message: 'KYC details submitted successfully' });
  } catch (err) {
    next(err);
  }
});

const gpsLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60, // 1 ping per second
  message: { message: 'GPS ping rate limit exceeded' }
});

router.post('/ping', authenticate, requireDelivery, gpsLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.body;
    
    // Store latest GPS in Redis for fast access by Socket.io
    await redis.set(`rider_loc:${req.user!.id}`, JSON.stringify({ latitude: lat, longitude: lng, updated_at: new Date() }), { EX: 60 });

    // Ensure we update DB so AssignmentManager can find this rider
    await pool.query(
      `UPDATE delivery_partners 
       SET last_lat = $1, last_lng = $2, last_ping = NOW() 
       WHERE user_id = $3`,
      [lat, lng, req.user!.id]
    );
    
    res.json({ status: 'ok' });
  } catch (err) {
    next(err);
  }
});

router.post('/status', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body; // 'online' or 'offline'
    if (status !== 'online' && status !== 'offline') {
      return res.status(400).json({ message: 'Status must be online or offline' });
    }

    const { pool } = require('../db');
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner not found' });
    const partnerId = partnerRes.rows[0].id;

    if (status === 'online') {
      const userRes = await pool.query(`SELECT float_limit FROM users WHERE id = $1`, [req.user!.id]);
      const floatLimit = parseFloat(userRes.rows[0].float_limit || 2000);

      const floatRes = await pool.query(`
        SELECT COALESCE(SUM(o.total_amount), 0) as floating_cash
        FROM delivery_assignments da
        JOIN orders o ON da.order_id = o.id
        WHERE da.delivery_partner_id = $1 
          AND da.status = 'completed' 
          AND da.cash_collected = true 
          AND da.cash_deposited = false
          AND o.payment_method = 'cod'
      `, [partnerId]);
      
      const floatingCash = parseFloat(floatRes.rows[0].floating_cash);
      if (floatingCash >= floatLimit) {
        return res.status(403).json({ 
          message: `Floating cash limit (₹${floatLimit}) reached. Please deposit cash to go online.`,
          code: 'FLOATING_CASH_LIMIT'
        });
      }
    }

    await pool.query(
      `UPDATE delivery_partners SET current_status = $1, last_ping = NOW() WHERE user_id = $2`,
      [status, req.user!.id]
    );

    if (status === 'offline') {
      assignmentManager.handleRiderLogout(req.user!.id.toString());
    }

    res.json({ message: `Status updated to ${status}` });
  } catch (err) {
    next(err);
  }
});


router.get('/assignments/active', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner not found' });
    const partnerId = partnerRes.rows[0].id;

    // Fetch all active assignments for this rider
    const activeQuery = `
      SELECT da.order_id as "orderId", da.status as "assignmentStatus", da.pickup_distance_km as "pickupDistance", 
             da.earnings_amount as "earnings", da.pickup_payout as "pickupPayout",
             o.status as "orderStatus", o.delivery_lat as "deliveryLat", o.delivery_lng as "deliveryLng",
             o.delivery_address as "deliveryAddress", o.total_amount as "totalAmount", o.payment_method as "paymentMethod",
             s.name as "stallName", s.latitude as "stallLat", s.longitude as "stallLng", s.location as "stallAddress", v_u.phone as "stallPhone",
             c.name as "customerName", c.phone as "customerPhone", o.delivery_instructions as "deliveryInstructions"
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      JOIN stalls s ON o.stall_id = s.id
      LEFT JOIN vendors v ON s.vendor_id = v.id
      LEFT JOIN users v_u ON v.user_id = v_u.id
      LEFT JOIN users c ON o.customer_id = c.id
      WHERE da.delivery_partner_id = $1 AND da.status IN ('assigned', 'accepted', 'picked_up')
      ORDER BY da.assigned_at ASC
    `;
    const result = await pool.query(activeQuery, [partnerId]);
    
    res.json({ data: result.rows });
  } catch (err) {
    next(err);
  }
});

router.patch('/assignments/:id/accept', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const jobId = req.params.id;
  let client;
  
  try {
    const { riderId } = req.body;
    
    console.log(`[ACCEPT] RECEIVED
[ACCEPT] riderId=${riderId}
[ACCEPT] orderId=${jobId.includes('_') ? jobId.split('_')[1] : jobId}`);

    if (!riderId) {
      console.log(`[ACCEPT] Missing riderId`);
      return res.status(400).json({ message: 'Rider ID is required' });
    }

    const promisedOffer = assignmentManager.getPromisedOffer(jobId, riderId);
    
    const { pool } = require('../db');
    const orderId = jobId.includes('_') ? jobId.split('_')[1] : jobId;

    if (!promisedOffer) {
      // It might be a duplicate request from the same rider who already successfully accepted it.
      const assignmentCheck = await pool.query(
        `SELECT * FROM delivery_assignments WHERE order_id = $1 AND delivery_partner_id = (SELECT id FROM delivery_partners WHERE user_id = $2)`,
        [orderId, req.user!.id]
      );
      if (assignmentCheck.rows.length > 0) {
        const currentAssignmentStatus = assignmentCheck.rows[0].status;
        if (currentAssignmentStatus === 'assigned') {
            console.log(`[ACCEPT] Processing admin manual assignment for order ${orderId}`);
            await pool.query('UPDATE delivery_assignments SET status = $1 WHERE order_id = $2 AND delivery_partner_id = (SELECT id FROM delivery_partners WHERE user_id = $3)', ['accepted', orderId, req.user!.id]);
            await pool.query("UPDATE orders SET status = 'heading_to_stall' WHERE id = $1 AND status IN ('assigned', 'ready')", [orderId]);
            assignmentManager.revokeJob(jobId);
        }
        console.log(`[ACCEPT] HTTP_200 (idempotent or manual accept)`);
        return res.json({ message: 'Job accepted successfully (idempotent)' });
      }
      console.log(`[ACCEPT] ERROR: Job no longer available`);
      return res.status(409).json({ message: 'ORDER_ALREADY_ACCEPTED' });
    }

    client = await pool.connect();
    
    await client.query('BEGIN');
    await client.query("SET LOCAL statement_timeout = '10s'");

    // ATOMIC DB LOCK: Only update if the order is still in 'assigned' or 'ready' state
    const checkBeforeUpdate = await client.query(`SELECT status FROM orders WHERE id = $1`, [orderId]);
    const currentStatus = checkBeforeUpdate.rows.length > 0 ? checkBeforeUpdate.rows[0].status : 'unknown';
    console.log(`[ACCEPT] currentStatus=${currentStatus}`);

    const updateRes = await client.query(
      `UPDATE orders SET status = 'heading_to_stall' WHERE id = $1 AND status IN ('ready', 'assigned') RETURNING *`,
      [orderId]
    );
    
    console.log(`[ACCEPT] UPDATE_ROWS=${updateRes.rowCount}`);

    if (updateRes.rows.length === 0) {
      // Order could not be claimed. Check why.
      const checkStatus = await client.query(`SELECT status FROM orders WHERE id = $1`, [orderId]);
      assignmentManager.revokeJob(jobId);
      
      await client.query('ROLLBACK');
      
      if (checkStatus.rows.length > 0) {
          const assignmentCheck = await pool.query(
            `SELECT * FROM delivery_assignments WHERE order_id = $1 AND delivery_partner_id = (SELECT id FROM delivery_partners WHERE user_id = $2)`,
            [orderId, req.user!.id]
          );
          if (assignmentCheck.rows.length > 0) {
             console.log(`[ACCEPT] HTTP_200 (after rollback)`);
             return res.json({ message: 'Job accepted successfully (idempotent)' });
          }
          console.log(`[ACCEPT] ERROR: 409 Conflict`);
          return res.status(409).json({ message: 'ORDER_ALREADY_ACCEPTED' });
      }
      console.log(`[ACCEPT] ERROR: 404 Not Found`);
      return res.status(404).json({ message: 'Order not found in DB' });
    }
    
    const totalPayout = promisedOffer.totalPayout || 0;
    const actualPickupDist = promisedOffer.pickupDistance || 0;
    const actualDeliveryDist = promisedOffer.dropoffDistance || 0;
    const pickupPayout = promisedOffer.pickupPayout || 0;
    const returnPayout = promisedOffer.returnPayout || 0;

    // INSERT into delivery_assignments to track earnings and distances exactly as promised
    await client.query(
      `INSERT INTO delivery_assignments (order_id, delivery_partner_id, status, pickup_distance_km, delivery_distance_km, earnings_amount, pickup_payout, return_payout)
       VALUES ($1, (SELECT id FROM delivery_partners WHERE user_id = $2), $3, $4, $5, $6, $7, $8)
       ON CONFLICT (order_id) DO NOTHING`,
      [orderId, req.user!.id, 'accepted', actualPickupDist, actualDeliveryDist, totalPayout, pickupPayout, returnPayout]
    );

    await client.query('COMMIT');
    console.log(`[ACCEPT] COMMIT`);
    assignmentManager.markJobClaimed(jobId, riderId);

    // Set cooldown to true if rider has reached 2 active orders
    try {
      const activeCountRes = await pool.query(
        `SELECT COUNT(id) as count 
         FROM delivery_assignments 
         WHERE delivery_partner_id = (SELECT id FROM delivery_partners WHERE user_id = $1)
         AND status IN ('accepted', 'picked_up')`,
        [req.user!.id]
      );
      if (parseInt(activeCountRes.rows[0].count) >= 2) {
        await pool.query(`UPDATE delivery_partners SET cooldown = true WHERE user_id = $1`, [req.user!.id]);
        console.log(`[Database] Rider ${req.user!.id} hit 2 active orders, entering cooldown mode.`);
      } else {
        // If they have less than 2 orders, check if they can get another one immediately!
        assignmentManager.checkPendingJobsForRider(req.user!.id.toString());
      }
    } catch (e) {
      console.error("Error setting cooldown state", e);
    }

    // Fetch real rider info
    const riderRes = await pool.query(
       `SELECT u.name, u.phone, dp.vehicle_details 
        FROM delivery_partners dp
        JOIN users u ON dp.user_id = u.id
        WHERE dp.user_id = $1`,
      [req.user!.id]
    );

    let riderName = "Rider";
    let riderPhone = "N/A";
    let riderVehicle = "Not provided";

    if (riderRes.rows.length > 0) {
      riderName = riderRes.rows[0].name;
      riderPhone = riderRes.rows[0].phone;
      riderVehicle = riderRes.rows[0].vehicle_details;
    }

    if (updateRes.rows.length > 0) {
      const order = updateRes.rows[0];
      const extraData = {
        deliveryPartner: { name: riderName, phone: riderPhone, vehicle: riderVehicle }
      };
      
      // Emit to targeted channels via central helper!
      emitOrderStatusUpdate(req.app, order.id, order.stall_id, 'heading_to_stall', extraData);
      
      // Emit to the specific rider so their other devices sync immediately
      if (req.body.riderId) {
        req.app.get('io').to(`rider_${req.body.riderId}`).emit('job_accepted_by_me', order);
      }
    }
    
    console.log(`[ACCEPT] HTTP_200`);
    res.json({ message: 'Job accepted successfully' });
  } catch (err) {
    if (client) {
       console.log(`[ACCEPT] Rolling back transaction due to error.`);
       try { await client.query('ROLLBACK'); } catch (e) {}
    }
    console.error("[ACCEPT] Error in transaction:", err);
    next(err);
  } finally {
    if (client) {
       client.release();
    }
  }
});
// GET Dashboard Stats
router.get('/dashboard', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    const statsRes = await pool.query(`
      SELECT 
        COUNT(id) as total_deliveries,
        COALESCE(SUM(earnings_amount), 0) as total_earnings
      FROM delivery_assignments
      WHERE delivery_partner_id = $1 AND status = 'completed' AND DATE(assigned_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
    `, [partnerId]);

    const userRes = await pool.query(`SELECT float_limit FROM users WHERE id = $1`, [req.user!.id]);
    const floatLimit = parseFloat(userRes.rows[0].float_limit || 2000);

    // Floating Cash (All completed COD deliveries where cash_collected is true, assuming rider hasn't deposited yet)
    // In reality, you would subtract any deposits made by the rider.
    const floatRes = await pool.query(`
      SELECT COALESCE(SUM(o.total_amount), 0) as floating_cash
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      WHERE da.delivery_partner_id = $1 
        AND da.status = 'completed' 
        AND da.cash_collected = true 
        AND da.cash_deposited = false
        AND o.payment_method = 'cod'
    `, [partnerId]);

    // Get Online Minutes from rider_daily_stats
    const sessionRes = await pool.query(`
      SELECT online_minutes 
      FROM rider_daily_stats 
      WHERE delivery_partner_id = $1 AND date = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
    `, [partnerId]);
    
    let totalMinutes = sessionRes.rows.length > 0 ? sessionRes.rows[0].online_minutes : 0;

    // Check if there is a pending floating cash deposit
    const pendingRes = await pool.query(`
      SELECT id FROM floating_cash_deposits 
      WHERE delivery_partner_id = $1 AND status = 'pending' LIMIT 1
    `, [partnerId]);

    const hasPendingDeposit = pendingRes.rows.length > 0;
    
    res.json({
      deliveries: parseInt(statsRes.rows[0].total_deliveries),
      earnings: parseFloat(statsRes.rows[0].total_earnings),
      floatingCash: parseFloat(floatRes.rows[0].floating_cash),
      floatLimit: floatLimit,
      hours: totalMinutes, // Frontend will interpret this as total minutes and format it
      hasPendingDeposit: hasPendingDeposit
    });
  } catch (err) {
    next(err);
  }
});

// POST Deposit Floating Cash
router.post('/deposit', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    // First, find how much cash is floating right now
    const floatRes = await pool.query(`
      SELECT COALESCE(SUM(o.total_amount), 0) as floating_cash
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      WHERE da.delivery_partner_id = $1 
        AND da.status = 'completed' 
        AND da.cash_collected = true 
        AND da.cash_deposited = false
        AND o.payment_method = 'cod'
    `, [partnerId]);

    const amount = parseFloat(floatRes.rows[0].floating_cash);

    if (amount <= 0) {
        return res.status(400).json({ message: 'No floating cash to deposit' });
    }

    const { transactionId, screenshotBase64 } = req.body;
    if (!transactionId || !screenshotBase64) {
        return res.status(400).json({ message: 'Transaction ID and screenshot are required' });
    }

    // Insert into floating_cash_deposits as pending
    await pool.query(`
        INSERT INTO floating_cash_deposits (delivery_partner_id, amount, transaction_id, screenshot_url, status)
        VALUES ($1, $2, $3, $4, 'pending')
    `, [partnerId, amount, transactionId, screenshotBase64]);

    res.json({ message: 'Deposit request submitted successfully. Pending admin approval.' });
  } catch (err) {
    next(err);
  }
});

// POST Ping Time
router.post('/ping-time', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    await pool.query(`
      INSERT INTO rider_daily_stats (delivery_partner_id, date, online_minutes) 
      VALUES ($1, DATE(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'), 1) 
      ON CONFLICT (delivery_partner_id, date) 
      DO UPDATE SET online_minutes = rider_daily_stats.online_minutes + 1
    `, [partnerId]);

    res.json({ message: 'Ping recorded' });
  } catch (err) {
    next(err);
  }
});


// GET Earnings
router.get('/earnings', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    
    // Get Rider's delivery partner ID safely
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    // Fetch all completed assignments for this rider
    const earningsQuery = `
      SELECT da.id, da.earnings_amount, da.pickup_payout, da.return_payout, da.assigned_at, da.pickup_distance_km, da.delivery_distance_km, da.cash_collected,
             o.stall_id, o.payment_method, o.total_amount, s.name as stall_name
      FROM delivery_assignments da
      JOIN orders o ON da.order_id = o.id
      JOIN stalls s ON o.stall_id = s.id
      WHERE da.delivery_partner_id = $1 AND da.status = 'completed'
      ORDER BY da.assigned_at DESC
    `;
    const result = await pool.query(earningsQuery, [partnerId]);
    const deliveries = result.rows;

    const nowStr = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
    const nowIST = new Date(nowStr);
    let todayEarnings = 0;
    let weekEarnings = 0;
    let monthEarnings = 0;

    const calcRes = await pool.query(`
      SELECT SUM(earnings_amount) as total 
      FROM delivery_assignments 
      WHERE delivery_partner_id = $1 AND status = 'completed' AND cashed_out = false
    `, [partnerId]);
    const availableCashout = parseFloat(calcRes.rows[0].total || '0');

    // Daily breakdown for the past 7 days (including today)
    const dailyBreakdown = Array(7).fill(0).map((_, i) => {
      const d = new Date(nowIST);
      d.setDate(d.getDate() - (6 - i));
      // Format as YYYY-MM-DD in IST
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return { date: `${yyyy}-${mm}-${dd}`, dayName: ['S','M','T','W','T','F','S'][d.getDay()], earnings: 0 };
    });

    const deliveryHistory = deliveries.map((d: any) => {
      // Parse assigned_at assuming it is UTC in DB, convert to IST
      const dDateStr = new Date(d.assigned_at || Date.now()).toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
      const dDateIST = new Date(dDateStr);
      
      const diffTime = Math.abs(nowIST.getTime() - dDateIST.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const pickupKm = parseFloat(d.pickup_distance_km || '0');
      const deliveryKm = parseFloat(d.delivery_distance_km || '0');
      const totalDist = (pickupKm + deliveryKm).toFixed(1);
      
      // Use the locked earnings_amount from the DB!
      const finalAmount = parseFloat(d.earnings_amount || '0');
      
      let pickupFee = d.pickup_payout !== null ? parseFloat(d.pickup_payout) : 0;
      let returnFee = d.return_payout !== null ? parseFloat(d.return_payout) : 0;
      let dropFee = finalAmount - pickupFee - returnFee;
      
      // Fallback for old orders where pickup_payout and return_payout were not saved
      if (d.pickup_payout === null && d.return_payout === null) {
          if (pickupKm > 0.4 && pickupKm <= 0.6) pickupFee = 1;
          else if (pickupKm <= 0.8) pickupFee = 2;
          else if (pickupKm <= 1.2) pickupFee = 3;
          else if (pickupKm <= 1.8) pickupFee = 4;
          else if (pickupKm <= 2.4) pickupFee = 5;
          else if (pickupKm <= 3.0) pickupFee = 6;
          else if (pickupKm <= 3.5) pickupFee = 7;
          else if (pickupKm <= 4.0) pickupFee = 8;
          else if (pickupKm > 4.0) pickupFee = 10;
          
          if (d.payment_method === 'cod') {
            const extraDropDist = deliveryKm > 3 ? deliveryKm - 3 : 0;
            returnFee = 3 + (extraDropDist * 10);
          }
          dropFee = finalAmount - pickupFee - returnFee;
      }

      if (diffDays === 0 && dDateIST.getDate() === nowIST.getDate()) todayEarnings += finalAmount;
      if (diffDays < 7) weekEarnings += finalAmount;
      if (dDateIST.getMonth() === nowIST.getMonth() && dDateIST.getFullYear() === nowIST.getFullYear()) monthEarnings += finalAmount;

      const yyyy = dDateIST.getFullYear();
      const mm = String(dDateIST.getMonth() + 1).padStart(2, '0');
      const dd = String(dDateIST.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayData = dailyBreakdown.find(day => day.date === dateStr);
      if (dayData) dayData.earnings += finalAmount;

      const isCod = d.payment_method === 'cod';

      // Format time correctly (e.g. 06:05 PM)
      const timeString = dDateIST.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

      return {
        id: d.id.toString(),
        date: diffDays === 0 ? `Today, ${timeString}` : `${dDateIST.toLocaleDateString('en-IN')} • ${timeString}`,
        stall: d.stall_name,
        amount: finalAmount,
        distance: `${totalDist} km`,
        breakdown: {
          pickup: pickupFee,
          drop: dropFee,
          return: returnFee
        },
        codAmount: isCod && d.cash_collected ? parseFloat(d.total_amount) : 0
      };
    });

    res.json({
      todayEarnings,
      weekEarnings,
      monthEarnings,
      availableCashout,
      dailyBreakdown: dailyBreakdown,
      deliveryHistory: deliveryHistory.slice(0, 20) // Pagination could be added here
    });

  } catch (err) {
    next(err);
  }
});
// POST Request Cashout
router.post('/cashout/request', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    // Check if they already made a request today
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
    const recentRes = await pool.query(`
      SELECT id FROM cashout_requests 
      WHERE delivery_partner_id = $1 
      AND created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata' >= $2::date
    `, [partnerId, todayStr]);

    if (recentRes.rows.length > 0) {
      return res.status(400).json({ message: 'You can only request a cashout once per day.' });
    }

    // Calculate available balance: SUM(earnings_amount) from delivery_assignments where cashed_out = false and status = 'completed'
    // Exclude COD orders where they haven't deposited the cash? 
    // Actually, simple way: sum all completed deliveries where cashed_out = false.
    const calcRes = await pool.query(`
      SELECT SUM(earnings_amount) as total 
      FROM delivery_assignments 
      WHERE delivery_partner_id = $1 AND status = 'completed' AND cashed_out = false
    `, [partnerId]);
    
    const availableAmount = parseFloat(calcRes.rows[0].total || '0');
    
    if (availableAmount <= 0) {
      return res.status(400).json({ message: 'No available earnings to cashout.' });
    }

    // Create the request
    await pool.query(`
      INSERT INTO cashout_requests (delivery_partner_id, amount, status)
      VALUES ($1, $2, 'pending')
    `, [partnerId, availableAmount]);

    res.json({ message: 'Cashout requested successfully. Processing takes 6-10 hours.', amount: availableAmount });
  } catch (err) {
    next(err);
  }
});

// GET Cashout History
router.get('/cashout/history', authenticate, requireDelivery, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pool } = require('../db');
    
    const partnerRes = await pool.query(`SELECT id FROM delivery_partners WHERE user_id = $1`, [req.user!.id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Delivery partner profile not found' });
    const partnerId = partnerRes.rows[0].id;

    // Get last 7 days of cashout history
    const historyRes = await pool.query(`
      SELECT id, amount, status, created_at, updated_at, admin_notes
      FROM cashout_requests
      WHERE delivery_partner_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [partnerId]);

    res.json(historyRes.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
