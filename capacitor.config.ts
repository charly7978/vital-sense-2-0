
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4dadecf1503f48ab8ca5a4dfbf273434',
  appName: 'vital-sense-monitor',
  webDir: 'dist',
  server: {
    url: 'https://4dadecf1-503f-48ab-8ca5-a4dfbf273434.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    permissions: [
      "android.permission.CAMERA",
      "android.permission.FLASHLIGHT"
    ]
  },
  ios: {
    limitsNavigationsToAppBoundDomains: true
  },
  plugins: {
    Camera: {
      ios: {
        usageDescription: "La aplicación necesita acceso a la cámara para medir el ritmo cardíaco"
      },
      android: {
        usageDescription: "La aplicación necesita acceso a la cámara para medir el ritmo cardíaco"
      }
    }
  }
};

export default config;
