import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { authenticate, requireAdmin } from '../middleware/auth';
import { logger } from '../utils/logger';
import { assignmentManager } from '../services/assignment';
// We use require to avoid tsc and runtime issues with native modules on some environments
const bcrypt = require('bcryptjs');

// Simple haversine formula for distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

const router = Router();

// Protect all admin routes
router.use(authenticate, requireAdmin);

// 1. Dashboard Stats
router.get('/clear-restaurants', async (req: Request, res: Response) => {
  try {
    const keepRes = await pool.query("SELECT id, name FROM stalls WHERE name ILIKE '%suddh shakahari momo%'");
    if (keepRes.rows.length === 0) {
      return res.json({ message: 'Warning: Could not find restaurant matching "suddh shakahari momo". No action taken.' });
    }
    const keepId = keepRes.rows[0].id;
    await pool.query('DELETE FROM menu_items WHERE stall_id != $1', [keepId]);
    await pool.query('DELETE FROM stalls WHERE id != $1', [keepId]);
    res.json({ message: 'Cleanup completed successfully! Kept ID: ' + keepId });
  } catch (error) {
    res.status(500).json({ message: 'Error cleaning up', error: error });
  }
});

router.get('/fix-db', async (req: Request, res: Response) => {
  try {
    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS item_total DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS restaurant_share DECIMAL(10, 2) DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS delivery_instructions TEXT,
      ADD COLUMN IF NOT EXISTS restaurant_instructions TEXT;
    `);
    res.json({ message: 'Table altered successfully!' });
  } catch (error) {
    logger.error('Error altering table', error);
    res.status(500).json({ message: 'Error altering table', error: error });
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ordersRes = await pool.query("SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= $1 AND status != 'cancelled'", [today]);
    const vendorsRes = await pool.query("SELECT COUNT(*) as count FROM vendors WHERE status = 'active'");
    const ridersRes = await pool.query("SELECT COUNT(*) as count FROM delivery_partners WHERE id_proof_status = 'verified'");
    const disputesRes = await pool.query("SELECT COUNT(*) as count FROM disputes WHERE status = 'open'");

    res.json({
      ordersToday: parseInt(ordersRes.rows[0].count),
      revenueToday: parseFloat(ordersRes.rows[0].revenue),
      activeVendors: parseInt(vendorsRes.rows[0].count),
      activeRiders: parseInt(ridersRes.rows[0].count),
      pendingDisputes: parseInt(disputesRes.rows[0].count)
    });
  } catch (error) {
    logger.error('Admin Stats Error', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// 2. Vendors
router.get('/vendor-payouts', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT vp.*, s.name as stall_name, v.business_name 
      FROM vendor_payouts vp
      JOIN stalls s ON vp.stall_id = s.id
      JOIN vendors v ON s.vendor_id = v.id
      ORDER BY vp.date DESC, vp.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching vendor payouts:', error);
    res.status(500).json({ message: 'Error fetching payouts' });
  }
});

router.put('/vendor-payouts/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateRes = await pool.query(
      "UPDATE vendor_payouts SET status = 'settled' WHERE id = $1 RETURNING *",
      [id]
    );
    if (updateRes.rows.length === 0) return res.status(404).json({ message: 'Payout not found' });
    res.json(updateRes.rows[0]);
  } catch (error) {
    logger.error('Error approving payout:', error);
    res.status(500).json({ message: 'Error approving payout' });
  }
});

router.get('/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await pool.query(`
      SELECT v.*, u.name, u.phone, u.raw_password,
      (SELECT name FROM stalls WHERE vendor_id = v.id LIMIT 1) as stall_name,
      (SELECT is_active FROM stalls WHERE vendor_id = v.id LIMIT 1) as is_active, (SELECT id FROM stalls WHERE vendor_id = v.id LIMIT 1) as stall_id
      FROM vendors v 
      JOIN users u ON v.user_id = u.id 
      ORDER BY v.id DESC
    `);
    res.json(vendors.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors' });
  }
});

router.patch('/vendors/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const vendor = await pool.query('UPDATE vendors SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(vendor.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor' });
  }
});

router.patch('/vendors/:id/toggle-visibility', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const checkStall = await pool.query('SELECT id FROM stalls WHERE vendor_id = $1 LIMIT 1', [id]);
    if (checkStall.rows.length > 0) {
      await pool.query('UPDATE stalls SET is_active = $1 WHERE vendor_id = $2', [is_active, id]);
      res.json({ message: 'Store visibility updated' });
    } else {
      res.status(404).json({ message: 'Store not found for this vendor' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating visibility' });
  }
});

router.delete('/riders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user_id first
    const rider = await pool.query('SELECT user_id FROM delivery_partners WHERE id = $1', [id]);
    if (rider.rows.length === 0) {
      return res.status(404).json({ message: 'Rider not found' });
    }
    const userId = rider.rows[0].user_id;

    await pool.query('BEGIN');
    
    // Delete stats and deposits related to this rider
    await pool.query('DELETE FROM rider_daily_stats WHERE delivery_partner_id = $1', [id]);
    await pool.query('DELETE FROM deposit_history WHERE delivery_partner_id = $1', [id]);
    await pool.query('DELETE FROM delivery_assignments WHERE delivery_partner_id = $1', [id]);
    
    // Delete the rider profile
    await pool.query('DELETE FROM delivery_partners WHERE id = $1', [id]);
    
    // Delete the user account if they are only a delivery partner
    await pool.query('DELETE FROM users WHERE id = $1 AND role = $2', [userId, 'delivery']);
    
    await pool.query('COMMIT');
    res.json({ message: 'Rider deleted successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting rider:', error);
    res.status(500).json({ message: 'Error deleting rider' });
  }
});

router.delete('/vendors/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid vendor ID' });
    
    // Get stalls for this vendor
    const stallsRes = await pool.query(`SELECT id FROM stalls WHERE vendor_id = ${id}`);
    const stallIds = stallsRes.rows.map(s => s.id);

    if (stallIds.length > 0) {
      const idsStr = stallIds.join(',');
      // Delete delivery assignments related to orders of these stalls
      await pool.query(`DELETE FROM delivery_assignments WHERE order_id IN (SELECT id FROM orders WHERE stall_id IN (${idsStr}))`);
      // Delete order items
      await pool.query(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE stall_id IN (${idsStr}))`);
      // Delete orders
      await pool.query(`DELETE FROM orders WHERE stall_id IN (${idsStr})`);
      // Delete menu items
      await pool.query(`DELETE FROM menu_items WHERE stall_id IN (${idsStr})`);
      // Delete stalls
      await pool.query(`DELETE FROM stalls WHERE vendor_id = ${id}`);
    }
    
    // Finally delete the vendor
    await pool.query(`DELETE FROM vendors WHERE id = ${id}`);
    
    res.json({ message: 'Vendor and all associated data deleted successfully' });
  } catch (error) {
    logger.error('Error deleting vendor:', error);
    res.status(500).json({ message: 'Error deleting vendor' });
  }
});

