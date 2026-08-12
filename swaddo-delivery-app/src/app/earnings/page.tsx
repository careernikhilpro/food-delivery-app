"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, PackageX, Wallet, History, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import AppLoader from "@/components/AppLoader";

export default function Earnings() {
  useAuth();
  const [data, setData] = useState<any>(null);
  const [cashoutHistory, setCashoutHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const fetchData = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const [resEarnings, resHistory] = await Promise.all([
        api.get('/delivery/earnings'),
        api.get('/delivery/cashout/history')
      ]);
      
      let newEarningsData = resEarnings.data?.data || resEarnings.data;
      if (newEarningsData) {
        setData(newEarningsData);
        sessionStorage.setItem("earningsData", JSON.stringify(newEarningsData));
      }
      if (resHistory.data) {
        setCashoutHistory(resHistory.data);
      }
    } catch (err) {
      console.log("Failed to fetch earnings or history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedData = sessionStorage.getItem("earningsData");
    if (cachedData) {
      try {
        setData(JSON.parse(cachedData));
      } catch (e) {}
      fetchData(true); // Fetch in background
    } else {
      fetchData(false);
    }
  }, []);

  const handleCashout = async () => {
    if (!data?.availableCashout || data.availableCashout <= 0) return;
    setRequesting(true);
    try {
      const res = await api.post('/delivery/cashout/request');
      alert(res.data.message || "Cashout requested successfully. Processing takes 6-10 hours.");
      fetchData(true); // refresh data
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to request cashout.");
    } finally {
      setRequesting(false);
    }
  };

  const dailyBreakdown = data?.dailyBreakdown || Array(7).fill({ earnings: 0, dayName: '?' });
  const chartData = dailyBreakdown.map((d: any) => d.earnings);
  const maxEarnings = Math.max(...chartData, 1);
  const deliveries = data?.deliveryHistory || [];

  if (loading && !data) {
    return <AppLoader type="earnings" />;
  }

  return (
    <div className="px-5 pt-3 pb-24 max-w-md mx-auto min-h-screen bg-[#F8FAFC]">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-[24px] font-black tracking-tight text-slate-900 leading-none mt-1">Earnings</h1>
        <button 
          onClick={() => fetchData(false)}
          className={`p-2 rounded-full bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md active:scale-95 ${loading ? 'animate-spin text-[#10B981]' : 'text-slate-500 hover:text-[#10B981]'}`}
        >
          <RefreshCw size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Available Cashout Card */}
      <div className="bg-emerald-600 rounded-[20px] p-5 mb-4 text-white shadow-[0_8px_24px_rgba(16,185,129,0.3)] relative overflow-hidden">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Wallet size={120} />
        </div>
        <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest mb-1 relative z-10">Available to Cashout</p>
        <h2 className="text-4xl font-black tracking-tighter relative z-10">₹{data?.availableCashout || 0}</h2>
        
        <button
          onClick={handleCashout}
          disabled={!data?.availableCashout || data.availableCashout <= 0 || requesting}
          className="mt-4 w-full bg-white text-emerald-700 font-bold py-3 rounded-[12px] shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 relative z-10"
        >
          {requesting ? "Requesting..." : "Request Cashout"}
        </button>
        <p className="text-[9px] text-emerald-100/70 text-center mt-2 font-medium relative z-10">
          Cashout requests take 6-10 hours to process. Limit 1 per day.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border border-slate-100 rounded-tl-[24px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center transition-transform hover:-translate-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">This Week</p>
          <h2 className="text-3xl font-black tracking-tighter text-slate-800">₹{data?.weekEarnings || 0}</h2>
        </div>
        <div className="bg-white border border-slate-100 rounded-tl-[24px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center transition-transform hover:-translate-y-0.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">This Month</p>
          <h2 className="text-3xl font-black tracking-tighter text-[#10B981]">₹{data?.monthEarnings || 0}</h2>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-4 mb-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-[#10B981]/5 rounded-bl-full -z-0"></div>
        <h3 className="text-[13px] font-black tracking-tight text-slate-800 mb-2 relative z-10">Past 7 Days</h3>
        <div className="flex items-end justify-between h-28 gap-2 relative z-10 pt-4">
          {chartData.map((val: number, idx: number) => {
            const heightPct = (val / maxEarnings) * 100;
            const isToday = idx === chartData.length - 1;
            return (
              <div key={idx} className="flex flex-col items-center flex-1 gap-1.5 group h-full">
                <div className="w-full relative h-full flex flex-col justify-end items-center">
                  <span className={`text-[9px] font-black tracking-tighter mb-1 ${isToday ? 'text-[#10B981]' : 'text-slate-400'}`}>
                    {val > 0 ? `₹${val}` : ''}
                  </span>
                  <div 
                    className={`w-full max-w-[14px] rounded-t-[6px] transition-all duration-1000 ${isToday ? 'bg-[#10B981] shadow-[0_4px_12px_rgba(16,185,129,0.4)]' : 'bg-slate-200 group-hover:bg-slate-300'}`} 
                    style={{ height: `${Math.max(5, heightPct)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-[#10B981]' : 'text-slate-400'}`}>{dailyBreakdown[idx].dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cashout History */}
      {cashoutHistory.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1">
            <History size={16} className="text-slate-700" />
            <h3 className="text-[16px] font-black tracking-tight text-slate-800">Cashout History</h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            {cashoutHistory.map((history, i) => (
              <div key={history.id} className={`p-4 flex items-center justify-between ${i !== cashoutHistory.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {history.status === 'approved' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : history.status === 'rejected' ? (
                      <AlertTriangle size={14} className="text-red-500" />
                    ) : (
                      <Clock size={14} className="text-amber-500" />
                    )}
                    <span className="font-bold text-slate-800 text-[14px]">₹{history.amount}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {new Date(history.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  history.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                  history.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                  'bg-amber-50 text-amber-600'
                }`}>
                  {history.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Deliveries List */}
      <h3 className="text-[16px] font-black tracking-tight text-slate-800 mb-3 px-1">Recent Deliveries</h3>
      <div className="space-y-3">
        {deliveries.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-[20px] border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
            <PackageX size={48} strokeWidth={1.5} className="mx-auto mb-3 text-slate-300" />
            <p className="font-black text-[15px] text-slate-800">No deliveries yet</p>
            <p className="text-[12px] font-medium text-slate-500 mt-1">Complete an order to see earnings!</p>
          </div>
        ) : (
          deliveries.map((delivery: any) => (
            <div key={delivery.id} className="bg-white border border-slate-100 rounded-[16px] p-4 flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex justify-between items-start mb-2.5 pb-2.5 border-b border-slate-100">
                <div>
                  <h4 className="font-black text-slate-800 text-[15px]">{delivery.stall}</h4>
                  <p className="text-[11px] font-bold text-slate-400 mt-1 tracking-wide">{delivery.date} • {delivery.distance}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Your Payout</p>
                  <span className="font-black text-[#10B981] text-[22px] leading-none">₹{delivery.amount}</span>
                </div>
              </div>
              
              <div className="pt-1 space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span className="font-semibold text-slate-500">Pickup Pay</span>
                  <span className="font-bold text-slate-700">₹{delivery.breakdown?.pickup || 0}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="font-semibold text-slate-500">Drop Pay</span>
                  <span className="font-bold text-slate-700">₹{delivery.breakdown?.drop || 0}</span>
                </div>
                {delivery.breakdown?.return > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span className="font-semibold text-slate-500">Return Pay</span>
                    <span className="font-bold text-[#10B981]">₹{delivery.breakdown.return}</span>
                  </div>
                )}
              </div>

              {delivery.codAmount > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-[10px] px-3 py-2 flex justify-between items-center mt-3 shadow-inner">
                  <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wide">COD Collected</span>
                  <span className="text-[14px] font-black text-orange-600 tracking-tight">₹{delivery.codAmount}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
