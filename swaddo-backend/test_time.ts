import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://swaddo_owner:lM16QzSTFkbc@ep-young-waterfall-a1qg0y7h.ap-southeast-1.aws.neon.tech/swaddo?sslmode=require'
});

async function run() {
  try {
    const res = await pool.query('SELECT assigned_at FROM delivery_assignments ORDER BY id DESC LIMIT 5');
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
