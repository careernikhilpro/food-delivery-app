"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";

export default function ForgotPassword() {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone) return;
    setLoading(true);
    // Simulate sending OTP
    setTimeout(() => {
      setLoading(false);
      // Pass the contact info to verify-otp if needed via query or context
      router.push("/verify-otp");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col app-container">
      
      {/* Top Bar */}
      <div className="px-6 pt-10 pb-6 relative">
        <button 
          onClick={() => router.back()} 
          className="absolute left-6 top-10 text-text-green-600 p-1"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-text-green-600 mt-12">Forgot Password?</h1>
        <p className="text-sm text-text-muted mt-2">
          Enter your email or phone number we'll send you a verification code
        </p>
      </div>

      {/* Form Section */}
      <div className="px-6 flex-grow flex flex-col">
        <form onSubmit={handleContinue} className="flex-grow flex flex-col">
          <div>
            <label className="block text-sm font-semibold text-text-green-600 mb-2">Email or Phone Number</label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="merchant@example.com"
              className="w-full bg-white border border-border-subtle rounded-xl py-3.5 px-4 outline-none focus:border-green-600 transition-colors text-text-green-600 placeholder:text-neutral-300"
              required
            />
          </div>

          {/* Illustration Space */}
          <div className="flex-grow flex items-center justify-center py-10 relative">
             {/* Shop Illustration Placeholder */}
             <div className="relative w-48 h-48 flex items-end justify-center">
                <div className="absolute w-32 h-32 bg-green-600/10 rounded-full blur-xl bottom-4"></div>
                <div className="w-32 h-24 bg-white border-2 border-green-600 rounded-t-xl relative z-10 flex flex-col">
                   <div className="h-6 bg-green-600 rounded-t-[10px] w-full flex items-center justify-around px-2">
                     {/* Awning stripes */}
                     <div className="w-4 h-full bg-white/30 skew-x-[15deg]"></div>
                     <div className="w-4 h-full bg-white/30 skew-x-[15deg]"></div>
                     <div className="w-4 h-full bg-white/30 skew-x-[15deg]"></div>
                   </div>
                   <div className="flex-grow flex items-center justify-center">
                     <Store size={40} className="text-green-600/40" />
                   </div>
                </div>
                {/* Little scooter prop */}
                <div className="absolute bottom-2 left-4 w-8 h-8 bg-green-600 rounded-lg z-20"></div>
             </div>
          </div>

          <div className="pb-8 mt-auto">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center"
            >
              {loading ? "Sending..." : "Continue"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
