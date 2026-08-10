const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(`
  INSERT INTO delivery_assignments (order_id, delivery_partner_id, status, pickup_distance_km, delivery_distance_km, earnings_amount)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (order_id) DO UPDATE SET 
            status = EXCLUDED.status
`, [1, 1, 'accepted', 0, 0, 0]).then(res => console.log(res)).catch(console.error).finally(() => pool.end());
