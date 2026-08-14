"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Megaphone, Tag, Check, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Promotions() {
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "offers"
  
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [campRes, offRes] = await Promise.all([
        api.get("/admin/campaigns"),
        api.get("/admin/offers")
      ]);
      setCampaigns(campRes.data);
      setOffers(offRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateCampaignStatus = async (id: number, status: string) => {
    try {
      await api.patch(/admin/campaigns/ + id + /status, { status });
      toast.success(Campaign  + status);
      loadData();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl">
            <Megaphone className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Promotions & Campaigns</h1>
            <p className="text-slate-500">Manage merchant campaigns and active store offers</p>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 p-1 bg-white border border-slate-200 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("requests")}
          className={px-6 py-2.5 rounded-lg font-medium text-sm transition-all  + (
            activeTab === "requests" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          Campaign Requests
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className={px-6 py-2.5 rounded-lg font-medium text-sm transition-all  + (
            activeTab === "offers" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          Active Store Offers
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : activeTab === "requests" ? (
        <div className="grid gap-6">
          {campaigns.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No campaign requests found.</p>
            </div>
          ) : (
            campaigns.map((camp) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={camp.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded">
                      {camp.business_name} - {camp.stall_name}
                    </span>
                    <span className={	ext-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full  + (
                      camp.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      camp.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    )}>
                      {camp.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{camp.title}</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-2xl">{camp.description}</p>
                </div>
                
                {camp.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateCampaignStatus(camp.id, 'approved')}
                      className="bg-green-50 hover:bg-green-100 text-green-700 p-2.5 rounded-xl transition-colors"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => updateCampaignStatus(camp.id, 'rejected')}
                      className="bg-red-50 hover:bg-red-100 text-red-700 p-2.5 rounded-xl transition-colors"
                      title="Reject"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.length === 0 ? (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-slate-100">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No active store offers.</p>
            </div>
          ) : (
            offers.map((offer) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={offer.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden"
              >
                {!offer.active_offer_is_active && (
                  <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    PAUSED
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <Tag className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{offer.stall_name}</h3>
                    <p className="text-xs text-slate-500">{offer.business_name}</p>
                  </div>
                </div>
                
                <h4 className="text-lg font-extrabold text-slate-900 mb-2">{offer.active_offer_title}</h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-600">
                    <span className="font-bold text-slate-800">{offer.active_offer_discount}% OFF</span> up to <span className="font-bold text-slate-800">?{offer.active_offer_max}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Min Order: ?{offer.active_offer_min}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
