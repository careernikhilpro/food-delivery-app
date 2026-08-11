const { pool } = require('./src/db');
pool.query("SELECT id, status, assigned_at FROM delivery_assignments WHERE status IN ('accepted', 'picked_up')")
  .then(r => { console.log(r.rows); process.exit(0); })
  .catch(console.error);
