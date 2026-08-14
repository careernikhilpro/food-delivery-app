import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  const client = await pool.connect();
  try {
    const calcRes = await client.query("SELECT SUM(earnings_amount) as total FROM delivery_assignments WHERE delivery_partner_id = 13 AND status = 'completed' AND cashed_out = false");
    const pendingRes = await client.query("SELECT SUM(amount) as pending_total FROM cashout_requests WHERE delivery_partner_id = 13 AND status = 'pending'");

    const rawAvailable = parseFloat(calcRes.rows[0].total || '0');
    const pendingAmount = parseFloat(pendingRes.rows[0].pending_total || '0');
    const availableCashout = Math.max(0, rawAvailable - pendingAmount);
    
    console.log({
      rawAvailable,
      pendingAmount,
      availableCashout
    });
  } finally {
    client.release();
    pool.end();
  }
}
run();
