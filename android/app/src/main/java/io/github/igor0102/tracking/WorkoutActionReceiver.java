package io.github.igor0102.tracking;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Recibe el botón «Hecha» de la notificación del entreno y se lo pasa a la app. */
public class WorkoutActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (TrackingNativePlugin.ACTION_CHECK.equals(intent.getAction())) {
            TrackingNativePlugin.onCheckFromNotification(context);
        }
    }
}
