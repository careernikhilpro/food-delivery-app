require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT offers FROM stalls WHERE offers IS NOT NULL LIMIT 1").then(res => { 
  console.log(JSON.stringify(res.rows, null, 2)); 
  pool.end(); 
}).catch(e => console.error(e));
