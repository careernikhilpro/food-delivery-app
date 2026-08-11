"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Bike, User, MapPin, CheckCircle2, XCircle, Search } from "lucide-react";

export default function Riders() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center text-primary border border-orange-200">
                  <Bike size={20} />
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
                <span className="text-sm text-text-muted flex items-center gap-2"><MapPin size={16} /> Activity Status</span>
                <span className={`text-sm font-bold uppercase ${r.is_active ? 'text-primary' : 'text-red-500'}`}>
                  {r.is_active ? 'Active' : 'Inactive'}
                </span>
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

            <button className="w-full mt-6 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl font-bold transition-colors">
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
