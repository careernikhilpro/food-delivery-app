require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function insertItem() {
  try {
    const res = await pool.query(`
      INSERT INTO menu_items (stall_id, name, price, description, is_veg, is_available, category)
      VALUES (40, 'Chicken Biryani (Special Offer)', 99, 'Delicious Chicken Biryani Sunday Special', false, true, 'Biryani')
      RETURNING id;
    `);
    console.log('Inserted ID:', res.rows[0].id);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

insertItem();