router.get('/vendors/:id/details', async (req: Request, res: Response) => {
  try {
    const vendorId = req.params.id;
    // Get vendor details
    const vendorRes = await pool.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Get their stalls
    const stallsRes = await pool.query('SELECT * FROM stalls WHERE vendor_id = $1', [vendorId]);
    
    // Get menu items for all their stalls
    const stallIds = stallsRes.rows.map(s => s.id);
    let menuItems: any[] = [];
    if (stallIds.length > 0) {
      const menuRes = await pool.query('SELECT * FROM menu_items WHERE stall_id = ANY($1)', [stallIds]);
      menuItems = menuRes.rows;
    }

    // Attach items to their respective stalls
    const stallsWithItems = stallsRes.rows.map(stall => ({
      ...stall,
      menu_items: menuItems.filter(item => item.stall_id === stall.id)
    }));

    res.json({
      ...vendorRes.rows[0],
      stalls: stallsWithItems
    });
  } catch (err) {
    console.error('Error fetching vendor details:', err);
    res.status(500).json({ message: 'Error fetching vendor details' });
  }
});

router.put('/stalls/:id', async (req: Request, res: Response) => {
  try {
    const stallId = req.params.id;
    const { rating, prep_time, commission_rate } = req.body;
    
    const updateRes = await pool.query(
      'UPDATE stalls SET rating = COALESCE($1, rating), prep_time = COALESCE($2, prep_time), commission_rate = COALESCE($4, commission_rate) WHERE id = $3 RETURNING *',
      [rating, prep_time, stallId, commission_rate]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ message: 'Stall not found' });
    }

    res.json(updateRes.rows[0]);
  } catch (err) {
    console.error('Error updating stall:', err);
    res.status(500).json({ message: 'Error updating stall' });
  }
});

