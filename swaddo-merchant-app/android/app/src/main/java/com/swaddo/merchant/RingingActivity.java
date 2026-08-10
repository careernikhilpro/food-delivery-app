package com.swaddo.merchant;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;

public class RingingActivity extends Activity {

    private Ringtone ringtone;
    private Vibrator vibrator;
    private TextView tvItems, tvCustomerName, tvCustomerAddress, tvTotalAmount;
    private Button btnAccept, btnReject;

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
        String orderId = getIntent().getStringExtra("orderId");
        String items = getIntent().getStringExtra("items");
        String customerName = getIntent().getStringExtra("customerName");
        String customerAddress = getIntent().getStringExtra("customerAddress");
        String totalAmount = getIntent().getStringExtra("totalAmount");
        final int notificationId = getIntent().getIntExtra("notificationId", -1);

        TextView tvTitle = findViewById(R.id.tvTitle);
        TextView tvOrderId = findViewById(R.id.tvOrderId);
        tvItems = findViewById(R.id.tvItems);
        tvCustomerName = findViewById(R.id.tvCustomerName);
        tvCustomerAddress = findViewById(R.id.tvCustomerAddress);
        tvTotalAmount = findViewById(R.id.tvTotalAmount);
        btnAccept = findViewById(R.id.btnAccept);
        btnReject = findViewById(R.id.btnReject);

        if (title != null) tvTitle.setText(title);
        if (orderId != null) tvOrderId.setText("Order #" + orderId);

        boolean needsFetch = false;
        
        // Handle items
        if (items != null && !items.isEmpty()) {
            tvItems.setText(items);
        } else {
            tvItems.setText("Fetching order...");
            needsFetch = true;
        }
        
        // Handle customer name
        if (customerName != null && !customerName.isEmpty()) {
            tvCustomerName.setText(customerName);
        } else {
            tvCustomerName.setText("Fetching user...");
            needsFetch = true;
        }
        
        // Handle customer address
        if (customerAddress != null && !customerAddress.isEmpty()) {
            tvCustomerAddress.setText(customerAddress);
        } else {
            tvCustomerAddress.setText("Loading address...");
            needsFetch = true;
        }
        
        // Handle total amount
        if (totalAmount != null && !totalAmount.isEmpty()) {
            tvTotalAmount.setText("₹" + totalAmount);
        } else {
            tvTotalAmount.setText("₹...");
            needsFetch = true;
        }

        if (needsFetch && orderId != null) {
            fetchOrderDetails(orderId);
        }

