const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres' });
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'menu_items'")
  .then(res => { console.log(res.rows); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
