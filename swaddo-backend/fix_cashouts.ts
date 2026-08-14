import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query("UPDATE cashout_requests SET status = 'rejected', admin_notes = 'System reset to fix balance calculation' WHERE status = 'pending' RETURNING *");
    console.log("Rejected " + res.rowCount + " requests");
  } finally {
    client.release();
    pool.end();
  }
}
run();
