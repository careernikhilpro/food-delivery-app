const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://swaddo_user:swaddo_password@127.0.0.1:5432/swaddo_db' });
async function run() {
  const stalls = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'stalls'");
  const vendors = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vendors'");
  const menuItems = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'menu_items'");
  const users = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
  console.log('Stalls:', stalls.rows);
  console.log('Vendors:', vendors.rows);
  console.log('MenuItems:', menuItems.rows);
  console.log('Users:', users.rows);
  pool.end();
}
run();
