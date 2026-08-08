import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swaddo.merchant',
  appName: 'Swaddo Merchant',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'swaddo.in'
  }
};

export default config;
