const { pool } = require('./src/db');
pool.query("SELECT DATE(CURRENT_TIMESTAMP)")
  .then(res => console.log('SUCCESS:', res.rows))
  .catch(err => console.error('ERROR:', err.message))
  .finally(() => process.exit(0));
