const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/swaddo' }); 
pool.query('SELECT o.id, o.stall_id, s.name as stall_name, s.location as stall_location FROM orders o LEFT JOIN stalls s ON o.stall_id = s.id ORDER BY o.created_at DESC LIMIT 5')
  .then(res => { console.log(JSON.stringify(res.rows, null, 2)); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
