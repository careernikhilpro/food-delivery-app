const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://swaddo_user:swaddo_password@127.0.0.1:5432/swaddo_db' });
async function run() {
  await pool.query("DELETE FROM stalls WHERE name = '' OR name IS NULL");
  console.log('Deleted blank stores!');
  pool.end();
}
run();
