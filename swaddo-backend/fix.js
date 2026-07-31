const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://swaddo_user:swaddo_password@127.0.0.1:5432/swaddo_db' });
async function fix() {
  try {
    await pool.query("UPDATE stalls SET name = 'Nikhil''s Cafe', location = 'Boring Road, Patna', tags = 'Cafe, Fast Food', is_pure_veg = true, rating = 4.8, rating_count = 120 WHERE name = ''");
    
    const items = await pool.query("SELECT count(*) FROM menu_items WHERE stall_id = 2");
    if (parseInt(items.rows[0].count) === 0) {
      for (let i = 1; i <= 10; i++) {
        await pool.query(
          "INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available, category, image_url) VALUES (, , , , , , , )",
          [2, 'Cafe Item ' + i, 'Delicious cafe item ' + i, 150 + i*10, true, true, 'Snacks', 'https://source.unsplash.com/400x300/?cafe,food']
        );
      }
    }
    console.log('Fixed blank store!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
fix();
