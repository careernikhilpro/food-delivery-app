"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Lock, Shield, Loader2, ArrowRight, UserPlus, KeyRound, ShieldCheck } from "lucide-react";
import Cookies from "js-cookie";

export default function AdminLogin() {
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
      const res = await api.get(`/auth/check-user?identifier=${phone}&role=admin`);
      if (res.data.user_found && res.data.pin_set) {
        setStep(2); // Existing user with PIN -> Login
      } else {
        setStep(3); // New user OR existing user without PIN -> Register
      }
    } catch (err: any) {
      console.error("Check user error:", err);
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
      const res = await api.post("/auth/login-pin", { phone, pin, role: "admin" });
      const token = res.data.token;
      
      Cookies.set("swaddo_admin_token", token);
      Cookies.set("token", token);
      Cookies.set("role", "admin");
      router.push("/dashboard");
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
      const res = await api.post("/auth/register-pin", { phone, pin, role: "admin" });
      const token = res.data.token;
      
      Cookies.set("swaddo_admin_token", token);
      Cookies.set("token", token);
      Cookies.set("role", "admin");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-main relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
      
      <div className="w-full max-w-md bg-bg-alt rounded-3xl p-8 shadow-xl border border-border-subtle relative z-10">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-heading font-bold text-text-primary mb-2">
            {step === 1 ? "Admin Portal" : step === 2 ? "Welcome Back" : "Create Admin PIN"}
          </h1>
          <p className="text-text-muted text-sm">
            {step === 1 ? "Sign in to manage the Swaddo platform." : step === 2 ? "Enter your 4-digit PIN to login" : "Set a secure 4-digit PIN for your account"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-[#B82F12] p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={checkUserExists} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">Admin Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit number"
                className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 px-4 outline-none focus:border-primary transition-colors font-medium text-text-primary"
                maxLength={10}
              />
            </div>
            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className={`w-full text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 ${phone.length >= 10 && !loading ? 'bg-primary hover:bg-primary-hover' : 'bg-primary/50'}`}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Continue"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={loginWithPin} className="space-y-6">
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
                  className="w-full bg-bg-main border border-border-subtle rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-colors font-bold text-text-primary text-xl tracking-[0.5em]"
                  maxLength={4}
                  autoFocus
                />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              Logging in as +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-primary font-bold hover:underline">Change</button>
            </p>
            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className={`w-full text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 ${pin.length >= 4 && !loading ? 'bg-primary hover:bg-primary-hover' : 'bg-primary/50'}`}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Secure Login"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={registerWithPin} className="space-y-4">
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
                  className="w-full bg-bg-main border border-border-subtle rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary transition-colors font-bold text-text-primary text-xl tracking-[0.5em]"
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
                  className="w-full bg-bg-main border border-border-subtle rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary transition-colors font-bold text-text-primary text-xl tracking-[0.5em]"
                  maxLength={4}
                />
              </div>
            </div>
            <p className="text-xs text-text-muted mt-2 text-center">
              Registering +91 {phone}. <button type="button" onClick={() => { setStep(1); setPin(""); setConfirmPin(""); }} className="text-primary font-bold hover:underline">Change</button>
            </p>
            <button
              type="submit"
              disabled={loading || pin.length < 4 || confirmPin.length < 4}
              className={`w-full text-white font-bold py-3.5 mt-2 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 ${(pin.length >= 4 && confirmPin.length >= 4) && !loading ? 'bg-primary hover:bg-primary-hover' : 'bg-primary/50'}`}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Create Account & Login"}
              {!loading && <UserPlus size={18} />}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
