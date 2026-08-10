import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import SplashScreen from "@/components/SplashScreen";
import PWARegister from "@/components/PWARegister";
import FCMListener from "@/components/FCMListener";
import CapacitorBackButton from "@/components/CapacitorBackButton";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["latin"], 
  variable: "--font-heading" 
});

export const metadata: Metadata = {
  title: "Swaddo Delivery Partner",
  description: "Delivery partner app for Swaddo.",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} font-body bg-bg-main text-text-primary antialiased`}>
        <SplashScreen />
        <CapacitorBackButton />
        <main className="pb-20">
          {children}
        </main>
        <PWARegister />
        <FCMListener />
        <BottomNav />
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
