const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Nikhil%402004$@db.tnmkuwhqebnghmnukxar.supabase.co:5432/postgres' });
pool.query("UPDATE menu_items SET has_variants = true, variants = $1 WHERE id = 13", [JSON.stringify([{name: 'Half', price: '30'}, {name: 'Full', price: '60'}])]).then(() => { console.log('Updated'); process.exit(0); });
