"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Bike, User, MapPin, CheckCircle2, XCircle, Search, Trash2, X, Landmark, FileText } from "lucide-react";

export default function Riders() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRider, setSelectedRider] = useState<any | null>(null);

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const res = await api.get("/admin/riders");
      setRiders(res.data);
    } catch (error) {
      console.log("Failed to fetch riders");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/riders/${id}/kyc`, { is_active: !currentStatus });
      setRiders(riders.map(r => r.id === id ? { ...r, is_active: !currentStatus } : r));
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    }
  };

  const handleDeleteRider = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete rider ${name}? This cannot be undone.`)) {
      return;
    }
    try {
      await api.delete(`/admin/riders/${id}`);
      setRiders(riders.filter(r => r.id !== id));
      alert(`Rider ${name} deleted successfully`);
    } catch (err) {
      console.error("Failed to delete rider", err);
      alert("Failed to delete rider");
    }
  };

  const handleUpdateLimit = async (id: number, currentLimit: number) => {
    const newLimit = window.prompt("Enter new float cash limit for this rider:", String(currentLimit || 2000));
    if (!newLimit) return;
    const numLimit = parseFloat(newLimit);
    if (isNaN(numLimit) || numLimit < 0) {
      alert("Invalid limit amount");
      return;
    }

    try {
      await api.patch(`/admin/riders/${id}/float-limit`, { float_limit: numLimit });
      setRiders(riders.map(r => r.id === id ? { ...r, float_limit: numLimit } : r));
      alert("Float limit updated successfully");
    } catch (err) {
      console.error("Failed to update float limit", err);
      alert("Failed to update float limit");
    }
  };

  const getStatusBadge = (isOnline: boolean) => {
    if (isOnline) {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold uppercase"><span className="w-2 h-2 rounded-full bg-gray-400"></span> Offline</span>;
  };

  if (loading) return (
    <div className="p-8 flex justify-center items-center h-[80vh]">
      <Loader2 className="animate-spin text-primary w-12 h-12" />
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-black text-text-primary">Delivery Partners</h1>
          <p className="text-text-muted mt-1 font-medium">Manage and track all riders on the platform.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search Riders..." 
            className="w-full pl-10 pr-4 py-2.5 bg-bg-alt border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {riders.map((r) => (
          <div key={r.id} className="bg-bg-alt/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-border-subtle hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-primary border border-orange-200 overflow-hidden">
                  {r.photo_url ? <img src={r.photo_url} alt={r.name} className="w-full h-full object-cover" /> : <Bike size={20} />}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-text-primary">{r.name}</h3>
                  <p className="text-sm text-text-muted font-medium">{r.phone}</p>
                </div>
              </div>
              {getStatusBadge(r.isOnline)}
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-sm text-text-muted flex items-center gap-2"><User size={16} /> ID Proof Status</span>
                <span className={`text-sm font-bold uppercase ${r.id_proof_status === 'verified' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {r.id_proof_status}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-sm text-text-muted flex items-center gap-2"><MapPin size={16} /> App Access</span>
                <button 
                  onClick={() => handleToggleActive(r.id, r.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${r.is_active ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${r.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-sm text-text-muted flex items-center gap-2"><MapPin size={16} /> Float Limit</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">
                    ₹{r.float_limit || 2000}
                  </span>
                  <button onClick={() => handleUpdateLimit(r.id, r.float_limit)} className="text-xs text-primary underline font-medium">Edit</button>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-sm text-text-muted flex items-center gap-2"><Bike size={16} /> Vehicle Details</span>
                <span className="text-sm font-semibold text-text-primary">
                  {r.vehicle_details || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-muted flex items-center gap-2"><MapPin size={16} /> Current Location</span>
                <span className="text-sm font-semibold text-text-primary">
                  {r.isOnline && r.lat && r.lng ? (
                    <a href={`https://maps.google.com/?q=${r.lat},${r.lng}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      View on Map
                    </a>
                  ) : (
                    <span className="text-text-muted">Unavailable</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setSelectedRider(r)} className="flex-1 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-bold transition-colors">
                View Profile
              </button>
              <button onClick={() => handleDeleteRider(r.id, r.name)} className="px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors" title="Delete Rider">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedRider && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-end z-50 transition-opacity">
          <div className="bg-bg-alt w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto">
            <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-heading font-black text-text-primary">Rider Details</h2>
                <p className="text-sm text-text-muted font-medium mt-1">{selectedRider.name}</p>
              </div>
              <button onClick={() => setSelectedRider(null)} className="p-2 text-text-muted hover:bg-bg-main rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              
              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={16} /> Personal Info
                </h3>
                <div className="bg-white rounded-2xl border border-border-subtle p-5 space-y-4">
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">Phone Number</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">Password (Raw)</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.raw_password || 'Not stored'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={16} /> KYC Documents
                </h3>
                <div className="bg-white rounded-2xl border border-border-subtle p-5 space-y-4">
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">Aadhar Number</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.aadhar_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">Driving License (DL)</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.dl_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">RC Number</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.rc_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Landmark size={16} /> Bank Details
                </h3>
                <div className="bg-white rounded-2xl border border-border-subtle p-5 space-y-4">
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">Bank Name</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.bank_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">Account Holder</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.account_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">Account Number</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.account_number || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold">IFSC Code</p>
                    <p className="text-sm font-medium text-text-primary mt-1">{selectedRider.ifsc_code || 'N/A'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
