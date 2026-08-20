const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const userId = 33;
  
  const tables = ['vendors', 'delivery_partners', 'addresses', 'orders', 'notifications'];
  for (const t of tables) {
    try {
      if (t === 'orders') {
        await client.query(`DELETE FROM orders WHERE user_id = $1`, [userId]);
      } else {
        await client.query(`DELETE FROM ${t} WHERE user_id = $1`, [userId]);
      }
      console.log('Deleted from ' + t);
    } catch(e) {
      console.log('Skipped ' + t + ': ' + e.message);
    }
  }

  // Find vendor id if any
  try {
     const v = await client.query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
     if (v.rows.length > 0) {
        await client.query('DELETE FROM stalls WHERE vendor_id = $1', [v.rows[0].id]);
     }
  } catch(e){}

  try {
     await client.query('DELETE FROM users WHERE id = $1', [userId]);
     console.log('Successfully deleted user 33');
  } catch(e) {
     console.log('Failed to delete user: ' + e.message);
  }
  
  await client.end();
}
run();
