import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whatsappchapchap.app',
  appName: 'WhatsApp Chap Chap',
  webDir: process.env.CAPACITOR_WEB_DIR || 'out',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
      launchFadeOutDuration: 300,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#25D366',
      overlaysWebView: true,
    },
    EdgeToEdge: {
      enabled: true,
      backgroundColor: '#ffffff',
    }
  }
};

export default config;
