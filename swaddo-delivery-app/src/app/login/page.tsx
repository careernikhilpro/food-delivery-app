"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { requestNotificationPermission } from "@/lib/firebase";
import { Phone, Lock, ArrowRight, Loader2, KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
      const res = await api.get(`/auth/check-user?identifier=${phone}&role=delivery`);
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
      const res = await api.post("/auth/login-pin", { phone, pin, role: "delivery" });
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
      const res = await api.post("/auth/register-pin", { phone, pin, role: "delivery" });
      await handleSuccessfulAuth(res.data.token, phone);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleSuccessfulAuth = async (token: string, userPhone: string) => {
    localStorage.setItem("swaddo_delivery_token", token);
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-main relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full bg-accent/10 blur-3xl" />

      <div className="w-full max-w-md bg-bg-alt rounded-3xl p-8 shadow-xl border border-border-subtle relative z-10">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 text-white font-heading font-bold text-3xl shadow-lg">
            S
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">Delivery Partner</h1>
          <p className="text-text-muted text-sm">
            {step === 1 ? "Sign in to start receiving orders." : step === 2 ? "Enter your 4-digit PIN" : "Create a 4-digit PIN for your account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-[#B82F12] p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={checkUserExists} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <span className="absolute left-11 top-1/2 -translate-y-1/2 text-text-primary font-medium">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your mobile number"
                    className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 pl-[85px] pr-4 outline-none focus:border-primary transition-colors font-medium text-text-primary"
                    maxLength={10}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Continue"}
                {!loading && <ArrowRight size={20} />}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={loginWithPin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Enter PIN</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-colors font-bold text-text-primary tracking-widest text-lg"
                    maxLength={4}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-text-muted mt-3 text-center">
                  Logging in as +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-primary font-bold hover:underline">Change</button>
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || pin.length < 4}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Secure Login"}
              </button>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={registerWithPin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Create a 4-Digit PIN</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-colors font-bold text-text-primary tracking-widest text-lg"
                    maxLength={4}
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Confirm PIN</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                  <input
                    type="password"
                    inputMode="numeric"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-colors font-bold text-text-primary tracking-widest text-lg"
                    maxLength={4}
                  />
                </div>
                <p className="text-xs text-text-muted mt-3 text-center">
                  Registering +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-primary font-bold hover:underline">Change</button>
                </p>
              </div>
              <button
                type="submit"
                disabled={loading || pin.length < 4 || confirmPin.length < 4}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : "Create Account & Login"}
                {!loading && <UserPlus size={18} />}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
