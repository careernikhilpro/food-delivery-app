import { pool } from '../db';
import { notificationService } from '../services/notification';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import * as dotenv from 'dotenv';
dotenv.config();

// Ensure Firebase is initialized
if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT !== '{}') {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(serviceAccount) });
        console.log('Firebase initialized.');
    } else {
        console.error('FIREBASE_SERVICE_ACCOUNT missing in .env');
        process.exit(1);
    }
}

async function run() {
    try {
        const phone = '9082998752';
        const res = await pool.query('SELECT id, fcm_token FROM users WHERE phone = $1', [phone]);
        if (res.rows.length === 0) {
            console.error('User not found with phone:', phone);
            process.exit(1);
        }
        
        const user = res.rows[0];
        console.log('Found user:', user.id, 'Token:', user.fcm_token ? 'Exists' : 'NULL');
        
        if (!user.fcm_token) {
             console.error('User does not have an FCM token. Please login to the app first to generate one.');
             process.exit(1);
        }
        
        const title = 'Testing Background Push';
        const body = 'This should wake up the customer app even if killed!';
        
        // Use sendPush so Web PWA works. But wait, sendToUser uses sendPush internally!
        console.log('Sending notification...');
        const success = await notificationService.sendToUser(user.id, title, body, { type: 'marketing', click_action: '/' });
        
        if (success) {
            console.log('Notification sent successfully to phone:', phone);
        } else {
            console.error('Failed to send notification.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();
