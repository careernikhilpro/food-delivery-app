const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  const phone = '6206882823';
  const res = await client.query(`SELECT id, phone, name, role FROM users WHERE phone LIKE $1`, [`%${phone}`]);
  console.log('User found:', res.rows);
  
  if (res.rows.length > 0) {
    const userId = res.rows[0].id;
    console.log(`Deleting user ID: ${userId}`);
    
    // Attempting to delete the user. 
    // If there are foreign keys, we might need to delete from dependent tables first.
    try {
      await client.query('BEGIN');
      
      // Dependent tables (typical ones based on previous scripts)
      // Vendors/Stalls
      const vendorRes = await client.query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
      for (const row of vendorRes.rows) {
         await client.query('DELETE FROM stalls WHERE vendor_id = $1', [row.id]);
         await client.query('DELETE FROM vendor_documents WHERE vendor_id = $1', [row.id]).catch(()=>console.log('no vendor_documents'));
      }
      await client.query('DELETE FROM vendors WHERE user_id = $1', [userId]);
      
      // Delivery Partners
      await client.query('DELETE FROM delivery_partners WHERE user_id = $1', [userId]);
      
      // Other Customer related tables
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]).catch(()=>console.log('no cart'));
      await client.query('DELETE FROM addresses WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM orders WHERE customer_id = $1', [userId]).catch(()=>console.log('orders failed'));
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]).catch(()=>console.log('notifications failed'));
      
      // Finally delete user
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      await client.query('COMMIT');
      console.log('Successfully deleted user and related data.');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Error during deletion:', e);
    }
  } else {
    console.log('No user found with that phone number to delete.');
  }
  
  await client.end();
}
run();
