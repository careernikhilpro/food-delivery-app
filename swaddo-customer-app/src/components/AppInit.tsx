"use client";

import { useState, useEffect } from "react";
import SplashScreen from "./SplashScreen";
import Onboarding from "./Onboarding";

export default function AppInit() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("swaddo_onboarding_completed");
    const token = localStorage.getItem("swaddo_customer_token");
    
    // Show onboarding if they haven't completed it OR if they aren't logged in
    if (!hasCompletedOnboarding || !token) {
      setShowOnboarding(true);
      localStorage.removeItem("swaddo_onboarding_completed"); // Reset it so it shows next time too
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
    </>
  );
}
