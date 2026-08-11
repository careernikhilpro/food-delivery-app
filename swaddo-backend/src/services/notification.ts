import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { logger } from '../utils/logger';
import { pool } from '../db';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  try {
    // If running on Render, the service account JSON might be passed as an env string
    // or we might need to load it from a file.
    if (process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_SERVICE_ACCOUNT !== '{}') {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
      logger.info("Firebase Admin initialized successfully from env");
    } else {
      logger.warn("FIREBASE_SERVICE_ACCOUNT env variable is missing. Push notifications will not be sent.");
    }
  } catch (error) {
    logger.error("Failed to initialize Firebase Admin:", error);
  }
}

// Ensure all data values for FCM are strings, otherwise FCM throws invalid-payload
const stringifyData = (data: any) => {
  if (!data) return undefined;
  const strData: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      strData[key] = String(value);
    }
  }
  return strData;
};

export const notificationService = {
  
  /**
   * Send a notification to a specific user (Customer)
   */
  async sendToUser(userId: number, title: string, body: string, data?: any) {
    try {
      const client = await pool.connect();
      
      // Save notification to DB
      await client.query(`
        INSERT INTO notifications (user_id, title, body, type, expires_at)
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
      `, [userId, title, body, data?.type || 'system']);

      const result = await client.query('SELECT fcm_token FROM users WHERE id = $1', [userId]);
      client.release();
      
      const token = result.rows[0]?.fcm_token;
      if (!token) {
        logger.info(`No FCM token found for user ${userId}`);
        return false;
      }
      
      return await this.sendPush(token, title, body, data);
    } catch (error) {
      logger.error(`Error sending push to user ${userId}:`, error);
      return false;
    }
  },

  /**
   * Send a notification to a specific vendor (Merchant)
   */
  async sendToVendor(vendorId: number, title: string, body: string, data?: any) {
    try {
      const client = await pool.connect();
      
      const vendorRes = await client.query('SELECT user_id FROM vendors WHERE id = $1', [vendorId]);
      const userId = vendorRes.rows[0]?.user_id;

      if (userId) {
        await client.query(`
          INSERT INTO notifications (user_id, title, body, type, expires_at)
          VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
        `, [userId, title, body, data?.type || 'system']);
      }

      const result = await client.query(`
        SELECT u.fcm_token 
        FROM users u 
        JOIN vendors v ON u.id = v.user_id 
        WHERE v.id = $1
      `, [vendorId]);
      client.release();
      
      const token = result.rows[0]?.fcm_token;
      if (!token) {
        logger.info(`No FCM token found for vendor ${vendorId}`);
        return false;
      }
      
      // Use a dedicated channel ID for merchants to avoid conflicts with riders
      return await this.sendNativePush(token, title, body, data, 'swaddo_merchant_v1');
    } catch (error) {
      logger.error(`Error sending push to vendor ${vendorId}:`, error);
      return false;
    }
  },

  /**
   * Send a notification to a specific delivery partner (Rider)
   */
  async sendToRider(userId: number, title: string, body: string, data?: any) {
    try {
      const client = await pool.connect();

      if (userId) {
        await client.query(`
          INSERT INTO notifications (user_id, title, body, type, expires_at)
          VALUES ($1, $2, $3, $4, NOW() + INTERVAL '24 hours')
        `, [userId, title, body, data?.type || 'system']);
      }

      const result = await client.query(`
        SELECT fcm_token 
        FROM users 
        WHERE id = $1
      `, [userId]);
      client.release();
      
      const token = result.rows[0]?.fcm_token;
      if (!token) {
        logger.info(`DIAGNOSTIC: No FCM token found for rider userId=${userId}`);
        return false;
      }
      
      logger.info(`DIAGNOSTIC: Rider FCM token found`);
      logger.info(`DIAGNOSTIC: Sending DATA-ONLY FCM message`);
      
      const payload = {
        token: token,
        data: stringifyData({
          ...data,
          title: title,
          body: body,
          channelId: 'swaddo_alerts_v5'
        }),
        android: {
          priority: 'high' as const // CRITICAL: Wakes up the app from Doze/Killed mode
        }
      };

      const response = await getMessaging().send(payload);
      logger.info(`DIAGNOSTIC: FCM message sent successfully`);
      return true;
    } catch (error) {
      logger.error('DIAGNOSTIC: Backend Error sending push notification to rider:', error);
      return false;
    }
  },

  /**
   * Broadcast a notification to multiple FCM tokens at once.
   */
  async broadcastToTokens(tokens: string[], title: string, body: string, data?: any) {
    if (!getApps().length) return false;
    if (!tokens || tokens.length === 0) return false;
    
    try {
      const message = {
        notification: {
          title,
          body
        },
        data: stringifyData(data) || {},
        tokens
      };

      const response = await getMessaging().sendEachForMulticast(message);
      logger.info(`Broadcast success count: ${response.successCount}, failure count: ${response.failureCount}`);
      return true;
    } catch (error) {
      logger.error('Error broadcasting to tokens:', error);
      return false;
    }
  },

  /**
   * Internal method to actually send the message via Firebase Admin
   */
  async sendPush(token: string, title: string, body: string, data?: any) {
    if (!getApps().length) return false;
    
    try {
      const message = {
        notification: {
          title,
          body
        },
        data: stringifyData(data) || {},
        token
      };

      const response = await getMessaging().send(message);
      logger.info(`Successfully sent message: ${response}`);
      return true;
    } catch (error: any) {
      if (error?.code === 'messaging/registration-token-not-registered' || error?.message?.includes('NotRegistered')) {
         try {
           const { pool } = require('../db');
           await pool.query(`
             UPDATE delivery_partners dp 
             SET current_status = 'offline' 
             FROM users u 
             WHERE dp.user_id = u.id AND u.fcm_token = $1
           `, [token]);
           await pool.query('UPDATE users SET fcm_token = NULL WHERE fcm_token = $1', [token]);
           logger.info(`Cleared stale FCM token for user: ${token}`);
         } catch (dbErr) {}
      } else {
         logger.error('Error sending message:', error);
      }
      return false;
    }
  },

  /**
   * Internal method to send a DATA-ONLY message via Firebase Admin.
   * This is REQUIRED for Android to allow background processes to wake up and ring.
   * If we include a "notification" block, Android OS swallows it and keeps it silent!
   */
  async sendNativePush(token: string, title: string, body: string, data?: any, channelId: string = 'swaddo_alerts_v5') {
    if (!getApps().length) return false;
    
    try {
      const message = {
        // NO 'notification' block here! This forces Android to deliver it to MyFirebaseMessagingService
        data: stringifyData({
          title,
          body,
          ...data,
          android_channel_id: channelId
        }),
        android: {
          priority: 'high' as const // CRITICAL: Wakes up the app from Doze mode
        },
        token
      };

      const response = await getMessaging().send(message);
      logger.info(`Successfully sent NATIVE background push: ${response}`);
      return true;
    } catch (error: any) {
      if (error?.code === 'messaging/registration-token-not-registered' || error?.message?.includes('NotRegistered')) {
         try {
           const { pool } = require('../db');
           await pool.query(`
             UPDATE delivery_partners dp 
             SET current_status = 'offline' 
             FROM users u 
             WHERE dp.user_id = u.id AND u.fcm_token = $1
           `, [token]);
           await pool.query('UPDATE users SET fcm_token = NULL WHERE fcm_token = $1', [token]);
           logger.info(`Cleared stale NATIVE FCM token: ${token}`);
         } catch (dbErr) {}
      } else {
         logger.error('Error sending NATIVE push:', error);
      }
      return false;
    }
  }
};
