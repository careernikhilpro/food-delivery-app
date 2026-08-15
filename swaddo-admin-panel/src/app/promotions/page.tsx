"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Megaphone, Tag, Check, X, AlertCircle, Edit2 } from "lucide-react";
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

  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDiscount, setEditDiscount] = useState("");
  const [editMinOrder, setEditMinOrder] = useState("");
  const [editMaxDiscount, setEditMaxDiscount] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingOffer, setSavingOffer] = useState(false);

  const openEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setEditTitle(offer.active_offer_title || "");
    setEditDiscount(offer.active_offer_discount?.toString() || "");
    setEditMinOrder(offer.active_offer_min?.toString() || "");
    setEditMaxDiscount(offer.active_offer_max?.toString() || "");
    setEditIsActive(offer.active_offer_is_active);
  };

  const handleUpdateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    setSavingOffer(true);
    try {
      await api.put(`/admin/offers/${editingOffer.id}`, {
        title: editTitle,
        discount: parseFloat(editDiscount),
        minOrder: parseFloat(editMinOrder),
        maxDiscount: parseFloat(editMaxDiscount),
        isActive: editIsActive
      });
      toast.success("Offer updated successfully");
      setEditingOffer(null);
      loadData();
    } catch (err) {
      toast.error("Failed to update offer");
    } finally {
      setSavingOffer(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateCampaignStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/admin/campaigns/${id}/status`, { status });
      toast.success(`Campaign ${status}`);
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
          className={"px-6 py-2.5 rounded-lg font-medium text-sm transition-all " + (
            activeTab === "requests" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-50"
          )}
        >
          Campaign Requests
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className={"px-6 py-2.5 rounded-lg font-medium text-sm transition-all " + (
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
                    <span className={"text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full " + (
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
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group"
              >
                {!offer.active_offer_is_active && (
                  <div className="absolute top-0 right-0 bg-slate-100 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    PAUSED
                  </div>
                )}
                
                <button 
                  onClick={() => openEditOffer(offer)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100 bg-slate-50 p-1.5 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

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
                    <span className="font-bold text-slate-800">{offer.active_offer_discount}% OFF</span> up to <span className="font-bold text-slate-800">₹{offer.active_offer_max}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Min Order: ₹{offer.active_offer_min}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* EDIT OFFER MODAL */}
      <AnimatePresence>
        {editingOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Edit Store Offer</h3>
                  <p className="text-sm text-slate-500 mt-1">{editingOffer.stall_name}</p>
                </div>
                <button onClick={() => setEditingOffer(null)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateOffer} className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Offer Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    placeholder="e.g. Monsoon Special 20% OFF"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Discount (%)</label>
                    <input
                      type="number"
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Max Discount (₹)</label>
                    <input
                      type="number"
                      value={editMaxDiscount}
                      onChange={(e) => setEditMaxDiscount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Min Order Value (₹)</label>
                  <input
                    type="number"
                    value={editMinOrder}
                    onChange={(e) => setEditMinOrder(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium outline-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">
                    Offer is Active
                  </label>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <button
                    type="submit"
                    disabled={savingOffer}
                    className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {savingOffer ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
