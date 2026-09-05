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

async function sendOffers() {
    try {
        // Change these details as needed
        const title = "Today's Special Offers!";
        const body = 'Get 50% off on your favorite restaurants. Order now!';
        
        // List of phone numbers you want to send the notification to
        const phoneNumbers = ['9082998752', '1234567890'];
        
        console.log(`Fetching users for phone numbers: ${phoneNumbers.join(', ')}...`);
        
        // Fetch users from the database
        const res = await pool.query(
            'SELECT id, phone, fcm_token FROM users WHERE phone = ANY($1)', 
            [phoneNumbers]
        );
        
        if (res.rows.length === 0) {
            console.log('No users found for the provided phone numbers.');
            process.exit(0);
        }

        const tokensToSend: string[] = [];
        
        for (const user of res.rows) {
            if (user.fcm_token) {
                tokensToSend.push(user.fcm_token);
                // Also save to database so they see it in their in-app Inbox
                await pool.query(`
                    INSERT INTO notifications (user_id, title, body, type, expires_at)
                    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
                `, [user.id, title, body, 'promo']);
                console.log(`✅ Saved in-app notification for ${user.phone}`);
            } else {
                console.log(`⚠️ User ${user.phone} has no FCM token (Not logged in to app).`);
            }
        }
        
        // Broadcast push notifications
        if (tokensToSend.length > 0) {
            console.log(`Sending push notifications to ${tokensToSend.length} devices...`);
            const success = await notificationService.broadcastToTokens(tokensToSend, title, body, { type: 'promo', click_action: '/' });
            if (success) {
                console.log('🎉 Successfully sent push notifications!');
            } else {
                console.error('❌ Failed to send push notifications.');
            }
        } else {
            console.log('No valid FCM tokens found to send push notifications.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

sendOffers();
