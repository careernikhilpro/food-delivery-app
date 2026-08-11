const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const query = `
  SELECT da.order_id as "orderId", da.status as "assignmentStatus", da.pickup_distance_km as "pickupDistance", 
         da.earnings_amount as "earnings", da.pickup_payout as "pickupPayout",
         o.status as "orderStatus", o.delivery_lat as "deliveryLat", o.delivery_lng as "deliveryLng",
         o.delivery_address as "deliveryAddress", o.total_amount as "totalAmount", o.payment_method as "paymentMethod",
         s.name as "stallName", s.latitude as "stallLat", s.longitude as "stallLng", s.location as "stallAddress", v_u.phone as "stallPhone",
         c.name as "customerName", c.phone as "customerPhone", c.instructions as "deliveryInstructions"
  FROM delivery_assignments da
  JOIN orders o ON da.order_id = o.id
  JOIN stalls s ON o.stall_id = s.id
  LEFT JOIN vendors v ON s.vendor_id = v.id
  LEFT JOIN users v_u ON v.user_id = v_u.id
  LEFT JOIN users c ON o.customer_id = c.id
  WHERE da.delivery_partner_id = $1 AND da.status IN ('assigned', 'accepted', 'picked_up')
  ORDER BY da.assigned_at ASC
`;

pool.query(query, [13])
  .then(res => { console.log('SUCCESS:', res.rows); process.exit(0); })
  .catch(e => { console.error('ERROR:', e.message); process.exit(1); });
