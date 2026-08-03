const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres' });
async function run() {
  const stallId = 14;
  const itemId = 18; // Tikka
  const has_variants = true;
  const variants = [{ name: 'Half', price: '50' }, { name: 'Full', price: '100' }];

  const res = await pool.query(
    'UPDATE menu_items SET has_variants = COALESCE($1, has_variants), variants = COALESCE($2, variants) WHERE id = $3 AND stall_id = $4 RETURNING *',
    [has_variants, variants ? JSON.stringify(variants) : null, itemId, stallId]
  );
  console.log(res.rows[0]);
  process.exit(0);
}
run();
