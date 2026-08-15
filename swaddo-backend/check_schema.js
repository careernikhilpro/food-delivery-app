const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stalls' AND column_name LIKE 'active_offer_%';
    `);
    console.log(res.rows);
  } finally {
    client.release();
    pool.end();
  }
}
run();
