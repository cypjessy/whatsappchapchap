# ProGuard rules for WhatsApp Chap Chap (Capacitor + Firebase)
# See: http://developer.android.com/guide/developing/tools/proguard.html

# ─── Capacitor / WebView ────────────────────────────────────────────────
# Keep all WebView JavaScript interface methods (critical for Capacitor)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Capacitor plugin classes and their methods
-keep class com.getcapacitor.** { *; }
-keep class * extends com.getcapacitor.Plugin { *; }

# ─── Firebase ───────────────────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Suppress warnings for optional Firebase KTX dependency (not included in project)
-dontwarn com.google.firebase.ktx.Firebase

# ─── General ────────────────────────────────────────────────────────────
# Keep annotations
-keepattributes *Annotation*

# Keep line numbers for crash reporting (optional)
-keepattributes SourceFile,LineNumberTable
