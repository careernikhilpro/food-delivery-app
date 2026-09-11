const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres' });
const query = `
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS free_delivery_min_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS free_delivery_max_km NUMERIC;
`;
pool.query(query)
  .then(res => { console.log('Successfully altered table'); process.exit(0); })
  .catch(e => { console.error(e); process.exit(1); });
