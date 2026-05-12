import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whatsappchapchap.app',
  appName: 'WhatsApp Chap Chap',
  webDir: 'out',
  server: {
    url: 'https://whatsappchapchap.vercel.app',
    cleartext: false,
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false, // Control it manually
      backgroundColor: '#25D366',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true, // Hides status+nav bar during splash
      launchFadeOutDuration: 300,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#25D366',
      overlaysWebView: false,
    }
  }
};

export default config;
