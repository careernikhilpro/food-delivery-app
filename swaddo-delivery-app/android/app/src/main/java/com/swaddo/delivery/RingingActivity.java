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
                SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                String token = prefs.getString("swaddo_delivery_token", null);
                String riderId = prefs.getString("riderId", null);
                String apiUrl = prefs.getString("swaddo_api_url", "https://food-delivery-app-wfv0.onrender.com");
                
                if (token == null || riderId == null) {
                    runOnUiThread(() -> Toast.makeText(RingingActivity.this, "Auth error: Token or Rider ID missing", Toast.LENGTH_SHORT).show());
                    resetAction();
                    return;
                }
                
                String finalOrderId = orderId;
                if (!finalOrderId.startsWith("job_")) {
                    finalOrderId = "job_" + finalOrderId;
                }
                URL url = new URL(apiUrl + "/api/delivery/assignments/" + finalOrderId + "/accept");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(5000); // 5 seconds timeout
                conn.setReadTimeout(5000); // 5 seconds read timeout
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
                android.util.Log.d("SwaddoFCM", "DIAGNOSTIC: Accept API HTTP=" + responseCode);
                
                if (responseCode >= 200 && responseCode < 300) {
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
                    runOnUiThread(() -> {
                        Toast.makeText(RingingActivity.this, "Failed to accept order. It might have been taken.", Toast.LENGTH_LONG).show();
                        stopRinging();
                        if (notificationId != -1) {
                            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                            notificationManager.cancel(notificationId);
                        }
                        finish();
                    });
                }
            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> {
                    Toast.makeText(RingingActivity.this, "Network error. Try from app.", Toast.LENGTH_SHORT).show();
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
