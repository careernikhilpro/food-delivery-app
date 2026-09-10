import { pool } from '../db/index';

async function migrate() {
  try {
    await pool.query(`ALTER TABLE stalls ADD COLUMN IF NOT EXISTS is_free_delivery BOOLEAN DEFAULT false`);
    await pool.query(`ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_free_delivery BOOLEAN DEFAULT false`);
    console.log('Migration successful: Added is_free_delivery to stalls and menu_items');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}
migrate();
