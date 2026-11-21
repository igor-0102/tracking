package io.github.igor0102.tracking;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Funciones nativas de Tracking: notificación del entreno en curso (con botón «Hecha»),
 * datos del widget de peso y acciones con las que se abre la app.
 */
@CapacitorPlugin(
    name = "TrackingNative",
    permissions = { @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications") }
)
public class TrackingNativePlugin extends Plugin {
    static final String CHANNEL = "workout";
    static final int NOTIF_ID = 4201;
    static final String PREFS = "tracking_native";
    static final String EXTRA_ACTION = "tracking_action";
    static final String ACTION_CHECK = "io.github.igor0102.tracking.CHECK";

    private static TrackingNativePlugin instance;
    private static String launchAction = null;

    @Override
    public void load() {
        instance = this;
        createChannel(getContext());
    }

    static void createChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Entreno en curso", NotificationManager.IMPORTANCE_LOW);
        ch.setDescription("Tiempo, descanso y serie que toca durante el entreno");
        ch.setShowBadge(false);
        c.getSystemService(NotificationManager.class).createNotificationChannel(ch);
    }

    static PendingIntent openApp(Context c, String action, int requestCode) {
        Intent i = new Intent(c, MainActivity.class);
        i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        if (action != null) i.putExtra(EXTRA_ACTION, action);
        return PendingIntent.getActivity(c, requestCode, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /* ---------- Permiso de notificaciones (Android 13+) ---------- */
    @PluginMethod
    public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            call.resolve(granted(true));
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationsCallback");
    }

    @PermissionCallback
    private void notificationsCallback(PluginCall call) {
        call.resolve(granted(getPermissionState("notifications") == PermissionState.GRANTED));
    }

    private JSObject granted(boolean ok) {
        JSObject r = new JSObject();
        r.put("granted", ok);
        return r;
    }

    /* ---------- Notificación del entreno ---------- */
    @PluginMethod
    public void workoutShow(PluginCall call) {
        Context c = getContext();
        long now = System.currentTimeMillis();
        long start = toLong(call.getDouble("startMs"), now);
        long restEnd = toLong(call.getDouble("restEndMs"), 0);
        long restStart = toLong(call.getDouble("restStartMs"), 0);
        String text = call.getString("text", "");

        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_stat_tracking)
            .setContentTitle(call.getString("title", "Entreno"))
            .setContentText(text)
            .setSubText(call.getString("sub", ""))
            .setStyle(new Notification.BigTextStyle().bigText(text))
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setShowWhen(true)
            .setUsesChronometer(true)
            .setColor(0xFF7AA2FF)
            .setContentIntent(openApp(c, null, 10));
        if (restEnd > now) {
            b.setWhen(restEnd);
            b.setChronometerCountDown(true);
        } else {
            b.setWhen(restStart > 0 ? restStart : start);
        }
        if (Boolean.TRUE.equals(call.getBoolean("canCheck", false))) {
            Intent check = new Intent(c, WorkoutActionReceiver.class).setAction(ACTION_CHECK);
            PendingIntent pi = PendingIntent.getBroadcast(c, 11, check, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            b.addAction(new Notification.Action.Builder(R.drawable.ic_stat_tracking, "✓ Hecha", pi).build());
        }
        c.getSystemService(NotificationManager.class).notify(NOTIF_ID, b.build());
        call.resolve();
    }

    @PluginMethod
    public void workoutClear(PluginCall call) {
        getContext().getSystemService(NotificationManager.class).cancel(NOTIF_ID);
        call.resolve();
    }

    private static long toLong(Double d, long def) {
        return d == null ? def : d.longValue();
    }

    /* ---------- Botón «Hecha» de la notificación ---------- */
    static void onCheckFromNotification(Context c) {
        SharedPreferences p = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        p.edit().putInt("pending_checks", p.getInt("pending_checks", 0) + 1).apply();
        if (instance != null) instance.notifyListeners("workoutCheck", new JSObject());
    }

    @PluginMethod
    public void consumePendingChecks(PluginCall call) {
        SharedPreferences p = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int n = p.getInt("pending_checks", 0);
        p.edit().putInt("pending_checks", 0).apply();
        JSObject r = new JSObject();
        r.put("n", n);
        call.resolve(r);
    }

    /* ---------- Acción con la que se abrió la app (widget, recordatorio) ---------- */
    static void onLaunchAction(String action) {
        launchAction = action;
        if (instance != null) instance.notifyListeners("launchAction", new JSObject());
    }

    @PluginMethod
    public void consumeLaunchAction(PluginCall call) {
        JSObject r = new JSObject();
        r.put("action", launchAction);
        launchAction = null;
        call.resolve(r);
    }

    /* ---------- Widget de peso ---------- */
    @PluginMethod
    public void setWidget(PluginCall call) {
        Context c = getContext();
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putString("w_kg", call.getString("kg", "—"))
            .putString("w_sub", call.getString("sub", ""))
            .apply();
        WeightWidget.updateAll(c);
        call.resolve();
    }
}
