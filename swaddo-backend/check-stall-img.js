require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT image, cover_image FROM stalls WHERE id = 40").then(res => { 
  console.log(JSON.stringify(res.rows, null, 2)); 
  pool.end(); 
}).catch(e => console.error(e));
