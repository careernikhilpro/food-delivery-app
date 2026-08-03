"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Users, Search, Phone, Mail, KeyRound, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/admin/customers");
      setCustomers(res.data);
    } catch (error) {
      console.log("Failed to fetch customers");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async (customerId: string) => {
    if (!confirm("Are you sure you want to reset this customer's PIN to '1234'?")) return;
    
    setResettingId(customerId);
    try {
      await api.post(`/admin/customers/${customerId}/reset-pin`, { newPin: '1234' });
      toast.success("PIN reset to 1234 successfully");
    } catch (error) {
      toast.error("Failed to reset PIN");
    } finally {
      setResettingId(null);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
    (c.phone?.includes(searchQuery) || '')
  );

  if (loading) return (
    <div className="p-8 flex justify-center items-center h-[80vh]">
      <Loader2 className="animate-spin text-primary w-12 h-12" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-text-primary">Customers</h1>
          <p className="text-text-muted mt-1 font-medium">Manage user accounts and reset credentials.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-bg-alt border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-primary transition-colors w-72"
            />
          </div>
        </div>
      </div>

      <div className="bg-bg-alt border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-main/50 border-b border-border-subtle text-xs font-bold text-text-muted uppercase tracking-wider">
                <th className="p-4 font-semibold">Customer Details</th>
                <th className="p-4 font-semibold">Contact Info</th>
                <th className="p-4 font-semibold text-center">Total Orders</th>
                <th className="p-4 font-semibold text-center">Joined Date</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">No customers found.</td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-bg-main/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 uppercase">
                          {customer.name ? customer.name.substring(0,2) : <Users size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{customer.name || 'Unknown'}</p>
                          <p className="text-xs text-text-muted">ID: #{customer.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-text-muted" /> {customer.phone}
                        </p>
                        {customer.email && (
                          <p className="text-xs text-text-muted flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" /> {customer.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {customer.total_orders || 0}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <p className="text-sm text-text-muted flex items-center justify-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleResetPin(customer.id)}
                        disabled={resettingId === customer.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        {resettingId === customer.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <KeyRound className="w-3.5 h-3.5" />
                        )}
                        Reset PIN
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