        // Start custom ringing
        Uri alarmUri = Uri.parse("android.resource://" + getPackageName() + "/" + R.raw.orderring);
        ringtone = RingtoneManager.getRingtone(getApplicationContext(), alarmUri);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            ringtone.setLooping(true);
        }
        ringtone.play();

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

        btnAccept.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (orderId != null) {
                    btnAccept.setEnabled(false);
                    btnReject.setEnabled(false);
                    btnAccept.setText("Accepting...");
                    callApiAndUpdateStatus(orderId, "preparing", notificationId);
                } else {
                    stopRingingAndFinish(notificationId);
                }
            }
        });

        btnReject.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (orderId != null) {
                    btnAccept.setEnabled(false);
                    btnReject.setEnabled(false);
                    btnReject.setText("Rejecting...");
                    callApiAndUpdateStatus(orderId, "cancelled", notificationId);
                } else {
                    stopRingingAndFinish(notificationId);
                }
            }
        });

        // Auto-close after 60 seconds to prevent infinite ringing (especially in multi-device setups)
        new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
            @Override
            public void run() {
                if (!isFinishing()) {
                    stopRinging();
                    finish();
                }
            }
        }, 60000);
    }

    private void stopRinging() {
        if (ringtone != null && ringtone.isPlaying()) {
            ringtone.stop();
        }
        if (vibrator != null) {
            vibrator.cancel();
        }
    }
    
    private void stopRingingAndFinish(int notificationId) {
        stopRinging();
        if (notificationId != -1) {
            android.app.NotificationManager nm = (android.app.NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            nm.cancel(notificationId);
        }
        finishAndOpenMain();
    }

    private void finishAndOpenMain() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            android.app.KeyguardManager km = (android.app.KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null && km.isKeyguardLocked()) {
                km.requestDismissKeyguard(this, new android.app.KeyguardManager.KeyguardDismissCallback() {
                    @Override
                    public void onDismissSucceeded() {
                        launchMain();
                    }
                    @Override
                    public void onDismissCancelled() {
                        finish();
                    }
                    @Override
                    public void onDismissError() {
                        finish();
                    }
                });
                return;
            }
        }
        launchMain();
    }

    private void launchMain() {
        Intent mainIntent = new Intent(RingingActivity.this, MainActivity.class);
        mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        startActivity(mainIntent);
        finish();
    }

    private void fetchOrderDetails(String orderId) {
        new Thread(() -> {
            String lastError = "";
            int retries = 3;
            while (retries > 0) {
                try {
                    android.content.SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                    String token = prefs.getString("swaddo_merchant_token", null);
                    if (token == null || token.isEmpty()) {
                        runOnUiThread(() -> {
                            tvItems.setText("Auth Error: Token missing");
                            tvCustomerName.setText("Please open main app first");
                        });
                        return;
                    }

                    boolean fallbackSuccess = fetchOrderFromListFallbackSync(orderId, token);
                    if (fallbackSuccess) {
                        return; // Success, exit thread
                    } else {
                        lastError = "Order not found in list";
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    lastError = "Exc: " + e.getClass().getSimpleName();
                }
                
                retries--;
                if (retries > 0) {
                    try {
                        Thread.sleep(1500); // Wait 1.5s before retry
                    } catch (InterruptedException ignored) {}
                }
            }
            
            // If we reach here, all retries failed
            final String finalErr = lastError;
            runOnUiThread(() -> {
                tvItems.setText(finalErr.isEmpty() ? "Network Error" : finalErr);
                tvCustomerName.setText("Failed to fetch order");
            });
        }).start();
    }
    
    private boolean fetchOrderFromListFallbackSync(String orderId, String token) {
        try {
            URL url = new URL("https://food-delivery-app-wfv0.onrender.com/api/orders?limit=100");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Authorization", "Bearer " + token);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);

            int responseCode = conn.getResponseCode();
            if (responseCode >= 200 && responseCode < 300) {
                InputStream is = conn.getInputStream();
                Scanner s = new Scanner(is).useDelimiter("\\A");
                String response = s.hasNext() ? s.next() : "";
                
                JSONObject parentObj = new JSONObject(response);
                JSONArray dataArr = null;
                if (parentObj.has("data")) {
                    dataArr = parentObj.getJSONArray("data");
                }
                
                if (dataArr != null) {
                    for (int i = 0; i < dataArr.length(); i++) {
                        JSONObject order = dataArr.getJSONObject(i);
                        String id = order.optString("id", order.optString("_id", ""));
                        if (orderId.equals(id)) {
                            // Found order
                            String fetchedItems = order.optString("items", "");
                            String custName = order.optString("customer", "Customer");
                            String custAddress = order.optString("address", "");
                            String totalAmt = "₹" + order.optString("total", "0");
                            
                            final String finalItems = fetchedItems;
                            final String finalName = custName;
                            final String finalAddress = custAddress;
                            final String finalTotal = totalAmt;
                            
                            runOnUiThread(() -> {
                                tvItems.setText(!finalItems.isEmpty() ? finalItems : "1x Item");
                                tvCustomerName.setText(finalName);
                                tvCustomerAddress.setText(finalAddress);
                                tvTotalAmount.setText(finalTotal);
                            });
                            return true;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    private void callApiAndUpdateStatus(String orderId, String status, int notificationId) {
        new Thread(() -> {
            try {
                android.content.SharedPreferences prefs = getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
                String token = prefs.getString("swaddo_merchant_token", null);
                if (token == null) {
                    runOnUiThread(() -> {
                        Toast.makeText(RingingActivity.this, "Authentication missing. Please login again.", Toast.LENGTH_LONG).show();
                        enableButtons();
                    });
                    return;
                }

                URL url = new URL("https://food-delivery-app-wfv0.onrender.com/api/orders/" + orderId + "/status");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("PATCH");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setRequestProperty("Authorization", "Bearer " + token);
                conn.setDoOutput(true);

                String jsonInputString = "{\"status\": \"" + status + "\"}";
                try(OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonInputString.getBytes("utf-8");
                    os.write(input, 0, input.length);           
                }

                int responseCode = conn.getResponseCode();
                android.util.Log.d("SwaddoAPI", "PATCH Status code: " + responseCode);
                
                if (responseCode >= 200 && responseCode < 300) {
                    // Success! Safe to close RingingActivity and open main app.
                    runOnUiThread(() -> {
                        stopRingingAndFinish(notificationId);
                    });
                } else {
                    // Failed! Do not close, show error and allow retry.
                    runOnUiThread(() -> {
                        Toast.makeText(RingingActivity.this, "Failed to update order. Network or server error.", Toast.LENGTH_SHORT).show();
                        enableButtons();
                    });
                }
            } catch (Exception e) {
                e.printStackTrace();
                runOnUiThread(() -> {
                    Toast.makeText(RingingActivity.this, "Connection failed. Please check network.", Toast.LENGTH_SHORT).show();
                    enableButtons();
                });
            }
        }).start();
    }
    
    private void enableButtons() {
        btnAccept.setEnabled(true);
        btnReject.setEnabled(true);
        btnAccept.setText("Accept Order");
        btnReject.setText("Reject");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopRinging();
    }
}
