"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Phone, ArrowRight, Loader2, ShieldCheck, Zap, Shield, ChevronDown, CheckCircle2, Lock } from "lucide-react";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [mockOtpState, setMockOtpState] = useState<string | null>(null);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setLoading(true);

    // DEV BYPASS: Generate random OTP
    const generated = Math.floor(1000 + Math.random() * 9000).toString();
    setMockOtpState(generated);
    
    // Show OTP on screen
    alert(`[DEV MODE] Your OTP for ${phone} is: ${generated}`);
    
    setStep(2);
    setLoading(false);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }
    setError("");
    setLoading(true);

    // DEV BYPASS: Verify against generated OTP
    if (otp !== mockOtpState) {
      setError("Invalid OTP entered. Please check the popup.");
      setLoading(false);
      return;
    }

    try {
      // Send the dev_bypass token to our backend
      const res = await api.post("/auth/verify-otp", { phone, otp, role: "customer", msg91Token: "dev_bypass" });
      const token = res.data.token;

      localStorage.setItem("swaddo_customer_token", token);
      localStorage.setItem("swaddo_customer_phone", phone);
      
      try {
        const fcmToken = await requestNotificationPermission();
        if (fcmToken) {
          await api.post("/notifications/register-token", { token: fcmToken, deviceType: 'web' }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (e) {
        console.warn("Failed to register FCM token", e);
      }
      
      const redirectTo = localStorage.getItem("swaddo_redirect_to") || "/";
      localStorage.removeItem("swaddo_redirect_to");
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.response?.data?.message || "Backend login failed.");
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#FFF5EE] flex flex-col overflow-hidden font-body w-full pb-[calc(var(--safe-area-bottom)+70px)]">
      
      {/* Top Image & Branding Section */}
      <div className="w-full h-[45%] relative shrink-0">
        
        {/* Brand Text - Positioned top left */}
        <div className="absolute top-12 left-6 z-20 flex flex-col gap-0 shrink-0">
          <div className="flex items-center gap-2 mb-2 ml-4">
            <div className="relative">
              {/* Fake Map Pin for the Logo */}
              <div className="w-12 h-12 rounded-full bg-[#FF5722] rounded-bl-none -rotate-45 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-[28px] rotate-45 block leading-none font-body">S</span>
              </div>
              {/* Three little speed lines */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 items-end">
                <div className="w-3 h-[3px] bg-[#FF5722] rounded-full mr-1"></div>
                <div className="w-5 h-[3px] bg-[#FF5722] rounded-full"></div>
                <div className="w-3 h-[3px] bg-[#FF5722] rounded-full mr-1"></div>
              </div>
            </div>
          </div>
          <h1 className="text-[40px] font-body font-extrabold text-[#FF5722] tracking-wider leading-none drop-shadow-sm uppercase">SWADDO</h1>
          <p className="text-gray-600 font-bold text-[11px] mt-2 drop-shadow-sm uppercase tracking-widest">Food. Delivered. Yours.</p>
        </div>
        
        {/* Scaled & Shifted Image - Positioned right and slightly lower */}
        <div className="absolute -right-4 top-28 bottom-0 w-[95%] z-10 mix-blend-multiply">
          <Image 
            src="/onboarding/food_bag.png" 
            alt="Delicious Food" 
            fill
            className="object-contain object-right-bottom scale-110 transform origin-bottom-right contrast-[1.1] brightness-[1.05]"
            priority
          />
        </div>
      </div>

      {/* Main Login Card - Stretches to fill the rest */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="flex-1 w-full bg-white rounded-t-[40px] -mt-8 relative z-20 px-6 pt-10 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex flex-col"
      >
        <div className="max-w-md w-full mx-auto flex flex-col h-full justify-between">
          
          <div className="flex flex-col">
            <h2 className="text-[28px] font-heading font-black text-gray-900 mb-2 tracking-tight">Welcome to Swaddo</h2>
            <p className="text-gray-500 font-medium text-[15px] mb-8">Sign in to order your favorite food</p>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 font-semibold text-center border border-red-100">
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={requestOtp} className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-2">Mobile Number</label>
                  <div className="relative flex items-center rounded-[18px] bg-[#F8F9FA] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#FF5722] transition-all overflow-hidden border border-gray-100 p-1">
                    <div className="flex items-center gap-2 px-3 py-3 bg-transparent shrink-0">
                      <span className="text-base rounded-sm overflow-hidden block w-6 h-4 bg-cover bg-center" style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/en/4/41/Flag_of_India.svg")' }}></span>
                      <span className="font-bold text-gray-900 text-sm">+91</span>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                    <div className="h-6 w-px bg-gray-200 mx-1"></div>
                    <div className="flex items-center flex-1 relative px-2">
                      <Phone className="absolute left-2 text-gray-400" size={16} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter your mobile number"
                        className="w-full bg-transparent py-3 pl-8 pr-2 outline-none font-medium text-gray-900 text-sm placeholder:text-gray-400"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading || phone.length < 10}
                  className={`w-full text-white font-bold py-4 rounded-[18px] transition-all flex items-center justify-center gap-2 active:scale-95 ${phone.length >= 10 && !loading ? 'bg-[#FF5722] shadow-[0_4px_14px_rgba(255,87,34,0.3)]' : 'bg-[#FFB09C] shadow-none'}`}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : "Send OTP"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="flex flex-col gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-900 mb-2">Enter OTP</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="4-digit OTP"
                      className="w-full bg-[#F8F9FA] border border-gray-100 rounded-[18px] py-4 text-center outline-none focus:ring-1 focus:ring-[#FF5722] focus:bg-white transition-colors font-bold text-gray-900 text-2xl tracking-[0.5em]"
                      maxLength={4}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center font-medium">
                    OTP sent to +91 {phone}. <button type="button" onClick={() => setStep(1)} className="text-[#FF5722] font-bold">Edit</button>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className={`w-full text-white font-bold py-4 rounded-[18px] transition-all flex items-center justify-center gap-2 active:scale-95 ${otp.length >= 4 && !loading ? 'bg-[#FF5722] shadow-[0_4px_14px_rgba(255,87,34,0.3)]' : 'bg-[#FFB09C] shadow-none'}`}
                >
                  {loading ? <Loader2 size={20} className="animate-spin" /> : "Verify & Login"}
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col mt-auto pt-6">
            {/* Footer Terms */}
            <p className="text-center text-[10px] text-gray-400 font-bold">
              By continuing, you agree to our <span className="text-[#FF5722] cursor-pointer hover:underline">Terms of Service</span> and <span className="text-[#FF5722] cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
