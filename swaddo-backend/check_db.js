const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const res = await pool.query("SELECT * FROM delivery_assignments WHERE status IN ('accepted', 'picked_up')");
        console.log("Assignments:", res.rows);
        
        const res2 = await pool.query("SELECT user_id, current_status, last_ping FROM delivery_partners WHERE current_status = 'online'");
        console.log("Online Partners:", res2.rows);
        
        const dbRes = await pool.query(`
        SELECT dp.user_id, dp.last_lat, dp.last_lng 
        FROM delivery_partners dp
        LEFT JOIN delivery_assignments da 
          ON da.delivery_partner_id = dp.id 
          AND da.status IN ('accepted', 'picked_up')
        WHERE dp.current_status = 'online' 
          AND dp.last_ping >= NOW() - INTERVAL '30 seconds'
          AND da.id IS NULL
        `);
        console.log("Available for assignment:", dbRes.rows);
    } catch (e) {
        console.log(e);
    } finally {
        pool.end();
    }
}
check();
