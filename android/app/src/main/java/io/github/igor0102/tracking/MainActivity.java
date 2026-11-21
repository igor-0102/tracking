package io.github.igor0102.tracking;

import android.content.Intent;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(TrackingNativePlugin.class);
        super.onCreate(savedInstanceState);
        handleAction(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleAction(intent);
    }

    // El widget y el recordatorio abren la app con una acción (por ejemplo, «add-weight»).
    private void handleAction(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra(TrackingNativePlugin.EXTRA_ACTION);
        if (action == null) return;
        intent.removeExtra(TrackingNativePlugin.EXTRA_ACTION);
        TrackingNativePlugin.onLaunchAction(action);
    }
}
