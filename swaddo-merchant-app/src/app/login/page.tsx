"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/firebase";
import { Preferences } from '@capacitor/preferences';
import { ChevronDown, ArrowRight, Loader2, Lock, UserPlus, KeyRound, ShieldCheck, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('swaddo_merchant_token');
      if (!token && typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
        if (match) token = match[2];
      }
      if (token && !token.startsWith('mock_')) {
        router.push('/dashboard');
      }
    }
  }, [router]);

  const checkUserExists = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.get(`/auth/check-user?identifier=${phone}&role=vendor`);
      if (res.data.user_found && res.data.pin_set) {
        setStep(2); // Existing user with PIN -> Login
      } else {
        setStep(3); // New user OR existing user without PIN -> Register
      }
    } catch (err: any) {
      setError("Failed to check user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loginWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError("PIN must be 4 digits");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login-pin", { phone, pin, role: "vendor" });
      await handleSuccessfulAuth(res.data.token, phone);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid PIN. Please try again.");
      setLoading(false);
    }
  };

  const registerWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      setError("PIN must be 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs do not match. Please try again.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/register-pin", { phone, pin, role: "vendor" });
      await handleSuccessfulAuth(res.data.token, phone);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (token: string, userPhone: string) => {
    localStorage.setItem("swaddo_merchant_token", token);
    Preferences.set({ key: 'swaddo_merchant_token', value: token });
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
           <h2 className="text-[24px] font-black text-slate-900 mb-1 tracking-tight">
              {step === 1 ? "Welcome Partner" : step === 2 ? "Welcome Back!" : "Create PIN"}
           </h2>
           <p className="text-[13px] font-medium text-slate-500 mb-6">
              {step === 1 ? "Sign in to manage your restaurant and orders" : step === 2 ? "Enter your 4-digit PIN to login" : "Set a secure 4-digit PIN for your account"}
           </p>
           
           {error && (
             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
               {error}
             </motion.div>
           )}

           <AnimatePresence mode="wait">
             {step === 1 && (
               <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={checkUserExists}>
                 <label className="block text-sm font-bold text-slate-900 mb-3">Mobile Number</label>
                 
                 <div className="flex items-center bg-[#F8F9FA] rounded-xl border border-transparent focus-within:border-green-600 transition-colors p-1 pr-3">
                   {/* Country Code Dropdown */}
                   <div className="flex items-center px-3 py-3 gap-2 border-r border-slate-200 shrink-0">
                     <span className="text-xl leading-none">🇮🇳</span>
                     <span className="font-bold text-slate-900 text-[15px]">+91</span>
                     <ChevronDown size={16} className="text-slate-400" />
                   </div>
                   
                   {/* Input Area */}
                   <div className="flex-grow flex items-center pl-4 relative">
                      <Phone size={18} className="text-slate-400 absolute left-2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter your mobile number"
                        className="w-full bg-transparent outline-none py-2 pl-7 text-[15px] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                        maxLength={10}
                        required
                      />
                   </div>
                 </div>

                 <button
                   type="submit"
                   disabled={loading || phone.length < 10}
                   className={`w-full text-white font-bold py-[14px] rounded-[14px] transition-colors shadow-sm flex items-center justify-center gap-2 mt-6 text-[15px] ${phone.length >= 10 && !loading ? 'bg-green-600 hover:bg-green-700' : 'bg-green-400'}`}
                 >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : "Continue"}
                   {!loading && <ArrowRight size={20} />}
                 </button>
               </motion.form>
             )}

             {step === 2 && (
               <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={loginWithPin}>
                 <label className="block text-sm font-bold text-slate-900 mb-3">Enter PIN</label>
                 
                 <div className="flex items-center bg-[#F8F9FA] rounded-xl border border-transparent focus-within:border-green-600 transition-colors p-1 pr-3">
                   <div className="flex-grow flex items-center pl-4 py-3 relative">
                      <Lock size={18} className="text-slate-400 absolute left-4" />
                      <input
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full bg-transparent outline-none pl-9 text-[18px] font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
                        maxLength={4}
                        required
                        autoFocus
                      />
                   </div>
                 </div>
                 
                 <p className="text-xs text-slate-500 mt-4 text-center">
                   Logging in as +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-green-600 font-bold hover:underline">Change</button>
                 </p>
                 
                 <button
                   type="submit"
                   disabled={loading || pin.length < 4}
                   className={`w-full text-white font-bold py-[16px] rounded-[14px] transition-colors shadow-sm flex items-center justify-center gap-2 mt-6 text-[15px] ${pin.length >= 4 && !loading ? 'bg-green-600 hover:bg-green-700' : 'bg-green-400'}`}
                 >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : "Secure Login"}
                 </button>
               </motion.form>
             )}

             {step === 3 && (
               <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={registerWithPin} className="flex flex-col gap-4">
                 <div>
                   <label className="block text-sm font-bold text-slate-900 mb-2">Create a 4-Digit PIN</label>
                   <div className="flex items-center bg-[#F8F9FA] rounded-xl border border-transparent focus-within:border-green-600 transition-colors p-1 pr-3">
                     <div className="flex-grow flex items-center pl-4 py-2 relative">
                        <KeyRound size={18} className="text-slate-400 absolute left-4" />
                        <input
                          type="password"
                          inputMode="numeric"
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full bg-transparent outline-none pl-9 text-[18px] font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
                          maxLength={4}
                          required
                          autoFocus
                        />
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-bold text-slate-900 mb-2">Confirm PIN</label>
                   <div className="flex items-center bg-[#F8F9FA] rounded-xl border border-transparent focus-within:border-green-600 transition-colors p-1 pr-3">
                     <div className="flex-grow flex items-center pl-4 py-2 relative">
                        <ShieldCheck size={18} className="text-slate-400 absolute left-4" />
                        <input
                          type="password"
                          inputMode="numeric"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full bg-transparent outline-none pl-9 text-[18px] font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal"
                          maxLength={4}
                          required
                        />
                     </div>
                   </div>
                 </div>
                 
                 <p className="text-xs text-slate-500 mt-2 text-center">
                   Registering +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-green-600 font-bold hover:underline">Change</button>
                 </p>
                 
                 <button
                   type="submit"
                   disabled={loading || pin.length < 4 || confirmPin.length < 4}
                   className={`w-full text-white font-bold py-[16px] rounded-[14px] transition-colors shadow-sm flex items-center justify-center gap-2 mt-4 text-[15px] ${(pin.length >= 4 && confirmPin.length >= 4) && !loading ? 'bg-green-600 hover:bg-green-700' : 'bg-green-400'}`}
                 >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : "Create Account & Login"}
                   {!loading && <UserPlus size={18} />}
                 </button>
               </motion.form>
             )}
           </AnimatePresence>
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
