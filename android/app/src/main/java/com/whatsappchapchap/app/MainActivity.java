package com.whatsappchapchap.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Enable edge-to-edge display (content renders behind system bars)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
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
