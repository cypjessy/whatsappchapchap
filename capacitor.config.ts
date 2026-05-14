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
      style: 'light',
      backgroundColor: '#25D366',
      overlaysWebView: false,
    },
    EdgeToEdge: {
      backgroundColor: '#ffffff',
    }
  }
};

export default config;
