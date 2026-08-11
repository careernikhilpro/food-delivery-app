package com.swaddo.delivery;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.location.Location;
import android.os.Build;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class LocationForegroundService extends Service {
    private static final String TAG = "LocationForeground";
    private static final String CHANNEL_ID = "swaddo_location_channel";
    private static final int NOTIFICATION_ID = 1001;

    private FusedLocationProviderClient fusedLocationClient;
    private LocationCallback locationCallback;
    
    private String riderId;
    private String apiUrl;
    private String authToken;

    @Override
    public void onCreate() {
        super.onCreate();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if ("STOP_SERVICE".equals(intent.getAction())) {
                stopLocationUpdates();
                stopForeground(true);
                stopSelf();
                return START_NOT_STICKY;
            }
            riderId = intent.getStringExtra("riderId");
            apiUrl = intent.getStringExtra("apiUrl");
            authToken = intent.getStringExtra("authToken");
        }

        Notification notification = createNotification();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        startLocationUpdates();
        return START_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Location Tracking",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Used to track rider location for assignments");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Swaddo Delivery is Online")
                .setContentText("We are tracking your location for assignments.")
                .setSmallIcon(R.mipmap.ic_launcher) // Fallback to launcher icon
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    private void startLocationUpdates() {
        LocationRequest locationRequest = LocationRequest.create();
        locationRequest.setInterval(10000); // 10 seconds
        locationRequest.setFastestInterval(5000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setSmallestDisplacement(10); // 10 meters

        locationCallback = new LocationCallback() {
            @Override
            public void onLocationResult(LocationResult locationResult) {
                if (locationResult == null) {
                    return;
                }
                for (Location location : locationResult.getLocations()) {
                    sendLocationToServer(location);
                    // Broadcast locally so Javascript map can update if app is open
                    Intent localIntent = new Intent("com.swaddo.delivery.LOCATION_UPDATE");
                    localIntent.putExtra("lat", location.getLatitude());
                    localIntent.putExtra("lng", location.getLongitude());
                    sendBroadcast(localIntent);
                }
            }
        };

        try {
            fusedLocationClient.requestLocationUpdates(
                    locationRequest,
                    locationCallback,
                    Looper.getMainLooper()
            );
        } catch (SecurityException e) {
            Log.e(TAG, "Location permission missing", e);
        }
    }

    private void stopLocationUpdates() {
        if (fusedLocationClient != null && locationCallback != null) {
            fusedLocationClient.removeLocationUpdates(locationCallback);
        }
    }

    private void sendLocationToServer(Location location) {
        if (riderId == null || apiUrl == null) return;
        
        new Thread(() -> {
            try {
                URL url = new URL(apiUrl + "/api/delivery/ping");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                if (authToken != null && !authToken.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + authToken);
                }
                
                JSONObject payload = new JSONObject();
                payload.put("riderId", riderId);
                payload.put("lat", location.getLatitude());
                payload.put("lng", location.getLongitude());

                conn.setDoOutput(true);
                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = payload.toString().getBytes("utf-8");
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "Ping response code: " + code);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Error pinging server", e);
            }
        }).start();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopLocationUpdates();
    }
}
