"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface CheckoutVisit {
  id: number;
  customer_phone: string;
  customer_name: string;
  cart_items: any[];
  cart_total: number;
  address: string;
  stall_id: string;
  updated_at: string;
  created_at: string;
}

export default function CheckoutVisitsPage() {
  const [visits, setVisits] = useState<CheckoutVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/checkout-visits');
      setVisits(res.data);
    } catch (error) {
      toast.error("Failed to fetch checkout visits");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  return (
    <div className="p-6 pb-20 lg:pb-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-text-primary">Checkout Visits</h1>
          <p className="text-sm text-text-muted mt-1">Live tracking of customers on the checkout page</p>
        </div>
        <button 
          onClick={fetchVisits}
          className="flex items-center gap-2 bg-white border border-border-subtle px-4 py-2 rounded-xl text-sm font-bold text-text-primary hover:bg-gray-50 transition-colors shadow-sm"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-border-subtle overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Loader2 size={32} className="animate-spin mb-4 text-accent" />
            <p className="font-medium">Loading visits...</p>
          </div>
        ) : visits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <p className="font-medium">No checkout visits found recently.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-border-subtle text-xs uppercase tracking-wider text-text-muted">
                  <th className="px-6 py-4 font-black">Time</th>
                  <th className="px-6 py-4 font-black">Customer</th>
                  <th className="px-6 py-4 font-black">Items</th>
                  <th className="px-6 py-4 font-black">Total</th>
                  <th className="px-6 py-4 font-black">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-sm">
                {visits.map((visit) => (
                  <tr key={visit.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-text-primary">
                        {new Date(visit.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-text-muted">
                        {new Date(visit.updated_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-text-primary">{visit.customer_name || 'Guest'}</div>
                      <div className="text-xs text-text-muted font-mono">{visit.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="space-y-1">
                        {visit.cart_items?.map((item: any, idx: number) => (
                          <div key={idx} className="text-xs">
                            <span className="font-bold text-text-primary">{item.quantity}x</span> {item.name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-text-primary">
                      ₹{visit.cart_total}
                    </td>
                    <td className="px-6 py-4 max-w-[200px] text-xs text-text-muted truncate" title={visit.address}>
                      {visit.address || <span className="italic">Not selected</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
