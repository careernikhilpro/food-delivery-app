const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres' });
async function run() {
  const stallId = 14;
  const name = "Test Item 123";
  const description = "Test desc";
  const price = 50;
  const is_veg = true;
  const is_available = true;
  const category = "Custom";
  const has_variants = true;
  const variants = [{ name: 'Half', price: '50' }, { name: 'Full', price: '100' }];

  const res = await pool.query(
    'INSERT INTO menu_items (stall_id, name, description, price, is_veg, is_available, category, has_variants, variants) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [stallId, name, description, price, is_veg, is_available ?? true, category, has_variants ?? false, JSON.stringify(variants || [])]
  );
  console.log(res.rows[0]);
  process.exit(0);
}
run();
