"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, CheckCircle2, XCircle, Search, Banknote, History, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FloatingCash() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [pending, setPending] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'pending') {
        const res = await api.get("/admin/floating-cash/pending");
        setPending(res.data);
      } else {
        const res = await api.get("/admin/floating-cash/history");
        setHistory(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch floating cash data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!window.confirm("Approve this deposit?")) return;
    try {
      await api.post(`/admin/floating-cash/approve/${id}`);
      setPending(pending.filter(p => p.id !== id));
      alert("Approved successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to approve");
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Reject this deposit?")) return;
    try {
      await api.post(`/admin/floating-cash/reject/${id}`);
      setPending(pending.filter(p => p.id !== id));
      alert("Rejected successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to reject");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-text-primary">Floating Cash</h1>
          <p className="text-text-muted mt-1 font-medium">Manage and verify rider deposits.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 border-b border-border-subtle pb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors",
            activeTab === 'pending' ? "bg-primary text-white" : "bg-bg-alt text-text-muted hover:bg-bg-main"
          )}
        >
          <Clock size={20} />
          Pending Approvals
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors",
            activeTab === 'history' ? "bg-primary text-white" : "bg-bg-alt text-text-muted hover:bg-bg-main"
          )}
        >
          <History size={20} />
          History
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center items-center h-[50vh]">
          <Loader2 className="animate-spin text-primary w-12 h-12" />
        </div>
      ) : activeTab === 'pending' ? (
        <div className="bg-bg-alt/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-border-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Rider</th>
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Amount</th>
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Transaction ID</th>
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Screenshot</th>
                  <th className="py-4 px-4 font-heading font-bold text-text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted font-medium">No pending requests</td>
                  </tr>
                ) : (
                  pending.map((req) => (
                    <tr key={req.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-main/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-text-primary">{req.rider_name || req.riderName || req.rider?.name || 'Unknown'}</div>
                        <div className="text-sm text-text-muted">{req.rider_phone || req.phone || req.rider?.phone || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-primary text-lg">₹{req.amount}</td>
                      <td className="py-4 px-4 font-medium text-text-muted">{req.transactionId || req.transaction_id}</td>
                      <td className="py-4 px-4">
                        {req.screenshot_url || req.screenshot || req.screenshotBase64 ? (
                          <img 
                            src={req.screenshot_url || (req.screenshot?.startsWith('data:') ? req.screenshot : `data:image/jpeg;base64,${req.screenshot || req.screenshotBase64}`)}
                            alt="Screenshot" 
                            className="w-16 h-16 object-cover rounded-lg border border-border-subtle hover:scale-150 transition-transform cursor-pointer"
                          />
                        ) : (
                          <span className="text-sm text-text-muted">No image</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleApprove(req.id)}
                            className="p-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-xl transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                          <button 
                            onClick={() => handleReject(req.id)}
                            className="p-2 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white rounded-xl transition-colors"
                            title="Reject"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-bg-alt/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-border-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Rider</th>
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Amount</th>
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Transaction ID</th>
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Screenshot</th>
                  <th className="py-4 px-4 font-heading font-bold text-text-muted">Status</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-muted font-medium">No history available</td>
                  </tr>
                ) : (
                  history.map((req) => (
                    <tr key={req.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-main/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-text-primary">{req.rider_name || req.riderName || req.rider?.name || 'Unknown'}</div>
                        <div className="text-sm text-text-muted">{req.rider_phone || req.phone || req.rider?.phone || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-text-primary text-lg">₹{req.amount}</td>
                      <td className="py-4 px-4 font-medium text-text-muted">{req.transactionId || req.transaction_id}</td>
                      <td className="py-4 px-4">
                        {req.screenshot_url || req.screenshot || req.screenshotBase64 ? (
                          <img 
                            src={req.screenshot_url || (req.screenshot?.startsWith('data:') ? req.screenshot : `data:image/jpeg;base64,${req.screenshot || req.screenshotBase64}`)}
                            alt="Screenshot" 
                            className="w-16 h-16 object-cover rounded-lg border border-border-subtle hover:scale-150 transition-transform cursor-pointer"
                          />
                        ) : (
                          <span className="text-sm text-text-muted">No image</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase",
                          req.status?.toLowerCase() === 'approved' ? "bg-green-100 text-green-700" :
                          req.status?.toLowerCase() === 'rejected' ? "bg-red-100 text-red-700" :
                          "bg-gray-100 text-gray-700"
                        )}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
