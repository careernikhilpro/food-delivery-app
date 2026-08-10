package com.swaddo.delivery;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowManager;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class RingingActivity extends Activity {

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private boolean actionInProgress = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Wake up screen and bypass lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }

        setContentView(R.layout.activity_ringing);

        String title = getIntent().getStringExtra("title");
        String body = getIntent().getStringExtra("body");
        String orderId = getIntent().getStringExtra("orderId");
        
        // Dynamic fields from FCM
        String customerName = getIntent().getStringExtra("customerName");
        String customerAddress = getIntent().getStringExtra("customerAddress");
        String itemCount = getIntent().getStringExtra("itemCount");
        String itemsSummary = getIntent().getStringExtra("itemsSummary");
        
        String stallName = getIntent().getStringExtra("stallName");
        String pickupDistance = getIntent().getStringExtra("pickupDistance");
        String dropoffDistance = getIntent().getStringExtra("dropoffDistance");
        String deliveryPay = getIntent().getStringExtra("deliveryPay");
        String totalPayout = getIntent().getStringExtra("totalPayout");
        String pickupPayout = getIntent().getStringExtra("pickupPayout");
        String returnPayout = getIntent().getStringExtra("returnPayout");
        
        final int notificationId = getIntent().getIntExtra("notificationId", -1);

        TextView tvTitle = findViewById(R.id.tvTitle);
        TextView tvPickupStall = findViewById(R.id.tvPickupStall);
        TextView tvItems = findViewById(R.id.tvItems);
        TextView tvCustomerName = findViewById(R.id.tvCustomerName);
        TextView tvCustomerAddress = findViewById(R.id.tvCustomerAddress);
        TextView tvPickupDistance = findViewById(R.id.tvPickupDistance);
        TextView tvDropoffDistance = findViewById(R.id.tvDropoffDistance);
        TextView tvDeliveryPay = findViewById(R.id.tvDeliveryPay);
        TextView tvTotalPayout = findViewById(R.id.tvTotalPayout);
        
        TextView tvPickupPay = findViewById(R.id.tvPickupPay);
        TextView tvReturnPay = findViewById(R.id.tvReturnPay);
        View rlPickupPay = findViewById(R.id.rlPickupPay);
        View rlReturnPay = findViewById(R.id.rlReturnPay);
        
        SeekBar sbAccept = findViewById(R.id.sbAccept);
        View btnReject = findViewById(R.id.btnReject);

        if (title != null) tvTitle.setText(title);
        if (stallName != null) tvPickupStall.setText(stallName);
        if (pickupDistance != null) tvPickupDistance.setText(pickupDistance + " km");
        if (dropoffDistance != null) tvDropoffDistance.setText(dropoffDistance + " km");
        if (deliveryPay != null) tvDeliveryPay.setText("₹" + deliveryPay);
        if (totalPayout != null) tvTotalPayout.setText("₹" + totalPayout);
        
        if (pickupPayout != null && !pickupPayout.equals("0")) {
            rlPickupPay.setVisibility(View.VISIBLE);
            tvPickupPay.setText("₹" + pickupPayout);
        }
        if (returnPayout != null && !returnPayout.equals("0")) {
            rlReturnPay.setVisibility(View.VISIBLE);
            tvReturnPay.setText("₹" + returnPayout);
        }
        
        if (itemsSummary != null && !itemsSummary.isEmpty()) {
            String count = itemCount != null ? itemCount : "0";
            tvItems.setText(count + " Items: " + itemsSummary);
        } else {
            tvItems.setText("1x Item");
        }
        
        if (customerName != null) tvCustomerName.setText(customerName);
        if (customerAddress != null) tvCustomerAddress.setText(customerAddress);

        // Start custom ringing
        mediaPlayer = MediaPlayer.create(this, R.raw.orderring);
        if (mediaPlayer != null) {
            mediaPlayer.setLooping(true);
            mediaPlayer.start();
        }
        android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: ringtone started via MediaPlayer");

        // Start vibrating
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null && vibrator.hasVibrator()) {
            long[] pattern = {0, 1000, 1000}; // Wait 0, Vibrate 1s, Sleep 1s
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
            } else {
                vibrator.vibrate(pattern, 0);
            }
        }

        sbAccept.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (progress > 85 && !actionInProgress) { 
                    actionInProgress = true;
                    seekBar.setEnabled(false); 
                    tvTitle.setText("Accepting...");
                    android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Accept API started");
                    acceptOrderAPI(orderId, notificationId);
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                if (seekBar.getProgress() <= 85 && !actionInProgress) {
                    seekBar.setProgress(0); 
                }
            }
        });

        btnReject.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (actionInProgress) return;
                actionInProgress = true;
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Reject clicked");
                
                // Since there is no specific Reject API endpoint currently implemented in the backend,
                // we treat reject as a local UI action to dismiss the screen and wait for the backend 
                // to timeout the assignment naturally.
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Reject SUCCESS (Local) - closing RingingActivity");
                
                stopRinging();
                if (notificationId != -1) {
                    NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                    notificationManager.cancel(notificationId);
                    android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: notification cancelled");
                }
                finish(); 
            }
        });

        // Auto-close after 30 seconds to prevent infinite ringing
        new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!isFinishing() && !actionInProgress) {
                    stopRinging();
                    finish();
                }
            }
        }, 30000);
    }
    
    private void acceptOrderAPI(final String orderId, final int notificationId) {
        new Thread(() -> {
            try {
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Accept clicked");
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: orderId=" + orderId);
                
                SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                String token = prefs.getString("swaddo_delivery_token", null);
                String riderId = prefs.getString("riderId", null);
                String apiUrl = prefs.getString("swaddo_api_url", "https://food-delivery-app-wfv0.onrender.com");
                
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: riderId=" + riderId);
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: token present=" + (token != null));
                
                if (token == null || riderId == null) {
                    runOnUiThread(() -> Toast.makeText(RingingActivity.this, "Auth error: Token or Rider ID missing", Toast.LENGTH_SHORT).show());
                    resetAction();
                    return;
                }
                
                String finalOrderId = orderId; // Do NOT prefix with "job_"
                URL url = new URL(apiUrl + "/api/delivery/assignments/" + finalOrderId + "/accept");
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Accept API URL=" + url.toString());
                
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(10000); // 10 seconds
                conn.setReadTimeout(10000); // 10 seconds
                conn.setRequestMethod("PATCH");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                
                JSONObject jsonParam = new JSONObject();
                jsonParam.put("riderId", riderId);
                
                OutputStream os = conn.getOutputStream();
                os.write(jsonParam.toString().getBytes("UTF-8"));
                os.close();
                
                int responseCode = conn.getResponseCode();
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Accept API HTTP status=" + responseCode);
                
                java.io.InputStream stream = (responseCode >= 200 && responseCode < 300) ? conn.getInputStream() : conn.getErrorStream();
                String responseBody = "";
                if (stream != null) {
                    java.util.Scanner s = new java.util.Scanner(stream).useDelimiter("\\A");
                    responseBody = s.hasNext() ? s.next() : "";
                }
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Accept API response=" + responseBody);
                
                if (responseCode >= 200 && responseCode < 300) {
                    android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Accept SUCCESS - closing RingingActivity");
                    runOnUiThread(() -> {
                        stopRinging();
                        if (notificationId != -1) {
                            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                            notificationManager.cancel(notificationId);
                            android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: notification cancelled");
                        }
                        // Open MainActivity
                        Intent mainIntent = new Intent(RingingActivity.this, MainActivity.class);
                        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                        startActivity(mainIntent);
                        finish();
                    });
                } else {
                    android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Accept FAILED - keeping RingingActivity open");
                    final String errorMsg = "Error: " + responseCode + ". Swipe to retry.";
                    runOnUiThread(() -> {
                        Toast.makeText(RingingActivity.this, errorMsg, Toast.LENGTH_LONG).show();
                        resetAction();
                    });
                }
            } catch (Exception e) {
                e.printStackTrace();
                android.util.Log.e("SwaddoFCM", "DIAGNOSTIC: Accept FAILED (Exception) - keeping RingingActivity open: " + e.getMessage());
                runOnUiThread(() -> {
                    Toast.makeText(RingingActivity.this, "Network error. Swipe to retry.", Toast.LENGTH_SHORT).show();
                    resetAction();
                });
            }
        }).start();
    }
    
    private void resetAction() {
        actionInProgress = false;
        runOnUiThread(() -> {
            SeekBar sbAccept = findViewById(R.id.sbAccept);
            TextView tvTitle = findViewById(R.id.tvTitle);
            if (sbAccept != null) {
                sbAccept.setEnabled(true);
                sbAccept.setProgress(0);
            }
            if (tvTitle != null) tvTitle.setText("New Delivery!");
        });
    }

    private void stopRinging() {
        if (mediaPlayer != null && mediaPlayer.isPlaying()) {
            mediaPlayer.stop();
            mediaPlayer.release();
        }
        if (vibrator != null) {
            vibrator.cancel();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopRinging();
    }
}
