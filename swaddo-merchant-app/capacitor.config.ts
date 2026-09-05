import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swaddo.merchant',
  appName: 'Swaddo Merchant',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'swaddo.in',
    url: 'https://food-delivery-app-theta-rust.vercel.app'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#16A34A",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;
