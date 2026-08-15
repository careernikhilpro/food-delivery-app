import { Pool } from 'pg';
const pool = new Pool({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE stalls ADD COLUMN is_active boolean DEFAULT true");
    console.log("Column is_active added");
  } catch (err: any) {
    console.error("Error adding column:", err.message);
  } finally {
    client.release();
    pool.end();
  }
}
run();
