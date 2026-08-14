"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { CheckCircle, Clock } from "lucide-react";

export default function VendorPayoutsPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/vendor-payouts");
      // The backend will return all payouts. We split them here.
      const allPayouts = res.data || [];
      setPending(allPayouts.filter((p: any) => p.status === 'pending'));
      setHistory(allPayouts.filter((p: any) => p.status === 'settled'));
    } catch (err) {
      toast.error("Failed to fetch vendor payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/admin/vendor-payouts/${id}/approve`);
      toast.success("Payout approved and settled");
      fetchPayouts();
    } catch (err) {
      toast.error("Failed to approve payout");
    }
  };

  const renderTable = (data: any[], isPending: boolean) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500 uppercase tracking-wider">
              <th className="p-4">Date</th>
              <th className="p-4">Vendor / Stall</th>
              <th className="p-4">Orders</th>
              <th className="p-4">Gross</th>
              <th className="p-4">Commission</th>
              <th className="p-4">Net Payout</th>
              <th className="p-4 text-center">Status</th>
              {isPending && <th className="p-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={isPending ? 8 : 7} className="p-8 text-center text-gray-500">
                  No {isPending ? "pending" : "settled"} payouts found.
                </td>
              </tr>
            ) : (
              data.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 text-sm">
                  <td className="p-4 whitespace-nowrap font-medium">
                    {format(new Date(p.date), "dd MMM yyyy")}
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{p.stall_name}</div>
                  </td>
                  <td className="p-4">{p.orders_count}</td>
                  <td className="p-4 text-gray-500">₹{parseFloat(p.gross_amount).toFixed(2)}</td>
                  <td className="p-4 text-red-500">
                    -₹{parseFloat(p.commission_amount).toFixed(2)} ({p.commission_rate}%)
                  </td>
                  <td className="p-4 font-bold text-green-600">₹{parseFloat(p.net_amount).toFixed(2)}</td>
                  <td className="p-4 text-center">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Clock size={14} /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle size={14} /> Settled
                      </span>
                    )}
                  </td>
                  {isPending && (
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleApprove(p.id)}
                        className="bg-primary text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-primary/90 transition-colors"
                      >
                        Approve
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Vendor Payouts (Settlements)</h1>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`pb-4 px-6 text-sm font-medium border-b-2 ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Approvals ({pending.length})
        </button>
        <button
          className={`pb-4 px-6 text-sm font-medium border-b-2 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
          onClick={() => setActiveTab("history")}
        >
          Settled History
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-16 bg-gray-200 rounded w-full"></div>
          <div className="h-16 bg-gray-200 rounded w-full"></div>
        </div>
      ) : (
        <div>
          {activeTab === "pending" && renderTable(pending, true)}
          {activeTab === "history" && renderTable(history, false)}
        </div>
      )}
    </div>
  );
}
