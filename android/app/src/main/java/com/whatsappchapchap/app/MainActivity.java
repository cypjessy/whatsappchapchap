package com.whatsappchapchap.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.graphics.Color;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyEdgeToEdge();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Re-apply edge to edge on every resume to prevent black bars
        applyEdgeToEdge();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Small delay to let Android settle before re-applying
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                applyEdgeToEdge();
            }, 100);
        }
    }

    private void applyEdgeToEdge() {
        // Enable edge-to-edge display (content renders behind system bars)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // Configure system bars appearance
        WindowInsetsControllerCompat controller = new WindowInsetsControllerCompat(
            getWindow(), 
            getWindow().getDecorView()
        );
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);
        
        // Set transparent system bars
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        
        // Keep layout stable during autofill/keyboard events
        getWindow().setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        );
        
        // Prevent layout from shifting when autofill appears
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, insets) -> {
            view.setPadding(0, 0, 0, 0);
            return insets;
        });
    }
}
