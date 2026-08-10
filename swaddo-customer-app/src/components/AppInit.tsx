"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";
import Onboarding from "./Onboarding";
import { SplashScreen as NativeSplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

export default function AppInit() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("swaddo_onboarding_completed");
    const token = localStorage.getItem("swaddo_customer_token");
    
    // Show onboarding if they haven't completed it OR if they aren't logged in
    if (!hasCompletedOnboarding || !token) {
      setShowOnboarding(true);
      localStorage.removeItem("swaddo_onboarding_completed"); // Reset it so it shows next time too
    }

    if (Capacitor.isNativePlatform()) {
      NativeSplashScreen.hide().catch(() => {});
      StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
    </>
  );
}
