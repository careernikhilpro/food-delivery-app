"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { CheckCircle, XCircle } from "lucide-react";

export default function RiderCashoutsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCashouts = async () => {
    setLoading(true);
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.get("/admin/cashouts/pending"),
        api.get("/admin/cashouts/history")
      ]);
      setPending(pendingRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      toast.error("Failed to fetch cashouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashouts();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/admin/cashouts/approve/${id}`);
      toast.success("Cashout approved");
      fetchCashouts();
    } catch (err) {
      toast.error("Failed to approve cashout");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.post(`/admin/cashouts/reject/${id}`);
      toast.success("Cashout rejected");
      fetchCashouts();
    } catch (err) {
      toast.error("Failed to reject cashout");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "PPp");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-screen overflow-y-auto hide-scrollbar">
      <div>
        <h1 className="text-3xl font-heading font-black text-text-primary tracking-tight">Rider Cashouts</h1>
        <p className="text-text-muted mt-2 font-medium">Manage rider earnings withdrawal requests.</p>
      </div>

      <div className="flex gap-4 border-b border-border-subtle">
        <button
          className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Requests ({pending.length})
        </button>
        <button
          className={`pb-4 px-2 font-bold text-sm transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-text-muted hover:text-text-primary"
          }`}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : activeTab === "pending" ? (
        <div className="bg-white rounded-3xl border border-border-subtle overflow-hidden shadow-sm">
          {pending.length === 0 ? (
            <div className="p-12 text-center text-text-muted font-medium">No pending cashouts.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-bg-alt/50 border-b border-border-subtle">
                <tr>
                  <th className="p-4 font-bold text-text-primary text-sm uppercase tracking-wider text-xs">Rider</th>
                  <th className="p-4 font-bold text-text-primary text-sm uppercase tracking-wider text-xs">Amount</th>
                  <th className="p-4 font-bold text-text-primary text-sm uppercase tracking-wider text-xs">Request Date</th>
                  <th className="p-4 font-bold text-text-primary text-sm uppercase tracking-wider text-xs text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {pending.map((req: any) => (
                  <tr key={req.id} className="hover:bg-bg-alt/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-text-primary">{req.rider_name}</div>
                      <div className="text-xs text-text-muted font-medium mt-0.5">{req.rider_phone}</div>
                    </td>
                    <td className="p-4 font-bold text-primary">₹{req.amount}</td>
                    <td className="p-4 text-sm font-medium text-text-muted">{formatDate(req.created_at)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-bold text-sm transition-colors"
                        >
                          <CheckCircle size={16} /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-border-subtle overflow-hidden shadow-sm">
          {history.length === 0 ? (
            <div className="p-12 text-center text-text-muted font-medium">No history found.</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-bg-alt/50 border-b border-border-subtle">
                <tr>
                  <th className="p-4 font-bold text-text-primary text-sm uppercase tracking-wider text-xs">Rider</th>
                  <th className="p-4 font-bold text-text-primary text-sm uppercase tracking-wider text-xs">Amount</th>
                  <th className="p-4 font-bold text-text-primary text-sm uppercase tracking-wider text-xs">Status</th>
                  <th className="p-4 font-bold text-text-primary text-sm uppercase tracking-wider text-xs">Updated At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {history.map((req: any) => (
                  <tr key={req.id} className="hover:bg-bg-alt/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-text-primary">{req.rider_name}</div>
                      <div className="text-xs text-text-muted font-medium mt-0.5">{req.rider_phone}</div>
                    </td>
                    <td className="p-4 font-bold text-text-primary">₹{req.amount}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        req.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-medium text-text-muted">{formatDate(req.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
