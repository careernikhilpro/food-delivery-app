const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres' });
pool.query('UPDATE menu_items SET category = $1 WHERE id = 46', ['Biryani']).then(() => {
  console.log('Fixed category spelling in DB');
  process.exit(0);
});
