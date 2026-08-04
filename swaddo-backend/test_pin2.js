
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } });

async function check() {
  try {
    await client.connect();
    
    // Find stall
    const stallRes = await client.query("SELECT vendor_id FROM stalls WHERE name ILIKE '%Suddh%'");
    if(stallRes.rows.length === 0) {
      console.log('Stall not found');
      return;
    }
    const vendorId = stallRes.rows[0].vendor_id;
    
    // Find user
    const vendorRes = await client.query("SELECT user_id FROM vendors WHERE id = " + vendorId);
    const userId = vendorRes.rows[0].user_id;
    
    // Hash new pin
    const pinHash = await bcrypt.hash('9197', 10);
    
    // Update vendor_pin_hash
    await client.query("UPDATE users SET vendor_pin_hash = $1 WHERE id = $2", [pinHash, userId]);
    
    console.log('Pin updated successfully for user', userId);
  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    await client.end();
  }
}
check();