// Add Menu Item
router.post('/vendors/:stallId/menu', async (req: Request, res: Response) => {
  try {
    const { stallId } = req.params;
    const { name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons } = req.body;
    
    if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });

    const result = await pool.query(
      'INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        stallId, name, description || null, price, is_veg ?? true, is_available ?? true, category || 'Main Course',
        variants ? JSON.stringify(variants) : '[]', prep_time_minutes || 15, discount_percentage || 0,
        addons ? JSON.stringify(addons) : '[]'
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Error adding admin menu item', error);
    res.status(500).json({ message: 'Error adding menu item' });
  }
});

// Update Menu Item
router.put('/vendors/menu/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const { name, description, price, is_veg, is_available, category, variants, prep_time_minutes, discount_percentage, addons } = req.body;
    
    const result = await pool.query(
      `UPDATE menu_items 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           price = COALESCE($3, price), 
           is_veg = COALESCE($4, is_veg), 
           is_available = COALESCE($5, is_available), 
           category = COALESCE($6, category),
           variants = $7,
           prep_time_minutes = COALESCE($8, prep_time_minutes),
           discount_percentage = COALESCE($9, discount_percentage),
           addons = COALESCE($10, addons)
       WHERE id = $11 RETURNING *`,
      [
        name, description, price, is_veg, is_available, category, 
        variants ? JSON.stringify(variants) : null, prep_time_minutes, discount_percentage, 
        addons ? JSON.stringify(addons) : null, 
        itemId
      ]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ message: 'Item not found' });
    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error updating admin menu item', error);
    res.status(500).json({ message: 'Error updating menu item' });
  }
});

// Delete Menu Item
router.delete('/vendors/menu/:itemId', async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    await pool.query('DELETE FROM menu_items WHERE id = $1', [itemId]);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    logger.error('Error deleting admin menu item', error);
    res.status(500).json({ message: 'Error deleting menu item' });
  }
});

