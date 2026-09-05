"use client";

import { useAuth } from "@/hooks/useAuth";
import { Tag, Plus, Megaphone, CheckCircle2, ChevronRight, XCircle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function OffersPage() {
  useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [title, setTitle] = useState("Flat 20% OFF");
  const [discount, setDiscount] = useState("20");
  const [minOrder, setMinOrder] = useState("199");
  const [maxDiscount, setMaxDiscount] = useState("50");

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState("Monsoon Special 15% OFF");
  const [campaignDesc, setCampaignDesc] = useState("Run a 'Monsoon Special' 15% discount.");
  const [campaignStartTime, setCampaignStartTime] = useState("");
  const [campaignEndTime, setCampaignEndTime] = useState("");

  const fetcher = (url: string) => api.get(url).then(res => res.data);
  const { data: stallRes, mutate } = useSWR('/stalls/merchant/my-stall', fetcher);
  const { data: campaigns = [], mutate: mutateCampaigns } = useSWR('/stalls/merchant/campaigns', fetcher);

  const stall = stallRes;
  let offers = stall?.offers || [];
  
  if (stall && offers.length === 0 && stall.active_offer_title) {
    offers = [{
      id: "legacy_offer",
      title: stall.active_offer_title,
      discountPercentage: stall.active_offer_discount,
      minOrderValue: stall.active_offer_min,
      maxDiscount: stall.active_offer_max,
      isActive: stall.active_offer_is_active
    }];
  }
  
  const handleToggleOffer = async (offerId: string, turnOn: boolean) => {
    if (!stall) return;
    try {
      const updatedOffers = offers.map((o: any) => o.id === offerId ? { ...o, isActive: turnOn } : o);
      await api.put('/stalls/merchant/offers', { offers: updatedOffers });
      mutate();
    } catch (err) {
      alert("Failed to update offer status.");
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!stall) return;
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const updatedOffers = offers.filter((o: any) => o.id !== offerId);
      await api.put('/stalls/merchant/offers', { offers: updatedOffers });
      mutate();
    } catch (err) {
      alert("Failed to delete offer.");
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newOffer = {
        id: editingOfferId || generateId(),
        title,
        discountPercentage: parseFloat(discount),
        minOrderValue: parseFloat(minOrder),
        maxDiscount: parseFloat(maxDiscount),
        isActive: true
      };

      let updatedOffers = [...offers];
      if (editingOfferId) {
        updatedOffers = updatedOffers.map(o => o.id === editingOfferId ? newOffer : o);
      } else {
        updatedOffers.push(newOffer);
      }

      await api.put('/stalls/merchant/offers', { offers: updatedOffers });
      await mutate();
      setIsModalOpen(false);
    } catch (err) {
      alert("Failed to save offer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCampaignRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/stalls/merchant/campaign', {
        title: campaignTitle,
        description: campaignDesc,
        startTime: campaignStartTime ? new Date(campaignStartTime).toISOString() : null,
        endTime: campaignEndTime ? new Date(campaignEndTime).toISOString() : null
      });
      alert("Campaign request sent to Admin successfully!");
      mutateCampaigns();
      setIsCampaignModalOpen(false);
    } catch (err) {
      alert("Failed to request campaign.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingOfferId(null);
    setTitle("");
    setDiscount("");
    setMinOrder("");
    setMaxDiscount("");
    setIsModalOpen(true);
  };

  const openEditModal = (offer: any) => {
    setEditingOfferId(offer.id);
    setTitle(offer.title);
    setDiscount(offer.discountPercentage?.toString() || "");
    setMinOrder(offer.minOrderValue?.toString() || "");
    setMaxDiscount(offer.maxDiscount?.toString() || "");
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] bg-slate-50 relative max-w-md mx-auto w-full overflow-hidden">
      {/* Premium Header */}
      <div className="pt-10 px-6 pb-6 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Offers</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Boost your sales</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-slate-900 text-white w-12 h-12 rounded-full shadow-[0_8px_20px_rgba(15,23,42,0.25)] flex items-center justify-center hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Segmented Control Tabs */}
      <div className="px-6 mt-6 mb-2 shrink-0">
        <div className="flex bg-slate-100/80 p-1.5 rounded-full border border-slate-200">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 text-sm font-extrabold rounded-full transition-all ${activeTab === 'active' ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Offers
          </button>
          <button 
            onClick={() => setActiveTab('recommended')}
            className={`flex-1 py-2.5 text-sm font-extrabold rounded-full transition-all ${activeTab === 'recommended' ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.05)]' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Campaigns
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32 w-full">
        {activeTab === 'active' ? (
          <>
            {!stall ? (
              <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 h-44 animate-pulse flex flex-col justify-between">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                  <div className="w-32 h-6 bg-slate-100 rounded-full"></div>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <div className="w-24 h-4 bg-slate-100 rounded-full"></div>
                  <div className="w-full h-10 bg-slate-100 rounded-2xl mt-2"></div>
                </div>
              </div>
            ) : offers.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100">
                  <Tag className="text-slate-300" size={32} />
                </div>
                <h3 className="font-extrabold text-slate-800 text-xl mb-2">No Active Offers</h3>
                <p className="text-[13px] text-slate-500 mb-8 font-medium max-w-[250px] leading-relaxed">Create discount campaigns to attract more customers and boost your daily sales.</p>
                <button 
                  onClick={openCreateModal}
                  className="bg-slate-900 text-white font-bold py-3.5 px-8 rounded-full shadow-[0_8px_20px_rgba(15,23,42,0.2)] w-full active:scale-95 transition-transform"
                >
                  Create First Offer
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {offers.map((offer: any) => (
                  <div key={offer.id} className={`bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border ${offer.isActive ? 'border-slate-50' : 'border-slate-200 opacity-80'} relative overflow-hidden transition-all group`}>
                    {offer.isActive && <div className="absolute -top-12 -right-12 w-40 h-40 bg-green-50 rounded-full -z-10 group-hover:scale-150 transition-transform duration-700"></div>}
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-3">
                        <div className={`${offer.isActive ? 'bg-slate-900 shadow-md' : 'bg-slate-300'} text-white p-2.5 rounded-2xl`}>
                          <Tag size={20} />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-lg">{offer.title}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDeleteOffer(offer.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                        <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${offer.isActive ? 'text-green-700 bg-green-50 border-green-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                          {offer.isActive ? <><CheckCircle2 size={12} /> LIVE</> : 'PAUSED'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                      <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                        Flat <span className="font-bold text-slate-900">{offer.discountPercentage}% off</span> on orders above <span className="font-bold text-slate-900">&#8377;{offer.minOrderValue}</span>. Max discount <span className="font-bold text-slate-900">&#8377;{offer.maxDiscount}</span>.
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button onClick={() => openEditModal(offer)} className="text-sm font-extrabold text-slate-900 flex items-center gap-1 hover:text-accent transition-colors">
                        Edit Details <ChevronRight size={16} />
                      </button>
                      {offer.isActive ? (
                        <button 
                          onClick={() => handleToggleOffer(offer.id, false)}
                          className="text-slate-700 text-xs font-bold bg-white border border-slate-200 px-5 py-2.5 rounded-full flex items-center shadow-sm active:scale-95 transition-transform hover:bg-slate-50"
                        >
                          Pause Offer
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleToggleOffer(offer.id, true)}
                          className="text-white text-xs font-bold bg-slate-900 px-5 py-2.5 rounded-full flex items-center shadow-md active:scale-95 transition-transform hover:bg-slate-800"
                        >
                          Resume Offer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={openCreateModal}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-3xl border-2 border-dashed border-slate-300 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Add Another Offer
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] -z-10 transition-transform duration-500 group-hover:scale-110"></div>
              <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                <Megaphone size={28} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-xl mb-3">Custom Campaign</h3>
              <p className="text-[13px] text-slate-500 font-medium mb-6 leading-relaxed">
                Want to run a special festival campaign? Send a request to the admin to set up a custom promotional banner and offer.
              </p>
              <button onClick={() => setIsCampaignModalOpen(true)} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-full shadow-[0_8px_20px_rgba(15,23,42,0.2)] active:scale-95 transition-transform">
                Request Campaign
              </button>
            </div>

            {/* Render Campaign Requests */}
            {campaigns.length > 0 && (
              <div className="mt-6 space-y-4">
                <h4 className="font-extrabold text-slate-800 text-lg px-1">Campaign Requests</h4>
                {campaigns.map((camp: any) => (
                  <div key={camp.id} className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900 text-[15px]">{camp.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 truncate max-w-[200px]">{camp.description}</p>
                    </div>
                    <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${camp.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : camp.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {camp.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{editingOfferId ? 'Edit Offer' : 'Configure Offer'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveOffer} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Offer Title</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-slate-900 focus:bg-white outline-none transition-all" placeholder="e.g. Flat 20% OFF" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Discount %</label>
                    <input required type="number" min="1" max="100" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-slate-900 focus:bg-white outline-none transition-all" placeholder="20" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Max (&#8377;)</label>
                    <input required type="number" min="1" value={maxDiscount} onChange={e => setMaxDiscount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-slate-900 focus:bg-white outline-none transition-all" placeholder="50" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Min Order (&#8377;)</label>
                  <input required type="number" min="0" value={minOrder} onChange={e => setMinOrder(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-slate-900 focus:bg-white outline-none transition-all" placeholder="199" />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-full shadow-[0_8px_20px_rgba(15,23,42,0.2)] active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-70 hover:bg-slate-800"
                  >
                    {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Saving...</> : 'Save & Make Live'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isCampaignModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                <h3 className="text-xl font-extrabold text-slate-900">Request Campaign</h3>
                <button onClick={() => setIsCampaignModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1.5">
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={submitCampaignRequest} className="p-6 overflow-y-auto">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Campaign Title</label>
                    <input
                      type="text"
                      value={campaignTitle}
                      onChange={(e) => setCampaignTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      placeholder="e.g. Monsoon Special 15% OFF"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Campaign Details</label>
                    <textarea
                      value={campaignDesc}
                      onChange={(e) => setCampaignDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      placeholder="Enter details..."
                      required
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Start Date & Time</label>
                      <input
                        type="datetime-local"
                        value={campaignStartTime}
                        onChange={(e) => setCampaignStartTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">End Date & Time</label>
                      <input
                        type="datetime-local"
                        value={campaignEndTime}
                        onChange={(e) => setCampaignEndTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 bg-white">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white font-extrabold text-base py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <><Loader2 size={20} className="animate-spin" /> Submitting...</> : "Submit Request"}
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
