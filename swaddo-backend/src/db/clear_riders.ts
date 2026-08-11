import { pool } from './index';

async function clearRiders() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Deleting all delivery assignments...');
    await client.query('DELETE FROM delivery_assignments');
    
    console.log('Deleting rider stats and deposits...');
    await client.query('DELETE FROM rider_daily_stats');
    await client.query('DELETE FROM deposit_history');
    
    console.log('Deleting all delivery partners and users...');
    const result = await client.query(`DELETE FROM users WHERE role = 'delivery' RETURNING id`);
    
    console.log(`Deleted ${result.rowCount} rider accounts.`);
    
    await client.query('COMMIT');
    console.log('Successfully cleared all riders.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing riders:', err);
  } finally {
    client.release();
    pool.end();
  }
}

clearRiders();