// 3. Orders
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const orders = await pool.query(`
      SELECT 
        o.*, 
        u.name as customer_name, 
        u.phone as customer_phone,
        CASE WHEN u.pin_hash IS NOT NULL THEN true ELSE false END as customer_has_pin,
        s.name as stall_name,
        (
          SELECT json_agg(json_build_object(
            'id', oi.id,
            'name', COALESCE(oi.item_name, mi.name, 'Unknown Item'),
            'variant_name', oi.variant_name,
            'addons', oi.addons,
            'quantity', oi.quantity,
            'price_at_time', oi.price_at_time
          ))
          FROM order_items oi
          LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id
          WHERE oi.order_id = o.id
        ) as items,
        (
          SELECT json_build_object(
            'id', da.delivery_partner_id,
            'name', ru.name,
            'phone', ru.phone,
            'status', da.status,
            'photo_url', dp.photo_url,
            'vehicle_details', dp.vehicle_details
          )
          FROM delivery_assignments da
          JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
          JOIN users ru ON dp.user_id = ru.id
          WHERE da.order_id = o.id
          LIMIT 1
        ) as rider
      FROM orders o 
      LEFT JOIN users u ON o.customer_id = u.id 
      LEFT JOIN stalls s ON o.stall_id = s.id 
      ORDER BY o.created_at DESC LIMIT 100
    `);
    res.json(orders.rows);
  } catch (error) {
    logger.error('Error fetching admin orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

router.post('/orders/:id/assign', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { rider_id } = req.body; // This is delivery_partners.id

    if (!rider_id) {
      return res.status(400).json({ message: 'Rider ID is required' });
    }

    await client.query('BEGIN');
    
    // Check if order exists and is not cancelled/delivered
    const orderCheck = await client.query('SELECT status FROM orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) throw new Error('Order not found');
    
    // Check if rider is already assigned to this order
    const existingAssignment = await client.query('SELECT id FROM delivery_assignments WHERE order_id = $1', [id]);
    
    if (existingAssignment.rows.length > 0) {
      await client.query('UPDATE delivery_assignments SET delivery_partner_id = $1, status = $2, assigned_at = NOW() WHERE order_id = $3', [rider_id, 'assigned', id]);
    } else {
      await client.query('INSERT INTO delivery_assignments (order_id, delivery_partner_id, status) VALUES ($1, $2, $3)', [id, rider_id, 'assigned']);
    }

    // Update order status if it was payment_pending or placed
    if (['payment_pending', 'placed', 'preparing'].includes(orderCheck.rows[0].status)) {
      await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['preparing', id]);
    }

    await client.query('COMMIT');
    
    // Notify the rider via socket if they are online
    const dpRes = await pool.query('SELECT user_id FROM delivery_partners WHERE id = $1', [rider_id]);
    if (dpRes.rows.length > 0) {
      const riderUserId = dpRes.rows[0].user_id.toString();
      const onlineRider = assignmentManager.getOnlineRider(riderUserId);
      
      if (onlineRider) {
        onlineRider.isBusy = true; // mark them busy so system doesn't assign other orders
      }
    }

    res.json({ message: 'Rider assigned successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error('Error assigning rider from admin:', error);
    res.status(500).json({ message: error.message || 'Error assigning rider' });
  } finally {
    client.release();
  }
});

router.post('/orders/:id/cancel-assignment', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');
    
    // Check if assignment exists
    const existingAssignment = await client.query('SELECT delivery_partner_id FROM delivery_assignments WHERE order_id = $1', [id]);
    
    if (existingAssignment.rows.length > 0) {
      const rider_id = existingAssignment.rows[0].delivery_partner_id;
      // Delete the assignment
      await client.query('DELETE FROM delivery_assignments WHERE order_id = $1', [id]);
      
      // Update rider status to not busy
      const dpRes = await pool.query('SELECT user_id FROM delivery_partners WHERE id = $1', [rider_id]);
      if (dpRes.rows.length > 0) {
        const riderUserId = dpRes.rows[0].user_id.toString();
        const onlineRider = assignmentManager.getOnlineRider(riderUserId);
        if (onlineRider) {
          onlineRider.isBusy = false; 
        }
      }
    }

    await client.query('COMMIT');
    res.json({ message: 'Assignment cancelled successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    logger.error('Error cancelling assignment from admin:', error);
    res.status(500).json({ message: error.message || 'Error cancelling assignment' });
  } finally {
    client.release();
  }
});


router.get('/orders/:id/available-riders', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get order and stall location
    const orderRes = await pool.query(`
      SELECT o.id, s.latitude, s.longitude 
      FROM orders o 
      JOIN stalls s ON o.stall_id = s.id 
      WHERE o.id = $1
    `, [id]);
    
    if (orderRes.rows.length === 0) return res.status(404).json({ message: 'Order not found' });
    const stall = orderRes.rows[0];

    // Get ALL online riders from memory, not just 'available' (isBusy) ones, so we can check active orders < 2
    const allOnline = Array.from(assignmentManager.onlineRiders.entries());
    const userIds = allOnline.map(([userId]) => userId);

    if (userIds.length === 0) {
      return res.json([]);
    }

    // Get their DB info and active order count
    const ridersRes = await pool.query(`
      SELECT dp.id as delivery_partner_id, dp.user_id, u.name, u.phone,
        (SELECT COUNT(*) FROM delivery_assignments da WHERE da.delivery_partner_id = dp.id AND da.status IN ('assigned', 'accepted', 'picked_up')) as active_orders
      FROM delivery_partners dp 
      JOIN users u ON dp.user_id = u.id 
      WHERE dp.user_id = ANY($1::int[])
    `, [userIds]);

    const result = ridersRes.rows
      .filter(r => parseInt(r.active_orders) <= 1) // Only free or 1 order
      .map(r => {
        const memData = assignmentManager.getOnlineRider(r.user_id.toString());
        let distance = null;
        if (memData && memData.lat && memData.lng && stall.latitude && stall.longitude) {
          distance = getDistance(stall.latitude, stall.longitude, memData.lat, memData.lng);
        }
        return {
          ...r,
          active_orders: parseInt(r.active_orders),
          distance,
          lat: memData?.lat,
          lng: memData?.lng
        };
      });

    // Sort by distance
    result.sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

    res.json(result);
  } catch (error) {
    logger.error('Error fetching available riders:', error);
    res.status(500).json({ message: 'Error fetching available riders' });
  }
});

