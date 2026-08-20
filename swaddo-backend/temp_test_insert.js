const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres' }); 
async function run() { 
  try { 
    await pool.query("INSERT INTO checkout_visits (customer_phone, customer_name, cart_items, cart_total, address, stall_id) VALUES ('1234567890', 'Test', '[]', 0, 'Test addr', 'stall1') ON CONFLICT (customer_phone) DO UPDATE SET updated_at = CURRENT_TIMESTAMP;"); 
    console.log('Insert success'); 
  } catch(e) { 
    console.error(e.message); 
  } 
  await pool.end(); 
} 
run();
