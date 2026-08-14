"use client";

import { User, LogOut, ChevronDown, CheckCircle2, Clock, Landmark, FileText, IndianRupee, AlertCircle, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import AppLoader from "@/components/AppLoader";
import { Preferences } from '@capacitor/preferences';

export default function Profile() {
  useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('documents');

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', vehicle: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Bank Form States
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', accountNumber: '', ifscCode: '' });
  const [isSavingBank, setIsSavingBank] = useState(false);

  // Cashout History States
  const [cashoutHistory, setCashoutHistory] = useState<any[]>([]);
  const [cashoutLoading, setCashoutLoading] = useState(false);

  // KYC Form States
  const [kycForm, setKycForm] = useState({ aadharNumber: '', dlNumber: '', rcNumber: '' });
  const [isSavingKyc, setIsSavingKyc] = useState(false);

  const fetchProfile = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await api.get('/delivery/profile');
      let newData = res.data?.data || res.data;
      if (newData) {
        const newStr = JSON.stringify(newData);
        const oldStr = sessionStorage.getItem("profileData");
        if (newStr !== oldStr) {
          setProfile(newData);
          sessionStorage.setItem("profileData", newStr);
        }
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCashoutHistory = async () => {
    try {
      setCashoutLoading(true);
      const res = await api.get('/delivery/cashout/history');
      setCashoutHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch cashout history", err);
    } finally {
      setCashoutLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = sessionStorage.getItem("profileData");
    if (cachedData) {
      try {
        setProfile(JSON.parse(cachedData));
        setLoading(false);
      } catch (e) {}
      fetchProfile(true); // Fetch in background
    } else {
      fetchProfile(false);
    }
    fetchCashoutHistory();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await api.patch('/delivery/profile', editForm);
      await fetchProfile();
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Failed to save profile", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBankDetails = async () => {
    if (!bankForm.bankName || !bankForm.accountName || !bankForm.accountNumber || !bankForm.ifscCode) {
      alert("Please fill all bank details.");
      return;
    }
    try {
      setIsSavingBank(true);
      await api.patch('/delivery/profile', { bankDetails: bankForm });
      await fetchProfile();
    } catch (err) {
      console.error("Failed to save bank details", err);
      alert("Failed to save bank details.");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleSaveKyc = async () => {
    if (!kycForm.aadharNumber || !kycForm.dlNumber || !kycForm.rcNumber) {
      alert("Please fill all KYC details.");
      return;
    }
    try {
      setIsSavingKyc(true);
      await api.patch('/delivery/profile/kyc', kycForm);
      await fetchProfile();
    } catch (err: any) {
      console.error("Failed to save KYC details", err);
      alert(err.response?.data?.message || "Failed to save KYC details.");
    } finally {
      setIsSavingKyc(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      try {
        await api.post('/delivery/status', { status: 'offline' });
      } catch (err) {
        console.error("Failed to set offline status during logout", err);
      }
      localStorage.removeItem("swaddo_delivery_token");
      localStorage.removeItem("isOnline");
      localStorage.removeItem("riderId");
      Preferences.remove({ key: 'swaddo_delivery_token' });
      document.cookie = 'token=; Max-Age=-99999999; path=/';
      document.cookie = 'role=; Max-Age=-99999999; path=/';
      router.push("/login");
    }
  };

  const toggleTab = (tab: string) => {
    if (activeTab === tab) setActiveTab(null);
    else setActiveTab(tab);
  };

  if (loading) {
    return <AppLoader type="profile" />;
  }

  return (
    <div className="px-5 pt-8 pb-28 max-w-md mx-auto min-h-screen bg-[#F8FAFC]">
      <h1 className="text-[28px] font-black tracking-tight text-slate-900 leading-none mb-6">Account</h1>

      {/* Partner Info Card */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
        {!isEditingProfile ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981] shrink-0 border-[3px] border-[#10B981]/20">
              <User size={28} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">{profile?.name || "Delivery Partner"}</h2>
              <p className="text-[13px] font-bold text-slate-400 mt-0.5">{profile?.phone || "N/A"}</p>
              <div className="inline-flex items-center bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-[8px] mt-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{profile?.vehicle || "Bike"}</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setEditForm({ name: profile?.name || '', vehicle: profile?.vehicle || '' });
                setIsEditingProfile(true);
              }}
              className="absolute top-5 right-5 text-[#10B981] text-[12px] font-bold hover:text-[#059669] transition-colors uppercase tracking-wider"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Full Name</label>
              <input 
                type="text" 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Vehicle Details</label>
              <input 
                type="text" 
                value={editForm.vehicle} 
                onChange={(e) => setEditForm({...editForm, vehicle: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] outline-none transition-all"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 transition-colors"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-8">
        
        {/* Documents & KYC */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => toggleTab('documents')}
            className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-[#10B981]" strokeWidth={2.5} />
              <span className="font-black text-slate-800 text-[16px]">Documents & KYC</span>
            </div>
            <ChevronDown size={22} className={`text-slate-400 transition-transform duration-300 ${activeTab === 'documents' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'documents' && (
            <div className="p-5 pt-0 border-t border-slate-100 space-y-4 bg-slate-50/50">
              {!profile?.documents?.aadharNumber ? (
                <div className="mt-4 space-y-4">
                  <p className="text-[11px] text-red-500 font-bold mb-2">Note: You can only fill this once. Please double-check your document details.</p>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Aadhar Number</label>
                    <input type="text" value={kycForm.aadharNumber} onChange={e => setKycForm({...kycForm, aadharNumber: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-[#10B981] outline-none" placeholder="1234 5678 9012" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Driving License</label>
                    <input type="text" value={kycForm.dlNumber} onChange={e => setKycForm({...kycForm, dlNumber: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-[#10B981] outline-none" placeholder="DL-1420110012345" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Vehicle RC</label>
                    <input type="text" value={kycForm.rcNumber} onChange={e => setKycForm({...kycForm, rcNumber: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-[#10B981] outline-none" placeholder="MH 01 AB 1234" />
                  </div>
                  <button onClick={handleSaveKyc} disabled={isSavingKyc} className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-3.5 rounded-xl mt-2 transition-colors disabled:opacity-50">
                    {isSavingKyc ? "Saving..." : "Save KYC Details"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Aadhar Card</span>
                      <span className="text-[14px] font-black text-slate-700">{profile.documents.aadharNumber}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-md">
                      <CheckCircle2 size={14} strokeWidth={2.5} /> {profile.documents.aadharStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Driving License</span>
                      <span className="text-[14px] font-black text-slate-700">{profile.documents.dlNumber}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-md">
                      <CheckCircle2 size={14} strokeWidth={2.5} /> {profile.documents.licenseStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-0.5">Vehicle RC</span>
                      <span className="text-[14px] font-black text-slate-700">{profile.documents.rcNumber}</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2.5 py-1 rounded-md">
                      <CheckCircle2 size={14} strokeWidth={2.5} /> {profile.documents.rcStatus}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bank Details */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => toggleTab('bank')}
            className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Landmark size={20} className="text-indigo-500" strokeWidth={2.5} />
              <span className="font-black text-slate-800 text-[16px]">Bank Details</span>
            </div>
            <ChevronDown size={22} className={`text-slate-400 transition-transform duration-300 ${activeTab === 'bank' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'bank' && (
            <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50">
              {!profile?.bankDetails?.accountNumber ? (
                <div className="mt-4 space-y-4">
                  <p className="text-[11px] text-red-500 font-bold mb-2">Note: You can only fill this once. Please double-check details.</p>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Bank Name</label>
                    <input type="text" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-indigo-500 outline-none" placeholder="State Bank of India" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Account Holder Name</label>
                    <input type="text" value={bankForm.accountName} onChange={e => setBankForm({...bankForm, accountName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-indigo-500 outline-none" placeholder="Rahul Kumar" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Account Number</label>
                    <input type="text" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-indigo-500 outline-none" placeholder="XXXX XXXX 1234" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">IFSC Code</label>
                    <input type="text" value={bankForm.ifscCode} onChange={e => setBankForm({...bankForm, ifscCode: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-bold focus:border-indigo-500 outline-none" placeholder="SBIN000XXXX" />
                  </div>
                  <button onClick={handleSaveBankDetails} disabled={isSavingBank} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl mt-2 transition-colors disabled:opacity-50">
                    {isSavingBank ? "Saving..." : "Save Bank Details"}
                  </button>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="bg-white p-5 rounded-[16px] border border-slate-100 shadow-sm space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Bank Name</span>
                      <p className="font-black text-slate-800 text-[14px] mt-0.5">{profile.bankDetails.bankName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Account Name</span>
                      <p className="font-black text-slate-800 text-[14px] mt-0.5">{profile.bankDetails.accountName}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Account Number</span>
                      <p className="font-mono text-xl font-black text-slate-800 mt-0.5 tracking-tight">{profile.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">IFSC Code</span>
                      <p className="font-mono text-[14px] font-bold text-slate-600 mt-0.5">{profile.bankDetails.ifscCode}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mt-4 text-[11px] font-bold text-slate-500">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-orange-500" />
                    <p>To edit or update your bank details, please contact Support.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deposit History */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => toggleTab('deposits')}
            className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <IndianRupee size={20} className="text-[#10B981]" strokeWidth={2.5} />
              <span className="font-black text-slate-800 text-[16px]">Deposit History</span>
            </div>
            <ChevronDown size={22} className={`text-slate-400 transition-transform duration-300 ${activeTab === 'deposits' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'deposits' && (
            <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50">
              {profile?.depositHistory?.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {profile.depositHistory.map((dep: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-200 last:border-0">
                      <div>
                        <p className="font-black text-[15px] text-slate-800">₹{dep.amount}</p>
                        <p className="text-[11px] font-bold text-slate-400">{new Date(dep.date).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[10px] font-black text-[#10B981] uppercase tracking-wider bg-[#10B981]/10 px-2.5 py-1.5 rounded-md">
                        {dep.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] font-bold text-slate-400 mt-4 text-center py-4">No deposits found.</p>
              )}
            </div>
          )}
        </div>

        {/* Cashout History */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)] mt-4">
          <button 
            onClick={() => toggleTab('cashouts')}
            className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Landmark size={20} className="text-emerald-500" strokeWidth={2.5} />
              <span className="font-black text-slate-800 text-[16px]">Cashout History</span>
            </div>
            <ChevronDown size={22} className={`text-slate-400 transition-transform duration-300 ${activeTab === 'cashouts' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'cashouts' && (
            <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50">
              {cashoutLoading ? (
                <p className="text-[12px] font-bold text-slate-400 mt-4 text-center py-4">Loading...</p>
              ) : cashoutHistory.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {cashoutHistory.map((history: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-200 last:border-0">
                      <div>
                        <p className="font-black text-[15px] text-slate-800">₹{history.amount}</p>
                        <p className="text-[11px] font-bold text-slate-400">
                          {new Date(history.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-md ${
                        history.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                        history.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {history.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] font-bold text-slate-400 mt-4 text-center py-4">No cashout history found.</p>
              )}
            </div>
          )}
        </div>

        {/* Online Sessions */}
        <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <button 
            onClick={() => toggleTab('sessions')}
            className="w-full flex items-center justify-between p-5 active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-sky-500" strokeWidth={2.5} />
              <span className="font-black text-slate-800 text-[16px]">Online Sessions</span>
            </div>
            <ChevronDown size={22} className={`text-slate-400 transition-transform duration-300 ${activeTab === 'sessions' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeTab === 'sessions' && (
            <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50">
              {profile?.onlineSessions?.length > 0 ? (
                <div className="space-y-3 mt-4">
                  {profile.onlineSessions.map((session: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-200 last:border-0">
                      <p className="font-bold text-slate-700 text-[13px]">
                        {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="font-black text-sky-600 text-[14px]">
                        {Math.floor(session.online_minutes / 60)}h {session.online_minutes % 60}m
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] font-bold text-slate-400 mt-4 text-center py-4">No sessions recorded yet.</p>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="space-y-4 mb-6">
        {/* Help & Support Button */}
        <button 
          onClick={() => alert("Contacting Support... Support Number: 1800-123-4567")}
          className="w-full bg-white border border-slate-100 rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-between hover:-translate-y-0.5 active:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <HelpCircle size={22} className="text-orange-500" strokeWidth={2.5} />
            <span className="font-black text-slate-800 text-[16px]">Help & Support</span>
          </div>
        </button>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 border border-red-100 rounded-[20px] py-4 font-black text-[15px] flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition-all shadow-[0_2px_12px_rgba(239,68,68,0.1)]"
      >
        <LogOut size={20} strokeWidth={2.5} />
        Log Out
      </button>
    </div>
  );
}
