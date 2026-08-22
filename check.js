const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT COUNT(*) FROM delivery_partners');
  console.log('Riders count:', res.rows[0].count);
  await client.end();
}
run();
