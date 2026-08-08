import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swaddo.delivery',
  appName: 'Swaddo Delivery',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'swaddo.in'
  }
};

export default config;
