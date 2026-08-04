
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } });
async function check() {
  try {
    await client.connect();
    const res = await client.query('UPDATE menu_items SET variants = $1 WHERE id = 9999 RETURNING *', [JSON.stringify([{name: "test", price: 100}])]);
    console.log('success', res.rowCount);
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await client.end();
  }
}
check();