// 4. Disputes
router.get('/disputes', async (req: Request, res: Response) => {
  try {
    const disputes = await pool.query(`
      SELECT d.*, o.total_amount, u.name as customer_name, u.phone as customer_phone
      FROM disputes d
      LEFT JOIN orders o ON d.order_id = o.id
      LEFT JOIN users u ON d.customer_id = u.id
      ORDER BY d.created_at DESC
    `);
    res.json(disputes.rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching disputes' });
  }
});

router.patch('/disputes/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // 'resolved' or 'refunded'
    const dispute = await pool.query('UPDATE disputes SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    res.json(dispute.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error resolving dispute' });
  }
});

// 5. Riders
router.get('/riders', async (req: Request, res: Response) => {
  try {
    const riders = await pool.query(`
      SELECT d.*, u.name, u.phone, u.float_limit, u.raw_password 
      FROM delivery_partners d 
      JOIN users u ON d.user_id = u.id 
      ORDER BY d.id DESC
    `);
    
    const mapped = riders.rows.map(r => {
      const memData = assignmentManager.getOnlineRider(r.user_id.toString());
      const isOnline = !!memData;
      return {
        ...r,
        current_status: isOnline ? 'online' : 'offline',
        is_busy: isOnline ? memData.isBusy : false,
        isOnline: isOnline,
        lat: memData?.lat,
        lng: memData?.lng
      };
    });
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching riders' });
  }
});

