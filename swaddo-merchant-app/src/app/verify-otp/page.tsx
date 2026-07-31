"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Mail, Smartphone } from "lucide-react";

export default function VerifyOTP() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(45);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Keep only the last character if multiple are pasted
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if filled
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;
    
    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
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
        <h1 className="text-2xl font-bold text-text-green-600 mt-12">Verify OTP</h1>
        <p className="text-sm text-text-muted mt-2">
          Enter the 6-digit code sent to<br/>
          <span className="text-green-600 font-semibold">+91 98765 43210</span>
        </p>
      </div>

      {/* Form Section */}
      <div className="px-6 flex-grow flex flex-col">
        <form onSubmit={handleVerify} className="flex-grow flex flex-col">
          
          <div className="flex justify-between gap-2 my-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 bg-white border border-border-subtle rounded-xl text-center text-xl font-semibold text-text-green-600 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-all"
                maxLength={1}
              />
            ))}
          </div>

          <div className="text-center mt-2">
            <p className="text-sm text-text-muted">
              Resend OTP in <span className="font-semibold">{timer > 9 ? `00:${timer}` : `00:0${timer}`}</span>
            </p>
          </div>

          {/* Illustration Space */}
          <div className="flex-grow flex items-center justify-center py-10 relative">
             {/* Security Illustration Placeholder */}
             <div className="relative w-48 h-48 flex items-center justify-center">
                <div className="absolute w-40 h-40 bg-green-600/10 rounded-full blur-xl"></div>
                
                <div className="relative z-10 bg-white border-2 border-green-600/20 rounded-2xl w-20 h-32 flex flex-col items-center justify-center shadow-sm">
                  <Smartphone className="text-green-600/50 absolute w-full h-full p-2 opacity-20" />
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg absolute -right-4 -bottom-2 z-20">
                    <ShieldCheck size={24} className="text-white" />
                  </div>
                  <div className="w-10 h-8 bg-white shadow-md border border-neutral-100 rounded-md flex items-center justify-center absolute -left-6 top-6 z-20">
                    <Mail size={16} className="text-green-600" />
                  </div>
                </div>
             </div>
          </div>

          <div className="pb-8 mt-auto">
            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
