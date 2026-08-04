const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } });
async function clean() {
  try {
    await client.connect();
    console.log('Connected to Supabase');
    const res = await client.query("SELECT id, name FROM stalls WHERE name ILIKE '%suddh shakahari momo%'");
    if (res.rows.length === 0) {
      console.log('No stall found');
      return;
    }
    const keepId = res.rows[0].id;
    console.log('Keeping:', res.rows[0].name, 'ID:', keepId);
    const d1 = await client.query('DELETE FROM menu_items WHERE stall_id != ', [keepId]);
    console.log('Deleted menu items:', d1.rowCount);
    const d2 = await client.query('DELETE FROM stalls WHERE id != ', [keepId]);
    console.log('Deleted stalls:', d2.rowCount);
  } catch(e) {
    console.error(e);
  } finally {
    await client.end();
  }
}
clean();
