import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:support@swaddo.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export const sendPushNotification = async (subscriptionStr: string, title: string, body: string, data: any = {}) => {
  if (!subscriptionStr) return false;
  
  try {
    const subscription = JSON.parse(subscriptionStr);
    
    const payload = JSON.stringify({
      title,
      body,
      data
    });
    
    await webpush.sendNotification(subscription, payload);
    console.log(`\n✅ [WEB PUSH SENT] To ${subscription.endpoint}`);
    return true;
  } catch (error) {
    console.error('Web Push Failed:', error);
    return false;
  }
};
