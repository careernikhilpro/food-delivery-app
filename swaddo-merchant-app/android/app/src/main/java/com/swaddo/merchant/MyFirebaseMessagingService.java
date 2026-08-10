package com.swaddo.merchant;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import android.app.ActivityManager;
import java.util.List;

public class MyFirebaseMessagingService extends MessagingService {

    private static final String TAG = "SwaddoFCM";

    private boolean isAppInForeground() {
        boolean visible = MainActivity.isAppInForeground;
        android.util.Log.d(TAG, "isAppInForeground evaluated: " + visible);
        return visible;
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage); // Forward to Capacitor
        android.util.Log.d(TAG, "FCM Message Received!");

        if (remoteMessage.getData().size() > 0) {
            String type = remoteMessage.getData().get("type");
            if (!"new_order".equals(type)) {
                android.util.Log.d(TAG, "Ignoring notification with type: " + type);
                return;
            }
            
            android.util.Log.d(TAG, "FCM contains data payload.");
            
            if (isAppInForeground()) {
                android.util.Log.d(TAG, "App is in foreground. Skipping RingingActivity, letting web app handle it.");
                return;
            }

            android.util.Log.d(TAG, "Triggering native notification and RingingActivity.");
            String title = remoteMessage.getData().get("title");
            String body = remoteMessage.getData().get("body");
            String orderId = remoteMessage.getData().get("orderId");
            
            if (title == null && body == null) {
                android.util.Log.d(TAG, "Empty FCM data payload. Ignoring.");
                return;
            }
            
            // User requested to always show this text in the notification banner
            String notifTitle = "New Alert!";
            String notifBody = "Tap to open and accept.";

            int notificationId = orderId != null ? orderId.hashCode() : (int) System.currentTimeMillis();

            try {
                Intent fullScreenIntent = new Intent(this, RingingActivity.class);
                fullScreenIntent.putExtra("title", title);
                fullScreenIntent.putExtra("body", body);
                if (orderId != null) {
                    fullScreenIntent.putExtra("orderId", orderId);
                }
                
                // Add rich order details if available
                java.util.Map<String, String> data = remoteMessage.getData();
                if (data.containsKey("items")) fullScreenIntent.putExtra("items", data.get("items"));
                if (data.containsKey("customerName")) fullScreenIntent.putExtra("customerName", data.get("customerName"));
                if (data.containsKey("customerAddress")) fullScreenIntent.putExtra("customerAddress", data.get("customerAddress"));
                if (data.containsKey("totalAmount")) fullScreenIntent.putExtra("totalAmount", data.get("totalAmount"));

                fullScreenIntent.putExtra("notificationId", notificationId);
                fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    boolean canDraw = android.provider.Settings.canDrawOverlays(this);
                    android.util.Log.d(TAG, "canDrawOverlays: " + canDraw);
                    if (canDraw) {
                        android.util.Log.d(TAG, "Attempting explicit startActivity for RingingActivity...");
                        startActivity(fullScreenIntent);
                    }
                }
                
                PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, notificationId,
                        fullScreenIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                        
                // IMPORTANT: contentIntent now also opens RingingActivity when tapped from tray!
                PendingIntent contentIntent = PendingIntent.getActivity(this, notificationId + 1,
                        fullScreenIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

                String channelId = "swaddo_alerts_v4";
                NotificationCompat.Builder builder = new NotificationCompat.Builder(this, channelId)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle(notifTitle)
                        .setContentText(notifBody)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setCategory(NotificationCompat.CATEGORY_CALL)
                        .setFullScreenIntent(fullScreenPendingIntent, true)
                        .setContentIntent(contentIntent)
                        .setAutoCancel(true)
                        .setOngoing(true);

                NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    android.util.Log.d(TAG, "Configuring NotificationChannel...");
                    NotificationChannel channel = new NotificationChannel(channelId,
                            "Ringing Alerts",
                            NotificationManager.IMPORTANCE_HIGH);
                    
                    android.net.Uri soundUri = android.net.Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.orderring);
                    android.media.AudioAttributes audioAttributes = new android.media.AudioAttributes.Builder()
                            .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setUsage(android.media.AudioAttributes.USAGE_ALARM)
                            .build();
                    
                    channel.setSound(soundUri, audioAttributes);
                    notificationManager.createNotificationChannel(channel);
                }

                android.util.Log.d(TAG, "Posting notification to system with ID: " + notificationId);
                android.app.Notification notification = builder.build();
                notification.flags |= android.app.Notification.FLAG_INSISTENT;
                notificationManager.notify(notificationId, notification);
                
                android.util.Log.d(TAG, "Notification posted successfully!");

            } catch (Exception e) {
                android.util.Log.e(TAG, "Exception during native notification flow: " + e.getMessage());
            }
        } else {
            android.util.Log.d(TAG, "FCM data payload empty, relying on fallback system notification.");
        }
    }
}
