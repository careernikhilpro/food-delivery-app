const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  try {
    console.log('Cleaning duplicates...');
    await pool.query(`
      DELETE FROM delivery_assignments a USING (
        SELECT MAX(id) as id, order_id 
        FROM delivery_assignments 
        GROUP BY order_id HAVING COUNT(*) > 1
      ) b
      WHERE a.order_id = b.order_id 
      AND a.id <> b.id;
    `);
    console.log('Duplicates cleaned. Adding constraint...');
    await pool.query("ALTER TABLE delivery_assignments ADD CONSTRAINT delivery_assignments_order_id_key UNIQUE (order_id);");
    console.log('Added UNIQUE constraint successfully!');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
fix();