router.patch('/riders/:id/profile', async (req: Request, res: Response) => {
  try {
    const { name, vehicle_details, photo_url } = req.body;
    const { id } = req.params;

    const partnerRes = await pool.query(`SELECT user_id FROM delivery_partners WHERE id = $1`, [id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Rider not found' });
    const userId = partnerRes.rows[0].user_id;

    if (name !== undefined) {
      await pool.query(`UPDATE users SET name = $1 WHERE id = $2`, [name, userId]);
    }

    if (vehicle_details !== undefined || photo_url !== undefined) {
      const updateFields = [];
      const updateValues = [];
      let idx = 1;
      
      if (vehicle_details !== undefined) {
        updateFields.push(`vehicle_details = $${idx++}`);
        updateValues.push(vehicle_details);
      }
      if (photo_url !== undefined) {
        updateFields.push(`photo_url = $${idx++}`);
        updateValues.push(photo_url);
      }
      
      if (updateFields.length > 0) {
        updateValues.push(id);
        await pool.query(
          `UPDATE delivery_partners SET ${updateFields.join(', ')} WHERE id = $${idx}`,
          updateValues
        );
      }
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile' });
  }
});

router.patch('/riders/:id/kyc', async (req: Request, res: Response) => {
  try {
    const { id_proof_status, dl_status, rc_status, is_active } = req.body;
    
    const updateFields = [];
    const updateValues = [];
    let idx = 1;

    if (id_proof_status !== undefined) {
      updateFields.push(`id_proof_status = $${idx++}`);
      updateValues.push(id_proof_status);
    }
    if (dl_status !== undefined) {
      updateFields.push(`dl_status = $${idx++}`);
      updateValues.push(dl_status);
    }
    if (rc_status !== undefined) {
      updateFields.push(`rc_status = $${idx++}`);
      updateValues.push(rc_status);
    }
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${idx++}`);
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(req.params.id);
    const query = `UPDATE delivery_partners SET ${updateFields.join(', ')} WHERE id = $${idx} RETURNING *`;
    
    const rider = await pool.query(query, updateValues);
    res.json(rider.rows[0]);
  } catch (error) {
    logger.error('Error updating kyc', error);
    res.status(500).json({ message: 'Error updating kyc' });
  }
});

router.patch('/riders/:id/float-limit', async (req: Request, res: Response) => {
  try {
    const { float_limit } = req.body;
    const { id } = req.params;

    // We need to update the float_limit in the users table, but :id is the delivery_partners id
    const partnerRes = await pool.query(`SELECT user_id FROM delivery_partners WHERE id = $1`, [id]);
    if (partnerRes.rows.length === 0) return res.status(404).json({ message: 'Rider not found' });
    const userId = partnerRes.rows[0].user_id;

    await pool.query(`UPDATE users SET float_limit = $1 WHERE id = $2`, [float_limit, userId]);

    res.json({ message: 'Float limit updated successfully', float_limit });
  } catch (error) {
    res.status(500).json({ message: 'Error updating float limit' });
  }
});

// Floating Cash Admin Endpoints
router.get('/floating-cash/pending', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT fcd.*, u.name as rider_name, u.phone as rider_phone 
      FROM floating_cash_deposits fcd
      JOIN delivery_partners dp ON fcd.delivery_partner_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE fcd.status = 'pending'
      ORDER BY fcd.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending deposits' });
  }
});

router.get('/floating-cash/history', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT fcd.*, u.name as rider_name, u.phone as rider_phone 
      FROM floating_cash_deposits fcd
      JOIN delivery_partners dp ON fcd.delivery_partner_id = dp.id
      JOIN users u ON dp.user_id = u.id
      WHERE fcd.status IN ('approved', 'rejected')
      ORDER BY fcd.updated_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching deposit history' });
  }
});

router.post('/floating-cash/approve/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // 1. Get the deposit request
    const depositRes = await pool.query('SELECT * FROM floating_cash_deposits WHERE id = $1 AND status = $2', [id, 'pending']);
    if (depositRes.rows.length === 0) {
      return res.status(404).json({ message: 'Pending deposit request not found' });
    }
    const deposit = depositRes.rows[0];

    // 2. Mark as approved
    await pool.query('UPDATE floating_cash_deposits SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', id]);

    // 3. Deduct floating cash by marking assignments as deposited
    // We update older assignments first up to the amount. For simplicity since amount matches exact floating cash, we update all.
    await pool.query(`
      UPDATE delivery_assignments da
      SET cash_deposited = true
      FROM orders o
      WHERE da.order_id = o.id
        AND da.delivery_partner_id = $1
        AND da.status = 'completed'
        AND da.cash_collected = true
        AND da.cash_deposited = false
        AND o.payment_method = 'cod'
    `, [deposit.delivery_partner_id]);

    res.json({ message: 'Deposit approved successfully' });
  } catch (err) {
    logger.error('Approve error', err);
    res.status(500).json({ message: 'Error approving deposit' });
  }
});

router.post('/floating-cash/reject/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    await pool.query(
      'UPDATE floating_cash_deposits SET status = $1, admin_notes = $2, updated_at = NOW() WHERE id = $3', 
      ['rejected', adminNotes || '', id]
    );
    res.json({ message: 'Deposit rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Error rejecting deposit' });
  }
});


// 6. Broadcast Notifications
import { notificationService } from '../services/notification';

router.post('/notifications/send', async (req: Request, res: Response) => {
  try {
    const { title, message, segment, imageUrl } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }
    
    let query = '';
    // Select users based on segment
    if (segment === 'customers') {
      query = `SELECT id, fcm_token FROM users`;
    } else if (segment === 'merchants') {
      query = `SELECT u.id, u.fcm_token FROM users u JOIN vendors v ON u.id = v.user_id`;
    } else if (segment === 'riders') {
      query = `SELECT u.id, u.fcm_token FROM users u JOIN delivery_partners dp ON u.id = dp.user_id`;
    } else {
      // all
      query = `SELECT id, fcm_token FROM users`;
    }

    const result = await pool.query(query);
    const users = result.rows;

    if (users.length === 0) {
      return res.status(200).json({ success: true, message: 'No users found to broadcast.', count: 0 });
    }

    // Insert notifications in DB with 24h expiry
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertQuery = `
        INSERT INTO notifications (user_id, title, body, type, expires_at)
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
      `;
      for (const u of users) {
        await client.query(insertQuery, [u.id, title, message, 'promo']);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('DB Insert failed for broadcast', err);
    } finally {
      client.release();
    }

    // Send push via Firebase (fire and forget for now, but ideally background job)
    const tokens = users.map(u => u.fcm_token).filter(Boolean);
    if (tokens.length > 0) {
       notificationService.broadcastToTokens(tokens, title, message, {
         type: 'broadcast',
         imageUrl: imageUrl || ''
       }).catch(console.error);
    }

    // Also broadcast via socket for those who have the app open
    req.app.get('io').emit('admin_notification', { title, message });
    
    res.json({ success: true, message: 'Notification broadcasted successfully', count: tokens.length });
  } catch (error) {
    logger.error('Error broadcasting notification', error);
    res.status(500).json({ message: 'Error broadcasting notification' });
  }
});

// 7. Support System
router.get('/support/tickets', async (req: Request, res: Response) => {
  try {
    const tickets = await pool.query(`
      SELECT t.*, u.name, u.phone, u.role
      FROM support_tickets t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(tickets.rows);
  } catch (error) {
    logger.error('Error fetching admin tickets', error);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
});

router.post('/support/tickets/:id/reply', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Ensure ticket exists
    const ticketRes = await pool.query('SELECT status FROM support_tickets WHERE id = $1', [ticketId]);
    if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

    const result = await pool.query(
      'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES ($1, $2, $3) RETURNING *',
      [ticketId, 'admin', message]
    );

    await pool.query('UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [ticketId]);

    // Broadcast to the support room so the user sees it instantly
    req.app.get('io').to(`support_${ticketId}`).emit('support_message', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Error sending admin reply', error);
    res.status(500).json({ message: 'Error sending reply' });
  }
});

router.patch('/support/tickets/:id/status', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.id;
    const { status } = req.body; // 'open' or 'closed'
    
    await pool.query('UPDATE support_tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, ticketId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status' });
  }
});

// --- Customers ---

// Get all customers
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.phone, u.email, u.created_at, u.raw_password,
              COUNT(o.id) as total_orders
       FROM users u
       LEFT JOIN orders o ON u.id = o.customer_id
       WHERE u.role = 'customer'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (error) {
    logger.error('Error fetching customers', error);
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

// Reset Customer PIN
router.post('/customers/:id/reset-pin', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPin } = req.body;
    
    if (!newPin || newPin.length !== 4) {
      return res.status(400).json({ message: 'A 4-digit PIN is required' });
    }

    const salt = await bcrypt.genSalt(10);
    const pinHash = await bcrypt.hash(newPin, salt);

    const result = await pool.query(
      'UPDATE users SET pin_hash = $1, raw_password = $2 WHERE id = $3 AND role = $4 RETURNING id',
      [pinHash, newPin, id, 'customer']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'PIN reset successfully' });
  } catch (error) {
    logger.error('Error resetting customer PIN', error);
    res.status(500).json({ message: 'Error resetting customer PIN' });
  }
});

