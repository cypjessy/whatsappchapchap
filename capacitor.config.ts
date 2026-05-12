import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whatsappchapchap.app',
  appName: 'WhatsApp Chap Chap',
  webDir: 'out',
  server: {
    url: 'https://whatsappchapchap.vercel.app',
    cleartext: false
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#25D366',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'light',
      backgroundColor: '#25D366',
      overlaysWebView: false,
    }
  }
};

export default config;
