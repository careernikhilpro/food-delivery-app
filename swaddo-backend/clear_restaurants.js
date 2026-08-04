require('dotenv').config();
const { Client } = require('pg');

async function clearRestaurants() {
  console.log('Connecting to database:', process.env.DATABASE_URL);
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('Connected successfully. Deleting other restaurants...');
    
    // First, find the ID of the restaurant we want to keep
    const res = await client.query("SELECT id, name FROM stalls WHERE name ILIKE '%suddh shakahari momo%'");
    
    if (res.rows.length === 0) {
      console.log('Warning: Could not find any restaurant matching "suddh shakahari momo". No restaurants were deleted to prevent accidental data loss.');
      return;
    }
    
    const keepId = res.rows[0].id;
    console.log('Keeping restaurant:', res.rows[0].name, '(ID:', keepId, ')');
    
    // Delete menu items for other stalls
    const deletedMenuItems = await client.query('DELETE FROM menu_items WHERE stall_id !=  RETURNING id', [keepId]);
    console.log('Deleted', deletedMenuItems.rowCount, 'menu items from other restaurants.');
    
    // Delete other stalls
    const deletedStalls = await client.query('DELETE FROM stalls WHERE id !=  RETURNING id, name', [keepId]);
    console.log('Deleted', deletedStalls.rowCount, 'other restaurants.');
    
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.end();
  }
}

clearRestaurants();