// --- Rider Cashouts ---
router.get('/cashouts/pending', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
        SELECT c.*, u.name as rider_name, u.phone as rider_phone 
        FROM cashout_requests c
        JOIN delivery_partners dp ON c.delivery_partner_id = dp.id
        JOIN users u ON dp.user_id = u.id
        WHERE c.status = 'pending'
      ORDER BY c.created_at ASC
    `);
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching pending cashouts', err);
    res.status(500).json({ message: 'Error fetching pending cashouts' });
  }
});

router.get('/cashouts/history', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
        SELECT c.*, u.name as rider_name, u.phone as rider_phone 
        FROM cashout_requests c
        JOIN delivery_partners dp ON c.delivery_partner_id = dp.id
        JOIN users u ON dp.user_id = u.id
        WHERE c.status IN ('approved', 'rejected')
      ORDER BY c.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    logger.error('Error fetching cashout history', err);
    res.status(500).json({ message: 'Error fetching cashout history' });
  }
});

router.post('/cashouts/approve/:id', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    const cashoutRes = await client.query("SELECT * FROM cashout_requests WHERE id = $1 AND status = 'pending'", [id]);
    if (cashoutRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Pending cashout request not found' });
    }
    const cashout = cashoutRes.rows[0];

    await client.query("UPDATE cashout_requests SET status = 'approved', updated_at = NOW() WHERE id = $1", [id]);

    await client.query(`
        UPDATE delivery_assignments da
        SET cashed_out = true
        FROM orders o
        WHERE da.order_id = o.id
          AND da.delivery_partner_id = $1
          AND da.status = 'completed'
          AND da.cashed_out = false
          AND (o.payment_method != 'cod' OR da.cash_deposited = true)
      `, [cashout.delivery_partner_id]);

    await client.query('COMMIT');
    res.json({ message: 'Cashout approved successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Approve cashout error', err);
    res.status(500).json({ message: 'Error approving cashout' });
  } finally {
    client.release();
  }
});

router.post('/cashouts/reject/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(
      "UPDATE cashout_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1", 
      [id]
    );
    res.json({ message: 'Cashout rejected' });
  } catch (err) {
    logger.error('Reject cashout error', err);
    res.status(500).json({ message: 'Error rejecting cashout' });
  }
});

// Admin Vendor Profile Override
router.patch('/vendors/:id/profile', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fssai_license, gst_number, pan_number, aadhaar_number, bank_account_name, bank_account_number, bank_ifsc } = req.body;
    const result = await pool.query(
      'UPDATE vendors SET fssai_license=$1, gst_number=$2, pan_number=$3, aadhaar_number=$4, bank_account_name=$5, bank_account_number=$6, bank_ifsc=$7 WHERE id=$8 RETURNING *',
      [fssai_license, gst_number, pan_number, aadhaar_number, bank_account_name, bank_account_number, bank_ifsc, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Vendor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update vendor profile error', err);
    res.status(500).json({ message: 'Error updating vendor profile' });
  }
});

// Get all Campaign Requests
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT c.*, v.business_name, s.name as stall_name 
      FROM campaign_requests c
      JOIN vendors v ON c.vendor_id = v.id
      JOIN stalls s ON c.stall_id = s.id
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    logger.error('Get campaigns error', err);
    res.status(500).json({ message: 'Error fetching campaigns' });
  }
});

// Update Campaign Status
router.patch('/campaigns/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
      "UPDATE campaign_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *", 
      [status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Campaign not found' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error('Update campaign status error', err);
    res.status(500).json({ message: 'Error updating campaign status' });
  }
});

// Get Active Store Offers
router.get('/offers', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.name as stall_name, v.business_name,
             s.active_offer_title, s.active_offer_discount, 
             s.active_offer_min, s.active_offer_max, s.active_offer_is_active
      FROM stalls s
      JOIN vendors v ON s.vendor_id = v.id
      WHERE s.active_offer_title IS NOT NULL
      ORDER BY s.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    logger.error('Get offers error', err);
    res.status(500).json({ message: 'Error fetching active offers' });
  }
});

export default router;

