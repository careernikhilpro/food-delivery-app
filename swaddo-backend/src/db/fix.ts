import { pool } from './index';

const fix = async () => {
  try {
    await pool.query('ALTER TABLE stalls ADD COLUMN is_pure_veg BOOLEAN DEFAULT false');
    console.log('Added is_pure_veg');
  } catch (e: any) {console.log(e.message)}
  try {
    await pool.query('ALTER TABLE stalls ADD COLUMN offer_text VARCHAR(255)');
    console.log('Added offer_text');
  } catch(e: any) {console.log(e.message)}
  process.exit(0);
};
fix();
