package io.github.igor0102.tracking;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

/** Widget de la pantalla de inicio: último peso, media de 7 días y botón «+ Peso». */
public class WeightWidget extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, views(context));
    }

    static RemoteViews views(Context c) {
        SharedPreferences p = c.getSharedPreferences(TrackingNativePlugin.PREFS, Context.MODE_PRIVATE);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_weight);
        v.setTextViewText(R.id.w_kg, p.getString("w_kg", "—"));
        v.setTextViewText(R.id.w_sub, p.getString("w_sub", "Abre Tracking para empezar"));
        v.setOnClickPendingIntent(R.id.w_root, TrackingNativePlugin.openApp(c, null, 20));
        v.setOnClickPendingIntent(R.id.w_add, TrackingNativePlugin.openApp(c, "add-weight", 21));
        return v;
    }

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, WeightWidget.class));
        for (int id : ids) m.updateAppWidget(id, views(c));
    }
}
