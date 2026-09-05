"use client";

import { useState, useEffect } from "react";
import { Bell, Send, CheckCircle2, Search, Users } from "lucide-react";
import { api } from "@/lib/api";

interface Customer {
  id: string | number;
  name: string;
  phone: string;
  role?: string;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("all");
  
  // Custom Selection State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Fetch customers when "specific" target type is selected
  useEffect(() => {
    if (targetType === "specific" && customers.length === 0) {
      fetchCustomers();
    }
  }, [targetType, customers.length]);

  const fetchCustomers = async () => {
    try {
      setIsLoadingCustomers(true);
      const res = await api.get("/admin/customers");
      // The API returns an array of customers
      if (res.data && Array.isArray(res.data)) {
        setCustomers(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch customers", err);
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    if (targetType === "specific" && selectedPhones.length === 0) {
      alert("Please select at least one user from the list.");
      return;
    }

    setIsSending(true);
    setSuccess(false);

    try {
      const payload: any = { title, message };
      
      if (targetType === "specific") {
        payload.phones = selectedPhones;
      } else {
        payload.segment = targetType; // 'all', 'customers', 'merchants', 'riders'
      }

      await api.post("/admin/notifications/send", payload);
      setSuccess(true);
      setTitle("");
      setMessage("");
      
      if (targetType === "specific") {
        setSelectedPhones([]);
        setSearchQuery("");
      }
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to send notification", err);
      alert("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  // Filter customers by search
  const filteredCustomers = customers.filter(c => 
    (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) || 
    (c.phone && c.phone.includes(searchQuery))
  );

  const toggleSelectAll = () => {
    if (selectedPhones.length === filteredCustomers.length && filteredCustomers.length > 0) {
      setSelectedPhones([]); // Deselect all
    } else {
      setSelectedPhones(filteredCustomers.map(c => c.phone).filter(Boolean)); // Select all filtered
    }
  };

  const togglePhoneSelection = (phone: string) => {
    if (!phone) return;
    setSelectedPhones(prev => 
      prev.includes(phone) 
        ? prev.filter(p => p !== phone)
        : [...prev, phone]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-gray-900">Push Notifications</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Bell size={24} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Broadcast Message</h2>
            <p className="text-gray-500 text-sm">Send a real-time notification to your users.</p>
          </div>
        </div>

        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <select 
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all bg-white"
            >
              <option value="all">All Users</option>
              <option value="customers">Customers Only</option>
              <option value="riders">Delivery Partners Only</option>
              <option value="merchants">Merchants Only</option>
              <option value="specific">Select Specific Customers</option>
            </select>
          </div>

          {targetType === "specific" && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-3 flex justify-between items-center">
                <span>Select Customers to Notify</span>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-bold">
                  {selectedPhones.length} Selected
                </span>
              </label>

              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by name or phone..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {isLoadingCustomers ? (
                <div className="flex justify-center items-center h-40 text-gray-400 text-sm">
                  Loading customers...
                </div>
              ) : (
                <div className="border border-gray-200 bg-white rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50/50">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={filteredCustomers.length > 0 && selectedPhones.length === filteredCustomers.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                      />
                      <span>Select All Result</span>
                    </label>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto p-1 divide-y divide-gray-50">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">No customers found.</div>
                    ) : (
                      filteredCustomers.map(customer => (
                        <label key={customer.id || customer.phone} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                          <input 
                            type="checkbox"
                            checked={selectedPhones.includes(customer.phone)}
                            onChange={() => togglePhoneSelection(customer.phone)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 shrink-0">
                            <Users size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{customer.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500 truncate">{customer.phone}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Title</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Flash Sale Alert!"
              className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Message</label>
            <textarea 
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              placeholder="e.g. Get 50% off on all items for the next hour!"
              className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
            ></textarea>
          </div>

          {success && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl border border-green-200">
              <CheckCircle2 size={20} />
              <span className="font-medium text-sm">Notification sent successfully!</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSending || !title.trim() || !message.trim() || (targetType === "specific" && selectedPhones.length === 0)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSending ? (
              <span className="animate-pulse">Sending...</span>
            ) : (
              <>
                <Send size={20} />
                {targetType === "specific" ? `Send to ${selectedPhones.length} User(s)` : "Broadcast Now"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
