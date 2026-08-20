const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  
  await client.query('TRUNCATE TABLE delivery_partners CASCADE');
  
  // Wipe out the delivery pin and the legacy global pin for everyone so they don't auto-migrate back
  await client.query('UPDATE users SET delivery_pin_hash = NULL');
  
  // Delete users who were ONLY riders (no customer or vendor pins)
  await client.query('DELETE FROM users WHERE customer_pin_hash IS NULL AND vendor_pin_hash IS NULL');
  
  const res = await client.query('SELECT COUNT(*) FROM delivery_partners');
  console.log('Riders count remaining:', res.rows[0].count);
  
  await client.end();
}
run();
