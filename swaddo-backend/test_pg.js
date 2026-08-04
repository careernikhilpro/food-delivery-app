const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } });
async function check() {
  try {
    await client.connect();
    const res = await client.query('UPDATE menu_items SET name =  WHERE id = 9999', ['test']);
    console.log('success name', res.rowCount);
    const res2 = await client.query('UPDATE menu_items SET variants =  WHERE id = 9999', ['[{"name":"test"}]']);
    console.log('success variants', res2.rowCount);
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await client.end();
  }
}
check();
