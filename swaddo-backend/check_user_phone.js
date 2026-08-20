const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const res = await client.query('SELECT id, name, role FROM users WHERE phone = $1', ['7319979739']);
  console.log('User:', res.rows);
  await client.end();
}
run();
