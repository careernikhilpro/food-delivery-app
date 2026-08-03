"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowRight, Loader2, ShieldCheck, Lock, ChevronDown, UserPlus, KeyRound } from "lucide-react";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  
  // 1 = Enter Phone, 2 = Enter PIN (Login), 3 = Create PIN (Register)
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkUserExists = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await api.get(`/auth/check-user?identifier=${phone}`);
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
      const res = await api.post("/auth/login-pin", { phone, pin, role: "customer" });
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
      const res = await api.post("/auth/register-pin", { phone, pin, role: "customer" });
      await handleSuccessfulAuth(res.data.token, phone);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (token: string, userPhone: string) => {
    localStorage.setItem("swaddo_customer_token", token);
    localStorage.setItem("swaddo_customer_phone", userPhone);
    
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
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#FFF5EE] flex flex-col overflow-hidden font-body w-full pb-[calc(var(--safe-area-bottom)+70px)]">
      
      {/* Top Image & Branding Section */}
      <div className="w-full h-[45%] relative shrink-0">
        <div className="absolute top-12 left-6 z-20 flex flex-col gap-0 shrink-0">
          <div className="flex items-center gap-2 mb-2 ml-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#FF5722] rounded-bl-none -rotate-45 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-[28px] rotate-45 block leading-none font-body">S</span>
              </div>
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

      {/* Main Login Card */}
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 120 }}
        className="flex-1 w-full bg-white rounded-t-[40px] -mt-8 relative z-20 px-6 pt-10 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex flex-col"
      >
        <div className="max-w-md w-full mx-auto flex flex-col h-full justify-between">
          
          <div className="flex flex-col">
            <h2 className="text-[28px] font-heading font-black text-gray-900 mb-2 tracking-tight">
              {step === 1 ? "Welcome to Swaddo" : step === 2 ? "Welcome Back!" : "Create an Account"}
            </h2>
            <p className="text-gray-500 font-medium text-[15px] mb-8">
              {step === 1 ? "Enter your phone number to continue" : step === 2 ? "Enter your 4-digit PIN to login" : "Set a secure 4-digit PIN for your account"}
            </p>

            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 font-semibold text-center border border-red-100">
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={checkUserExists} className="flex flex-col gap-6">
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
                    {loading ? <Loader2 size={20} className="animate-spin" /> : "Continue"}
                    {!loading && <ArrowRight size={18} />}
                  </button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={loginWithPin} className="flex flex-col gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Enter PIN</label>
                    <div className="relative flex items-center">
                      <Lock className="absolute left-4 text-gray-400" size={20} />
                      <input
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full bg-[#F8F9FA] border border-gray-100 rounded-[18px] py-4 pl-12 pr-4 outline-none focus:ring-1 focus:ring-[#FF5722] focus:bg-white transition-colors font-bold text-gray-900 text-2xl tracking-[0.5em]"
                        maxLength={4}
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center font-medium">
                      Logging in as +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-[#FF5722] font-bold">Change</button>
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || pin.length < 4}
                    className={`w-full text-white font-bold py-4 rounded-[18px] transition-all flex items-center justify-center gap-2 active:scale-95 ${pin.length >= 4 && !loading ? 'bg-[#FF5722] shadow-[0_4px_14px_rgba(255,87,34,0.3)]' : 'bg-[#FFB09C] shadow-none'}`}
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : "Secure Login"}
                  </button>
                </motion.form>
              )}

              {step === 3 && (
                <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={registerWithPin} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Create a 4-Digit PIN</label>
                    <div className="relative flex items-center">
                      <KeyRound className="absolute left-4 text-gray-400" size={18} />
                      <input
                        type="password"
                        inputMode="numeric"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full bg-[#F8F9FA] border border-gray-100 rounded-[18px] py-3 pl-12 pr-4 outline-none focus:ring-1 focus:ring-[#FF5722] focus:bg-white transition-colors font-bold text-gray-900 text-xl tracking-[0.5em]"
                        maxLength={4}
                        autoFocus
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-900 mb-2">Confirm PIN</label>
                    <div className="relative flex items-center">
                      <ShieldCheck className="absolute left-4 text-gray-400" size={18} />
                      <input
                        type="password"
                        inputMode="numeric"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        className="w-full bg-[#F8F9FA] border border-gray-100 rounded-[18px] py-3 pl-12 pr-4 outline-none focus:ring-1 focus:ring-[#FF5722] focus:bg-white transition-colors font-bold text-gray-900 text-xl tracking-[0.5em]"
                        maxLength={4}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 text-center font-medium">
                    Registering +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-[#FF5722] font-bold">Change</button>
                  </p>
                  <button
                    type="submit"
                    disabled={loading || pin.length < 4 || confirmPin.length < 4}
                    className={`w-full text-white font-bold py-4 mt-2 rounded-[18px] transition-all flex items-center justify-center gap-2 active:scale-95 ${(pin.length >= 4 && confirmPin.length >= 4) && !loading ? 'bg-[#FF5722] shadow-[0_4px_14px_rgba(255,87,34,0.3)]' : 'bg-[#FFB09C] shadow-none'}`}
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : "Create Account & Login"}
                    {!loading && <UserPlus size={18} />}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col mt-auto pt-6">
            <p className="text-center text-[10px] text-gray-400 font-bold">
              By continuing, you agree to our <span className="text-[#FF5722] cursor-pointer hover:underline">Terms of Service</span> and <span className="text-[#FF5722] cursor-pointer hover:underline">Privacy Policy</span>
            </p>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
