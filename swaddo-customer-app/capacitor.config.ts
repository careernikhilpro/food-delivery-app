import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swaddo.customer',
  appName: 'Swaddo Customer',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'swaddo.in'
  }
};

export default config;
