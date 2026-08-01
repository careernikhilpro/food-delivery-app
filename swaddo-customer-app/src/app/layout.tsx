import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/TopNav";
import BottomNav from "@/components/BottomNav";
import NotificationListener from "@/components/NotificationListener";
import { CartProvider } from "@/context/CartContext";
import { LocationProvider } from "@/context/LocationContext";
import PageTransitionWrapper from "@/components/PageTransitionWrapper";
import AppInit from "@/components/AppInit";
import PWARegister from "@/components/PWARegister";
import SWRProvider from "@/components/SWRProvider";
import { Toaster } from "react-hot-toast";
import OfflineOverlay from "@/components/OfflineOverlay";
import FloatingCart from "@/components/FloatingCart";
import ActiveOrderBanner from "@/components/ActiveOrderBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"], 
  subsets: ["latin"], 
  variable: "--font-heading" 
});

export const metadata: Metadata = {
  title: "Swaddo - Street Food Delivery",
  description: "Live tracking for your local street food orders.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

const IS_COMING_SOON = true;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`}>
        {IS_COMING_SOON ? (
          <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              {/* Logo Box */}
              <div className="w-24 h-24 bg-primary rounded-[28px] flex items-center justify-center shadow-2xl shadow-primary/40 mb-8 animate-[bounce_3s_ease-in-out_infinite]">
                <img src="/icons/icon-192x192.png" alt="Swaddo Logo" className="w-16 h-16 object-contain" />
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4 tracking-tight">
                We are coming <span className="text-primary">very soon...</span>
              </h1>
              
              <p className="text-text-muted text-lg md:text-xl max-w-md mb-12">
                Get ready to experience the fastest local street food delivery right to your doorstep.
              </p>
              
              {/* Loading dots */}
              <div className="flex gap-3">
                <div className="w-3 h-3 rounded-full bg-primary animate-bounce"></div>
                <div className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:150ms]"></div>
                <div className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:300ms]"></div>
              </div>
            </div>
          </div>
        ) : (
          <SWRProvider>
            <LocationProvider>
              <CartProvider>
                {/* Top Nav for Desktop */}
                <TopNav />
              
                {/* Main Content Area */}
                <main className="app-scroll-container pb-24 xl:pb-0 xl:pt-20 relative">
                  <AppInit />
                  <PageTransitionWrapper>
                    {children}
                  </PageTransitionWrapper>
                </main>
                
                {/* Background Handlers */}
                <NotificationListener />
                <PWARegister />
                <Toaster position="top-center" toastOptions={{
                  duration: 5000,
                  style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  },
                }} />

                {/* Bottom Nav for Mobile */}
                <BottomNav />
                <OfflineOverlay />
                <FloatingCart />
                <ActiveOrderBanner />
              </CartProvider>
            </LocationProvider>
          </SWRProvider>
        )}
      </body>
    </html>
  );
}
