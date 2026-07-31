"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    phone: "",
    password: "",
    agree: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agree) {
      alert("Please agree to the Terms & Conditions");
      return;
    }
    setLoading(true);
    // Simulate sign up
    setTimeout(() => {
      setLoading(false);
      router.push("/verify-otp");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-x-hidden overflow-y-auto app-container">
      
      {/* Top Bar */}
      <div className="px-6 pt-10 pb-6 sticky top-0 bg-white z-20 flex flex-col items-center relative">
        <button 
          onClick={() => router.back()} 
          className="absolute left-6 top-10 text-text-green-600 p-1"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-text-green-600 mt-8">Create Merchant Account</h1>
        <p className="text-sm text-text-muted mt-1">Grow your business with Swaddo</p>
      </div>

      {/* Form Section */}
      <div className="px-6 pb-12 z-10">
        <form onSubmit={handleSignUp} className="space-y-5">
          
          <div>
            <label className="block text-sm font-semibold text-text-green-600 mb-2">Business Name</label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Your Restaurant Name"
              className="w-full bg-white border border-border-subtle rounded-xl py-3.5 px-4 outline-none focus:border-green-600 transition-colors text-text-green-600 placeholder:text-neutral-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-green-600 mb-2">Contact Name</label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              placeholder="John Doe"
              className="w-full bg-white border border-border-subtle rounded-xl py-3.5 px-4 outline-none focus:border-green-600 transition-colors text-text-green-600 placeholder:text-neutral-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-green-600 mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="merchant@example.com"
              className="w-full bg-white border border-border-subtle rounded-xl py-3.5 px-4 outline-none focus:border-green-600 transition-colors text-text-green-600 placeholder:text-neutral-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-green-600 mb-2">Phone number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full bg-white border border-border-subtle rounded-xl py-3.5 px-4 outline-none focus:border-green-600 transition-colors text-text-green-600 placeholder:text-neutral-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-green-600 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••••"
                className="w-full bg-white border border-border-subtle rounded-xl py-3.5 pl-4 pr-12 outline-none focus:border-green-600 transition-colors text-text-green-600 placeholder:text-neutral-300 tracking-wider"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-text-green-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 pb-4">
             <input
                type="checkbox"
                id="agree"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border-subtle text-green-600 focus:ring-green-600 accent-green-600"
             />
             <label htmlFor="agree" className="text-sm text-text-muted">
               I agree to the <Link href="/terms" className="text-green-600 hover:underline">Terms & Conditions</Link>
             </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-text-muted">
            Already have an account? <Link href="/login" className="text-green-600 font-bold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
