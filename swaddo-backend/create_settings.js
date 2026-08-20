const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.tnmkuwhqebnghmnukxar:Nikhil%402004$@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'
});
async function run() {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key VARCHAR(255) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query(`
    INSERT INTO app_settings (key, value) 
    VALUES ($1, $2) 
    ON CONFLICT (key) DO NOTHING
  `, ['cod_enabled', false]);
  console.log('Table app_settings created and seeded');
  await client.end();
}
run();
