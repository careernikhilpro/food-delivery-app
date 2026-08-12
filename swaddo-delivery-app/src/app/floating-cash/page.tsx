"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Landmark, AlertTriangle, CheckCircle2, UploadCloud, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import AppLoader from "@/components/AppLoader";

export default function FloatingCashPage() {
  useAuth();
  const router = useRouter();
  const [floatingCash, setFloatingCash] = useState(0);
  const [hasPendingDeposit, setHasPendingDeposit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [transactionId, setTransactionId] = useState("");
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/delivery/dashboard');
        if (res.data) {
          setFloatingCash(res.data.floatingCash || 0);
          setHasPendingDeposit(!!res.data.hasPendingDeposit);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardStats();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeposit = async () => {
    if (floatingCash <= 0) return;
    if (!transactionId || !screenshotBase64) {
      alert("Please enter Transaction ID and upload screenshot.");
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post('/delivery/deposit', {
        transactionId,
        screenshotBase64
      });
      alert("Deposit request submitted successfully! Awaiting Admin approval.");
      setHasPendingDeposit(true);
      router.push('/home');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit deposit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const limitReached = floatingCash >= 800;
  const progressPercent = Math.min((floatingCash / 800) * 100, 100);

  if (loading) {
    return <AppLoader type="floating-cash" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg-main">
      {/* Header */}
      <div className="bg-bg-alt sticky top-0 z-10 border-b border-border-subtle shadow-sm">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-bg-subtle active:bg-border-subtle transition-colors"
          >
            <ChevronLeft size={24} className="text-text-primary" />
          </button>
          <h1 className="text-lg font-heading font-bold text-text-primary">Floating Cash</h1>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full p-6 pb-24 overflow-y-auto">
        
        {/* Floating Cash Status */}
        <div className="bg-bg-alt rounded-2xl p-6 border border-border-subtle shadow-sm mb-6 relative overflow-hidden">
          {limitReached && (
            <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-xs font-bold text-center py-1 uppercase tracking-wider">
              Limit Exceeded
            </div>
          )}
          
          <div className={`mt-2 flex flex-col items-center ${limitReached ? 'text-red-600' : 'text-[#8B4513]'}`}>
            <span className="text-sm font-bold uppercase tracking-wider mb-1">Current Balance</span>
            <span className="text-5xl font-heading font-bold">₹{floatingCash}</span>
            <span className="text-sm mt-1 opacity-80">Limit: ₹800</span>
          </div>

          <div className="mt-6 w-full h-3 bg-border-subtle rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${limitReached ? 'bg-red-600' : 'bg-[#8B4513]'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {limitReached && (
            <div className="mt-4 flex items-start gap-2 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 leading-tight">
                You have reached your floating cash limit. You cannot go online or receive new order jobs until you deposit the cash.
              </p>
            </div>
          )}
        </div>

        {hasPendingDeposit ? (
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-sm flex flex-col items-center justify-center text-center">
            <Clock size={48} className="text-amber-500 mb-4" />
            <h2 className="text-xl font-bold text-amber-700 mb-2">Deposit Pending Approval</h2>
            <p className="text-sm text-amber-600/80">
              You have already submitted a deposit request. Please wait for the admin to review and approve it.
            </p>
          </div>
        ) : (
          <>
            {/* Bank Details */}
            <div className="bg-bg-alt rounded-2xl p-5 border border-border-subtle shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Landmark size={20} className="text-primary" />
                <h2 className="text-md font-heading font-bold text-text-primary">Company Bank Details</h2>
              </div>
              <p className="text-xs text-text-muted mb-4">
                Transfer your floating cash to the following bank account and upload proof below.
              </p>

              <div className="space-y-3 bg-bg-subtle p-4 rounded-xl border border-border-subtle/50">
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Bank Name</span>
                  <p className="font-medium text-text-primary">State Bank of India</p>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Account Name</span>
                  <p className="font-medium text-text-primary">SwaDDo Foods Pvt Ltd</p>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Account Number</span>
                  <p className="font-mono text-lg font-bold text-text-primary tracking-widest">34567890123</p>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">IFSC Code</span>
                  <p className="font-mono text-sm font-bold text-text-primary">SBIN0001234</p>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted uppercase tracking-wider font-bold">UPI ID</span>
                  <p className="font-medium text-primary">swaddo@sbi</p>
                </div>
              </div>
            </div>

            {/* Upload Proof */}
            <div className="bg-bg-alt rounded-2xl p-5 border border-border-subtle shadow-sm mb-6">
              <h2 className="text-md font-heading font-bold text-text-primary mb-4">Submit Deposit Proof</h2>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  UPI Transaction ID / UTR No.
                </label>
                <input 
                  type="text" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 123456789012"
                  className="w-full bg-bg-main border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Payment Screenshot
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer transition-colors ${
                    screenshotBase64 ? 'border-primary bg-primary/5' : 'border-border-main hover:bg-bg-subtle'
                  }`}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                  {screenshotBase64 ? (
                    <div className="flex flex-col items-center text-primary">
                      <CheckCircle2 size={32} className="mb-2" />
                      <span className="text-sm font-bold">Screenshot Attached</span>
                      <span className="text-xs mt-1 text-primary/70">Click to change</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-text-muted">
                      <UploadCloud size={32} className="mb-2 opacity-50" />
                      <span className="text-sm">Tap to upload screenshot</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Deposit Action */}
            <button
              onClick={handleDeposit}
              disabled={floatingCash <= 0 || submitting || !transactionId || !screenshotBase64}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-transform active:scale-[0.98] hover:bg-primary-hover disabled:opacity-50 disabled:active:scale-100"
            >
              {submitting ? "Processing..." : (
                <>
                  <CheckCircle2 size={20} />
                  Submit Request (₹{floatingCash})
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
