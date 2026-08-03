const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://swaddo_user:swaddo_password@127.0.0.1:5432/swaddo_db' });

async function run() {
  try {
    await pool.query('SELECT 1');
    console.log("Connected to DB.");

    const vendorRes = await pool.query(`
      INSERT INTO vendors (name, email, password_hash, phone, status)
      VALUES ('Dummy Vendor', 'dummy@swaddo.in', 'hash', '9999999999', 'active')
      RETURNING id
    `);
    const vendorId = vendorRes.rows[0].id;

    const stallRes = await pool.query(`
      INSERT INTO stalls (vendor_id, name, location, is_open, rating, rating_count, tags, cover_image, min_price)
      VALUES ($1, 'Dummy Variant Restaurant', 'Pune', true, 4.5, 100, 'Burgers, Momos', '/categories/momo.png', 30)
      RETURNING id
    `, [vendorId]);
    const stallId = stallRes.rows[0].id;
    console.log("Stall added:", stallId);

    await pool.query(`
      INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available, category, has_variants, variants)
      VALUES ($1, 'Veg Steamed Momo', 'Delicious veg momos', 30, true, true, 'Momos', true, $2)
    `, [
      stallId,
      JSON.stringify([
        { name: 'Half (4 pcs)', price: '30' },
        { name: 'Full (8 pcs)', price: '60' }
      ])
    ]);
    
    await pool.query(`
      INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available, category, has_variants, variants)
      VALUES ($1, 'Paneer Tikka Sandwich', 'Spicy paneer sandwich', 239, true, true, 'Sandwich', true, $2)
    `, [
      stallId,
      JSON.stringify([
        { name: '15cm', price: '239' },
        { name: '30cm(SAVE UPTO 27%)', price: '449' }
      ])
    ]);
    console.log("Menu items added.");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
