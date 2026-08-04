"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2, Search, Filter, Eye, X, MapPin, Phone, User, Bike, CheckCircle2, AlertCircle, ShoppingBag, Store, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [assignRiderId, setAssignRiderId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [availableRiders, setAvailableRiders] = useState<any[]>([]);
  const [fetchingRiders, setFetchingRiders] = useState(false);

  useEffect(() => {
    fetchData();
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const ordersRes = await api.get("/admin/orders");
      setOrders(ordersRes.data || []);
    } catch (error: any) {
      console.log("Failed to fetch data", error);
      toast.error("Failed to load orders: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAvailable = async () => {
      if (!selectedOrder) {
        setAvailableRiders([]);
        return;
      }
      // Only fetch available riders if no rider is assigned yet
      if (!selectedOrder.rider) {
        setFetchingRiders(true);
        try {
          const res = await api.get(`/admin/orders/${selectedOrder.id}/available-riders`);
          setAvailableRiders(res.data);
        } catch (error) {
          console.error("Failed to fetch available riders", error);
        } finally {
          setFetchingRiders(false);
        }
      }
    };
    fetchAvailable();
  }, [selectedOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'out_for_delivery': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'payment_pending': return 'bg-gray-100 text-gray-600 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const handleAssignRider = async (orderId: string) => {
    if (!assignRiderId) return toast.error("Please select a rider");
    setAssigning(true);
    try {
      await api.post(`/admin/orders/${orderId}/assign`, { rider_id: assignRiderId });
      toast.success("Rider assigned successfully");
      fetchData();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status: 'preparing' });
      }
    } catch (err) {
      toast.error("Failed to assign rider");
    } finally {
      setAssigning(false);
      setAssignRiderId("");
    }
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
          <h1 className="text-3xl font-heading font-black text-text-primary">Live Orders</h1>
          <p className="text-text-muted mt-1 font-medium">Monitor and manage active platform orders.</p>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search Order ID..." 
              className="pl-10 pr-4 py-2.5 bg-bg-alt border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-bg-alt border border-border-subtle rounded-xl text-sm font-semibold text-text-primary hover:bg-bg-main transition-colors">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="bg-bg-alt/80 backdrop-blur-xl rounded-3xl shadow-sm border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-bg-main/50 border-b border-border-subtle text-xs font-bold text-text-muted uppercase tracking-wider">
                <th className="p-5">Order Info</th>
                <th className="p-5">Customer</th>
                <th className="p-5">Vendor</th>
                <th className="p-5">Status</th>
                <th className="p-5">Total</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-bg-main/30 transition-colors group">
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-text-primary">#{o.id}</span>
                      <span className="text-xs text-text-muted flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-text-primary">{o.customer_name || 'Guest'}</span>
                      <span className="text-xs text-text-muted">{o.customer_phone}</span>
                    </div>
                  </td>
                  <td className="p-5 font-medium text-text-primary">{o.stall_name}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1 ${getStatusColor(o.status)}`}>
                      {o.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-5 font-bold font-heading text-primary">₹{o.total_amount}</td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => setSelectedOrder(o)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors rounded-xl text-sm font-bold"
                    >
                      <Eye className="w-4 h-4" /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Slide-over */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-text-primary/20 backdrop-blur-sm z-40"
              onClick={() => setSelectedOrder(null)}
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-bg-alt border-l border-border-subtle shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6 border-b border-border-subtle sticky top-0 bg-bg-alt/90 backdrop-blur flex justify-between items-center z-10">
                <div>
                  <h2 className="text-xl font-heading font-black text-text-primary">Order #{selectedOrder.id}</h2>
                  <p className="text-sm text-text-muted mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="w-10 h-10 rounded-full bg-bg-main hover:bg-border-subtle flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-text-primary" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Status Block */}
                <div className="flex items-center justify-between p-4 bg-bg-main rounded-2xl border border-border-subtle">
                  <span className="font-semibold text-text-primary">Current Status</span>
                  <span className={`px-4 py-2 rounded-xl border text-sm font-bold uppercase tracking-wide ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Customer Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer Details
                  </h3>
                  <div className="bg-bg-main p-4 rounded-2xl border border-border-subtle space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Name</span>
                      <span className="font-semibold text-text-primary">{selectedOrder.customer_name || 'Guest'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Phone</span>
                      <span className="font-semibold text-text-primary flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedOrder.customer_phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Account Security</span>
                      {selectedOrder.customer_has_pin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold"><CheckCircle2 className="w-3 h-3"/> PIN Set</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold"><AlertCircle className="w-3 h-3"/> No PIN</span>
                      )}
                    </div>
                    <div className="flex justify-between items-start pt-3 border-t border-border-subtle">
                      <span className="text-text-muted shrink-0 mt-0.5"><MapPin className="w-4 h-4" /></span>
                      <span className="font-medium text-sm text-text-primary text-right pl-4">{selectedOrder.delivery_address || 'No address provided'}</span>
                    </div>
                  </div>
                </div>

                {/* Vendor Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <Store className="w-4 h-4" /> Vendor Details
                  </h3>
                  <div className="bg-bg-main p-4 rounded-2xl border border-border-subtle space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-text-muted">Stall Name</span>
                      <span className="font-semibold text-text-primary">{selectedOrder.stall_name}</span>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Ordered Items
                  </h3>
                  <div className="bg-bg-main rounded-2xl border border-border-subtle overflow-hidden">
                    {selectedOrder.items && selectedOrder.items.length > 0 && selectedOrder.items[0] !== null ? (
                      <ul className="divide-y divide-border-subtle">
                        {selectedOrder.items.map((item: any, idx: number) => {
                          if (!item || !item.id) return null;
                          return (
                          <li key={idx} className="p-4 flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-text-primary">
                                {item.name} {item.variant_name && <span className="text-primary text-sm bg-primary/10 px-2 py-0.5 rounded ml-2">{item.variant_name}</span>}
                              </p>
                              {item.addons && item.addons.length > 0 && (
                                <p className="text-xs text-text-muted mt-1">
                                  Addons: {item.addons.map((a: any) => a.name).join(', ')}
                                </p>
                              )}
                              <p className="text-xs text-text-muted mt-1">Qty: {item.quantity} × ₹{item.price_at_time}</p>
                            </div>
                            <span className="font-bold text-text-primary">₹{item.quantity * item.price_at_time}</span>
                          </li>
                        )})}
                      </ul>
                    ) : (
                      <p className="p-4 text-text-muted text-sm text-center border-b border-border-subtle">Item details not available for this old order.</p>
                    )}
                    
                    {/* Breakdown Section - Always Rendered */}
                    <div className="p-4 bg-bg-alt flex flex-col gap-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">Order Value</span>
                        <span className="font-bold text-text-primary">₹{selectedOrder.item_total || selectedOrder.total_amount}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">Delivery Charge</span>
                        <span className="font-bold text-text-primary">₹{selectedOrder.delivery_charge || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">GST</span>
                        <span className="font-bold text-text-primary">₹{selectedOrder.gst_amount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-text-muted font-medium">Commission Amount (22%)</span>
                        <span className="font-bold text-[#B82F12]">₹{selectedOrder.platform_fee || 0}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border-subtle flex justify-between items-center">
                        <span className="font-bold text-text-primary">Customer Paid</span>
                        <span className="font-black font-heading text-lg text-primary">₹{selectedOrder.total_amount}</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-primary/5 flex justify-between items-center border-t border-border-subtle">
                      <span className="font-bold text-primary text-sm uppercase tracking-wider">Merchant Payment</span>
                      <span className="font-black font-heading text-xl text-primary">₹{selectedOrder.restaurant_share || selectedOrder.item_total || selectedOrder.total_amount}</span>
                    </div>
                  </div>
                </div>

                {/* Rider Assignment */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-2">
                    <Bike className="w-4 h-4" /> Delivery Partner
                  </h3>
                  {selectedOrder.rider ? (
                    <div className="bg-bg-main p-4 rounded-2xl border border-border-subtle space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Assigned Rider</span>
                        <span className="font-semibold text-text-primary">{selectedOrder.rider.name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Rider Phone</span>
                        <span className="font-medium text-text-primary">{selectedOrder.rider.phone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted">Assignment Status</span>
                        <span className="text-sm font-bold uppercase text-primary">{selectedOrder.rider.status}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bg-main p-5 rounded-2xl border border-border-subtle">
                      <p className="text-sm text-text-muted mb-4">No rider assigned yet.</p>
                      <div className="flex gap-2">
                        <select 
                          className="flex-1 bg-bg-alt border border-border-subtle rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary"
                          value={assignRiderId}
                          onChange={(e) => setAssignRiderId(e.target.value)}
                          disabled={fetchingRiders}
                        >
                          <option value="">{fetchingRiders ? 'Fetching nearby riders...' : 'Select a nearby online rider...'}</option>
                          {availableRiders.map((r) => (
                            <option key={r.delivery_partner_id} value={r.delivery_partner_id}>
                              {r.name} - {r.distance !== null ? `${r.distance.toFixed(1)} km away` : 'Distance unknown'}
                            </option>
                          ))}
                        </select>
                        <button 
                          disabled={assigning || !assignRiderId || fetchingRiders}
                          onClick={() => handleAssignRider(selectedOrder.id)}
                          className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                          {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
                          Assign
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Spacer for bottom */}
                <div className="h-10" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
