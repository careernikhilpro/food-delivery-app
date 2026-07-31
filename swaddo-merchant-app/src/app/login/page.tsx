"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/firebase";
import { ChevronDown, ArrowRight, Loader2, Download, Lock } from "lucide-react";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/request-otp", { phone, role: "vendor" });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to request OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid OTP");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", { phone, otp, role: "vendor" });
      const token = res.data.token;

      localStorage.setItem("swaddo_merchant_token", token);
      document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `role=vendor; path=/; max-age=86400; SameSite=Lax`;
      
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

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex justify-center bg-[#FFF8F0] overflow-hidden">
      <div className="w-full max-w-[448px] h-full flex flex-col relative bg-[#FFF8F0]">
      
      {/* Top Banner Area */}
      <div className="pt-4 px-6 pb-10 relative flex flex-col justify-center">
        {/* Combined Logo (Speed lines + Pin) in Green */}
        <div className="flex items-center gap-3 mb-2">
           {/* Speed Lines */}
           <div className="flex flex-col gap-1.5 justify-center">
              <div className="w-4 h-1 bg-[#16A34A] rounded-full mx-auto"></div>
              <div className="w-8 h-1 bg-[#16A34A] rounded-full"></div>
              <div className="w-4 h-1 bg-[#16A34A] rounded-full mx-auto"></div>
           </div>
           
           {/* SVG Location pin with S inside it */}
           <svg width="35" height="42" viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M20 0C8.954 0 0 8.954 0 20C0 35 20 50 20 50C20 50 40 35 40 20C40 8.954 31.046 0 20 0Z" fill="#16A34A" />
             <text x="50%" y="45%" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="sans-serif" dy=".3em">S</text>
           </svg>
        </div>
        <h1 className="text-[32px] font-black text-green-600 tracking-wider leading-none">SWADDO</h1>
        <p className="text-[8px] font-extrabold text-slate-700 tracking-[0.2em] mt-1">MERCHANT PORTAL</p>
      </div>
      
      {/* Main White Card Overlap */}
      <div className="bg-white rounded-t-[36px] flex-grow shadow-[0_-10px_40px_rgba(0,0,0,0.04)] px-6 pt-6 flex flex-col justify-between -mt-6 z-10 relative">
        
        {/* Form Content */}
        <div>
           <h2 className="text-[24px] font-black text-slate-900 mb-1 tracking-tight">Welcome Partner</h2>
           <p className="text-[13px] font-medium text-slate-500 mb-6">Sign in to manage your restaurant and orders</p>
           
           {error && (
             <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
               {error}
             </div>
           )}

           {step === 1 ? (
             <form onSubmit={requestOtp}>
               <label className="block text-sm font-bold text-slate-900 mb-3">Mobile Number</label>
               
               <div className="flex items-center bg-[#F8F9FA] rounded-xl border border-transparent focus-within:border-green-600 transition-colors p-1 pr-3">
                 {/* Country Code Dropdown */}
                 <div className="flex items-center px-3 py-3 gap-2 border-r border-slate-200">
                   <span className="text-xl leading-none">🇮🇳</span>
                   <span className="font-bold text-slate-900 text-[15px]">+91</span>
                   <ChevronDown size={16} className="text-slate-400" />
                 </div>
                 
                 {/* Input Area */}
                 <div className="flex-grow flex items-center pl-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 mr-2">
                       <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter your mobile number"
                      className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                      maxLength={10}
                      required
                    />
                 </div>
               </div>

               <button
                 type="submit"
                 disabled={loading}
                 className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-[14px] rounded-[14px] transition-colors shadow-sm flex items-center justify-center gap-2 mt-6 text-[15px]"
               >
                 {loading ? <Loader2 size={20} className="animate-spin" /> : "Send OTP"}
                 {!loading && <ArrowRight size={20} />}
               </button>
             </form>
           ) : (
             <form onSubmit={verifyOtp}>
               <label className="block text-sm font-bold text-slate-900 mb-3">Enter OTP</label>
               
               <div className="flex items-center bg-[#F8F9FA] rounded-xl border border-transparent focus-within:border-green-600 transition-colors p-1 pr-3">
                 <div className="flex-grow flex items-center pl-4 py-3">
                    <Lock size={18} className="text-slate-400 mr-3" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="4-digit OTP"
                      className="w-full bg-transparent outline-none text-[15px] font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
                      maxLength={4}
                      required
                    />
                 </div>
               </div>
               
               <p className="text-xs text-slate-500 mt-4 text-center">
                 OTP sent to +91 {phone}. <button type="button" onClick={() => setStep(1)} className="text-green-600 font-bold hover:underline">Edit</button>
               </p>
               
               <button
                 type="submit"
                 disabled={loading}
                 className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-[18px] rounded-[16px] transition-colors shadow-sm flex items-center justify-center gap-2 mt-6 text-[16px]"
               >
                 {loading ? <Loader2 size={20} className="animate-spin" /> : "Verify & Login"}
                 {!loading && <ArrowRight size={20} />}
               </button>
             </form>
           )}
        </div>

        {/* High Quality Illustration Area */}
        <div className="flex-grow flex items-end justify-center pt-4 mt-4 -mx-6 overflow-hidden">
           <div className="relative w-full flex justify-center items-end">
             <img 
               src="/delivery-scooter.png" 
               alt="Delivery Scooter Illustration" 
               className="w-full h-auto object-contain object-bottom" 
               style={{ clipPath: 'inset(3% 1% 2% 1% round 16px)' }}
             />
           </div>
        </div>

        {/* Footer Text area */}
        <div className="text-center pb-4 pt-4 mt-auto">
           <p className="text-[10px] font-medium text-slate-400">
             By continuing, you agree to our <span className="text-[#FF6600]">Terms of Service</span> and <span className="text-[#FF6600]">Privacy Policy</span>
           </p>
        </div>

      </div>
    </div>
   </div>
  );
}
