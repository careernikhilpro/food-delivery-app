const { Pool } = require('pg'); 
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); 
pool.query(`SELECT o.id, o.created_at, o.total_amount, s.name FROM orders o JOIN stalls s ON o.stall_id = s.id WHERE s.name LIKE '%GFC%' ORDER BY o.created_at DESC LIMIT 5`).then(r => { console.log(r.rows); process.exit(); });
