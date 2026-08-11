package com.swaddo.delivery;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "LocationService")
public class LocationPlugin extends Plugin {

    private BroadcastReceiver locationReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            double lat = intent.getDoubleExtra("lat", 0);
            double lng = intent.getDoubleExtra("lng", 0);
            JSObject ret = new JSObject();
            ret.put("lat", lat);
            ret.put("lng", lng);
            notifyListeners("locationUpdate", ret);
        }
    };

    @Override
    public void load() {
        super.load();
        IntentFilter filter = new IntentFilter("com.swaddo.delivery.LOCATION_UPDATE");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(locationReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(locationReceiver, filter);
        }
    }

    @Override
    protected void handleOnDestroy() {
        getContext().unregisterReceiver(locationReceiver);
        super.handleOnDestroy();
    }

    @PluginMethod
    public void startService(PluginCall call) {
        String riderId = call.getString("riderId");
        String apiUrl = call.getString("apiUrl");
        String authToken = call.getString("authToken");

        if (riderId == null || apiUrl == null) {
            call.reject("Must provide riderId and apiUrl");
            return;
        }

        Intent intent = new Intent(getContext(), LocationForegroundService.class);
        intent.putExtra("riderId", riderId);
        intent.putExtra("apiUrl", apiUrl);
        intent.putExtra("authToken", authToken);
        intent.setAction("START_SERVICE");

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(intent);
            } else {
                getContext().startService(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Native Service Error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Intent intent = new Intent(getContext(), LocationForegroundService.class);
        intent.setAction("STOP_SERVICE");
        getContext().startService(intent); // Start with STOP action to cleanly kill it
        
        call.resolve();
    }
}
