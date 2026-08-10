"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Preferences } from '@capacitor/preferences';
import { api } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/firebase";
import { Phone, Lock, ArrowRight, Loader2, KeyRound, ShieldCheck, UserPlus } from "lucide-react";
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
      let token = localStorage.getItem('swaddo_delivery_token');
      if (!token && typeof document !== 'undefined') {
        const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
        if (match) token = match[2];
      }
      if (token && !token.startsWith('mock_')) {
        router.push('/home');
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
      const res = await api.get(`/auth/check-user?identifier=${phone}&role=delivery`);
      if (res.data.user_found && res.data.pin_set) {
        setStep(2); // Existing user with PIN -> Login
      } else {
        setStep(3); // New user OR existing user without PIN -> Register
      }
    } catch (err) {
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
      const res = await api.post("/auth/login-pin", { phone, pin, role: "delivery" });
      await handleSuccessfulAuth(res.data.token, res.data.user);
    } catch (err) {
      const errorMessage = err instanceof Error && 'response' in err ? (err as any).response?.data?.message : "Invalid PIN. Please try again.";
      setError(errorMessage || "Invalid PIN. Please try again.");
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
      const res = await api.post("/auth/register-pin", { phone, pin, role: "delivery" });
      await handleSuccessfulAuth(res.data.token, res.data.user);
    } catch (err) {
      const errorMessage = err instanceof Error && 'response' in err ? (err as any).response?.data?.message : "Registration failed. Please try again.";
      setError(errorMessage || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (token: string, user?: any) => {
    localStorage.setItem("swaddo_delivery_token", token);
    Preferences.set({ key: 'swaddo_delivery_token', value: token });
    
    if (user && user.id) {
        localStorage.setItem("riderId", user.id.toString());
        Preferences.set({ key: 'riderId', value: user.id.toString() });
    }
    
    document.cookie = `token=${token}; path=/; max-age=86400; SameSite=Lax`;
    document.cookie = `role=delivery; path=/; max-age=86400; SameSite=Lax`;
    
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
    
    router.push("/home");
  };

  return (
    <div className="fixed inset-0 flex justify-center bg-gradient-to-br from-[#10B981] to-[#064E3B] overflow-hidden">
      <div className="w-full max-w-[448px] h-full flex flex-col relative">
      
      {/* Top Banner Area */}
      <div className="pt-8 px-6 pb-12 relative flex flex-col justify-center items-center">
        <div className="flex flex-col items-center justify-center bg-white/15 rounded-[24px] w-24 h-24 mb-4 shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-white/20 backdrop-blur-md">
           <h1 className="text-3xl font-black text-white tracking-tighter leading-none mt-1">Swaddo</h1>
        </div>
        <h1 className="text-[28px] font-black text-white tracking-wider leading-none">SWADDO</h1>
        <p className="text-[10px] font-extrabold text-[#34D399] tracking-[0.2em] mt-2">DELIVERY PARTNER</p>
      </div>
      
      {/* Main White Card Overlap */}
      <div className="bg-white rounded-t-[36px] flex-grow shadow-[0_-10px_40px_rgba(0,0,0,0.1)] px-6 pt-8 flex flex-col justify-between -mt-6 z-10 relative">
        
        {/* Form Content */}
        <div>
           <h2 className="text-[26px] font-black text-slate-900 mb-1 tracking-tight">
              {step === 1 ? "Welcome Partner" : step === 2 ? "Welcome Back!" : "Create PIN"}
           </h2>
           <p className="text-[14px] font-medium text-slate-500 mb-8">
              {step === 1 ? "Sign in to start receiving and delivering orders" : step === 2 ? "Enter your 4-digit PIN to login securely" : "Set a secure 4-digit PIN for your account"}
           </p>
           
           {error && (
             <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 font-medium text-center border border-red-100">
               {error}
             </motion.div>
           )}

           <AnimatePresence mode="wait">
             {step === 1 && (
               <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={checkUserExists}>
                 <label className="block text-[13px] font-bold text-slate-900 mb-3 uppercase tracking-wider">Mobile Number</label>
                 
                 <div className="flex items-center bg-[#F8F9FA] rounded-2xl border border-transparent focus-within:border-[#10B981] transition-all duration-300 p-1.5 shadow-sm">
                   {/* Country Code */}
                   <div className="flex items-center px-4 py-3 gap-2 border-r border-slate-200 shrink-0">
                     <span className="text-xl leading-none">🇮🇳</span>
                     <span className="font-bold text-slate-900 text-[15px]">+91</span>
                   </div>
                   
                   {/* Input Area */}
                   <div className="flex-grow flex items-center pl-4 relative">
                      <Phone size={18} className="text-slate-400 absolute left-2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter your mobile number"
                        className="w-full bg-transparent outline-none py-2 pl-8 text-[16px] font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                        maxLength={10}
                        required
                      />
                   </div>
                 </div>

                 <button
                   type="submit"
                   disabled={loading || phone.length < 10}
                   className={`w-full text-white font-bold py-[16px] rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 mt-8 text-[16px] ${(phone.length >= 10) && !loading ? 'bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/25 hover:shadow-lg hover:-translate-y-0.5' : 'bg-[#6EE7B7] cursor-not-allowed'}`}
                 >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : "Continue"}
                   {!loading && <ArrowRight size={20} />}
                 </button>
               </motion.form>
             )}

             {step === 2 && (
               <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={loginWithPin}>
                 <label className="block text-[13px] font-bold text-slate-900 mb-3 uppercase tracking-wider">Enter PIN</label>
                 
                 <div className="flex items-center bg-[#F8F9FA] rounded-2xl border border-transparent focus-within:border-[#10B981] transition-all duration-300 p-1.5 shadow-sm">
                   <div className="flex-grow flex items-center pl-4 py-3 relative">
                      <Lock size={20} className="text-[#10B981] absolute left-5" />
                      <input
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full bg-transparent outline-none pl-12 text-[24px] font-black tracking-[0.7em] text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal"
                        maxLength={4}
                        required
                        autoFocus
                      />
                   </div>
                 </div>
                 
                 <p className="text-[13px] text-slate-500 mt-3 text-center font-medium">
                   Logging in as +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-[#10B981] font-bold hover:underline">Change</button>
                 </p>
                 
                 <button
                   type="submit"
                   disabled={loading || pin.length < 4}
                   className={`w-full text-white font-bold py-[16px] rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 mt-4 text-[16px] ${(pin.length >= 4) && !loading ? 'bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/25 hover:shadow-lg hover:-translate-y-0.5' : 'bg-[#6EE7B7] cursor-not-allowed'}`}
                 >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : "Secure Login"}
                 </button>
               </motion.form>
             )}

             {step === 3 && (
               <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={registerWithPin} className="flex flex-col gap-5">
                 <div>
                   <label className="block text-[13px] font-bold text-slate-900 mb-3 uppercase tracking-wider">Create a 4-Digit PIN</label>
                   <div className="flex items-center bg-[#F8F9FA] rounded-2xl border border-transparent focus-within:border-[#10B981] transition-all duration-300 p-1.5 shadow-sm">
                     <div className="flex-grow flex items-center pl-4 py-2 relative">
                        <KeyRound size={20} className="text-[#10B981] absolute left-5" />
                        <input
                          type="password"
                          inputMode="numeric"
                          value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full bg-transparent outline-none pl-12 text-[24px] font-black tracking-[0.7em] text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal"
                          maxLength={4}
                          required
                          autoFocus
                        />
                     </div>
                   </div>
                 </div>
                 
                 <div>
                   <label className="block text-[13px] font-bold text-slate-900 mb-3 uppercase tracking-wider">Confirm PIN</label>
                   <div className="flex items-center bg-[#F8F9FA] rounded-2xl border border-transparent focus-within:border-[#10B981] transition-all duration-300 p-1.5 shadow-sm">
                     <div className="flex-grow flex items-center pl-4 py-2 relative">
                        <ShieldCheck size={20} className="text-[#10B981] absolute left-5" />
                        <input
                          type="password"
                          inputMode="numeric"
                          value={confirmPin}
                          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full bg-transparent outline-none pl-12 text-[24px] font-black tracking-[0.7em] text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal"
                          maxLength={4}
                          required
                        />
                     </div>
                   </div>
                 </div>
                 
                 <p className="text-[13px] text-slate-500 mt-2 text-center font-medium">
                   Registering +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-[#10B981] font-bold hover:underline">Change</button>
                 </p>
                 
                 <button
                   type="submit"
                   disabled={loading || pin.length < 4 || confirmPin.length < 4}
                   className={`w-full text-white font-bold py-[16px] rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 mt-4 text-[16px] ${(pin.length >= 4 && confirmPin.length >= 4) && !loading ? 'bg-[#10B981] hover:bg-[#059669] shadow-[#10B981]/25 hover:shadow-lg hover:-translate-y-0.5' : 'bg-[#6EE7B7] cursor-not-allowed'}`}
                 >
                   {loading ? <Loader2 size={20} className="animate-spin" /> : "Create Account & Login"}
                   {!loading && <UserPlus size={18} />}
                 </button>
               </motion.form>
             )}
           </AnimatePresence>
        </div>

        {/* High Quality Illustration Area */}
        <div className="flex-grow flex items-end justify-center pt-2 mt-4 -mx-6 overflow-hidden">
           <div className="relative w-full flex justify-center items-end">
             {/* USER: Replace 'rider-illustration.png' in the public folder with your own image */}
             <img 
               src="/riderloginpic.png" 
               alt="SwaDDo Delivery Rider" 
               className="w-full max-w-[320px] h-auto object-contain object-bottom" 
               style={{ clipPath: 'inset(1% 1% 2% 1% round 16px)' }}
             />
           </div>
        </div>

        {/* Footer Text area */}
        <div className="text-center pb-6 pt-8 mt-auto">
           <p className="text-[11px] font-medium text-slate-400">
             By continuing, you agree to our <span className="text-[#10B981] font-bold">Terms of Service</span> and <span className="text-[#10B981] font-bold">Privacy Policy</span>
           </p>
        </div>

        </div>
      </div>
    </div>
  );
}
