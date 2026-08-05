import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import PWARegister from "@/components/PWARegister";
import SWRProvider from "@/components/SWRProvider";
import FCMListener from "@/components/FCMListener";

import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Swaddo Merchant App",
  description: "Manage stall orders and menu.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`font-sans bg-gray-100 text-text-primary antialiased`}>
        <SWRProvider>
          <div className="app-container">
            <SplashScreen />
            <main className="pb-20">
              <PageTransitionWrapper>
                {children}
              </PageTransitionWrapper>
            </main>
            <PWARegister />
            <FCMListener />
            <BottomNav />
          </div>
        </SWRProvider>
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
          <Script 
            src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry,places`}
            strategy="beforeInteractive"
          />
        )}
      </body>
    </html>
  );
}
