import { pool } from '../db';
async function getT() {
    const res = await pool.query("SELECT fcm_token FROM users WHERE phone='9082998752'");
    console.log('TOKEN:', res.rows[0]?.fcm_token);
    process.exit(0);
}
getT();
