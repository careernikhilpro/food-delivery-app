const { pool } = require('./src/db');
pool.query("SELECT DATE(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') as date")
  .then(res => console.log('SUCCESS:', res.rows))
  .catch(err => console.error('ERROR:', err))
  .finally(() => process.exit(0));
