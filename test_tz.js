import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://swaddo_owner:lM16QzSTFkbc@ep-young-waterfall-a1qg0y7h.ap-southeast-1.aws.neon.tech/swaddo?sslmode=require'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT current_setting(''TIMEZONE'') as tz, CURRENT_TIMESTAMP as ct');
    console.log(res.rows);
  } finally {
    client.release();
    pool.end();
  }
}
run();
