require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT name, offers FROM stalls WHERE name ILIKE '%Crispy Chicken%'").then(res => { 
  console.log(JSON.stringify(res.rows, null, 2)); 
  pool.end(); 
}).catch(e => console.error(e));
