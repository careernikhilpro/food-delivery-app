"use client";

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { SWRConfig } from "swr";
import Link from "next/link";
import { Preferences } from "@capacitor/preferences";
import { PushNotifications } from "@capacitor/push-notifications";
import { CheckCircle2, Clock, XCircle, Store, ChefHat, PackageCheck, AlertCircle, MapPin, Navigation, BellRing, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function DashboardContent() {
  useAuth();
  
  // SWR Data Fetching
  const fetcher = (url: string) => api.get(url).then(res => res.data);
  const { data: stallRes, mutate: mutateStall } = useSWR('/stalls/merchant/my-stall', fetcher);
  const { data: statsRes, mutate: mutateStats } = useSWR('/stalls/merchant/stats', fetcher);
  const { data: ordersRes, mutate: mutateOrders } = useSWR('/orders?limit=100', fetcher);

  // Removed isAcceptingOrders local state to avoid toggle flicker
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soundPermission') === 'granted';
    }
    return false;
  });
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  const [stallInfo, setStallInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'new'|'preparing'|'ready'|'out_for_delivery'|'completed'|'past'>('new');
  const [activeOrderDetails, setActiveOrderDetails] = useState<any>(null);
  const [isTransitionReady, setIsTransitionReady] = useState(false);
  
  // Handover PIN State
  const [handoverOrderId, setHandoverOrderId] = useState<string | null>(null);
  const [pickupPin, setPickupPin] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const alarmAudio = useRef<HTMLAudioElement | null>(null);

  const orders = ordersRes?.data || [];
  const stats = statsRes || { ordersToday: 0, revenueToday: 0, avgRating: 0 };
  const isInitializing = !ordersRes || !statsRes || !stallRes;

  // Removed hasInitializedToggle effect

  useEffect(() => {
    setIsTransitionReady(true);
  }, []);

  const activeTabCounts = useMemo(() => {
    const todayStr = new Date().toDateString();
    const counts = { new: 0, preparing: 0, ready: 0, out_for_delivery: 0, completed: 0, past: 0 };
    orders.forEach(o => {
      if (o.status === 'pending') counts.new++;
      else if (o.status === 'preparing') counts.preparing++;
      else if (['ready', 'assigned', 'heading_to_stall', 'at_stall'].includes(o.status)) counts.ready++;
      else if (['heading_to_customer', 'at_customer'].includes(o.status)) counts.out_for_delivery++;
      else if (['delivered', 'cancelled', 'declined'].includes(o.status)) {
        const orderDateStr = o.created_at ? new Date(o.created_at).toDateString() : o.time;
        if (orderDateStr === todayStr) counts.completed++;
        else counts.past++;
      }
    });
    return counts as Record<string, number>;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toDateString();
    return orders.filter(o => {
      if (activeTab === 'new') return o.status === 'pending';
      if (activeTab === 'preparing') return o.status === 'preparing';
      if (activeTab === 'ready') return ['ready', 'assigned', 'heading_to_stall', 'at_stall'].includes(o.status);
      if (activeTab === 'out_for_delivery') return ['heading_to_customer', 'at_customer'].includes(o.status);
      
      const isPastStatus = ['delivered', 'cancelled', 'declined'].includes(o.status);
      if (!isPastStatus) return false;
      
      const orderDateStr = o.created_at ? new Date(o.created_at).toDateString() : o.time;
      if (activeTab === 'completed') return orderDateStr === todayStr;
      if (activeTab === 'past') return orderDateStr !== todayStr;
      return false;
    });
  }, [orders, activeTab]);

  useEffect(() => {
    // Initialize audio
    alarmAudio.current = new Audio('/orderring.mp3');
    alarmAudio.current.volume = 1.0;
    alarmAudio.current.loop = true;

    let socket: any;
    let stallChannel: string = "";
    
    if (stallRes?.id) {
      const stallId = stallRes.id;
      stallChannel = `stall:${stallId}:orders`;
      
      socket = connectSocket();
      socket.off(stallChannel); // Remove any old listeners in strict mode
      socket.on("connect", () => {
        console.log(`Merchant socket connected to ${stallChannel}`);
      });

      socket.on(stallChannel, (update: any) => {
        // Update Orders Cache
        mutateOrders((currentData: any) => {
          if (!currentData || !currentData.data) return currentData;
          const prev = currentData.data;
          const existingIndex = prev.findIndex((o: any) => o.id == update.id || o.id == update.orderId);
          
          if (existingIndex >= 0) {
            const newOrders = [...prev];
            const oldOrder = newOrders[existingIndex];
            newOrders[existingIndex] = { ...oldOrder, status: update.status };
            
            // Add to revenue if it just got delivered
            if (oldOrder.status !== 'delivered' && update.status === 'delivered') {
               mutateStats((s: any) => {
                 if (!s) return s;
                 return { ...s, revenueToday: (s.revenueToday || 0) + (Number(oldOrder.total) || 0) };
               }, false);
            }
            
            // Fix closure bug by using a state updater function for incomingOrder
            setIncomingOrder((prevIncoming: any) => {
               if (prevIncoming && (prevIncoming.id === update.id || prevIncoming.id === update.orderId) && update.status !== 'pending') {
                  return null;
               }
               return prevIncoming;
            });
            return { ...currentData, data: newOrders };
          } else {
            if (update.status === 'pending') {
              setIncomingOrder(update);
              mutateStats((s: any) => {
                if (!s) return s;
                return { ...s, ordersToday: (s.ordersToday || 0) + 1 };
              }, false);
            }
            return { ...currentData, data: [update, ...prev] };
          }
        }, false);
      });
    }

    return () => {
      if (socket && stallChannel) {
        socket.off(stallChannel);
        disconnectSocket();
      }
    };
  }, [stallRes?.id, mutateOrders, mutateStats]);

  // Robust State-Driven Ringing Logic
  useEffect(() => {
    const hasPending = orders.some(o => o.status === 'pending');
    if (hasPending && soundEnabled && alarmAudio.current && alarmAudio.current.paused) {
      alarmAudio.current.play().catch(e => {
        console.log('Autoplay blocked:', e);
      });
    } else if (!hasPending && alarmAudio.current && !alarmAudio.current.paused) {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  }, [orders, soundEnabled]);

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string, pin?: string) => {
    if (incomingOrder && incomingOrder.id === orderId) {
      setIncomingOrder(null);
    }
    
    // OPTIMISTIC UPDATE: Instantly update the local state so the ring stops IMMEDIATELY
    mutateOrders((currentData: any) => {
      if (!currentData || !currentData.data) return currentData;
      return {
        ...currentData,
        data: currentData.data.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o)
      };
    }, false);
    
    // Call backend first if PIN is required to avoid false optimistic updates
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus, pin });
      
      // Clear native push notification when order is handled from inside the app
      if (typeof window !== 'undefined') {
        PushNotifications.removeAllDeliveredNotifications().catch(() => {});
      }
      
      // Update UI after success (trigger re-fetch to ensure sync)
      mutateOrders();
    } catch (err: any) {
      console.error('Failed to update status', err);
      alert(err.response?.data?.message || 'Failed to update order status');
      mutateOrders(); // Revert on failure
    }
    
    setHandoverOrderId(null);
    setPickupPin("");
    setActiveOrderDetails(null);
  }, [incomingOrder, mutateOrders]);

  // Handle Push Notification Actions (from URL or active Window)
  useEffect(() => {
    const action = searchParams.get('action');
    const actionOrderId = searchParams.get('orderId');
    if (action && actionOrderId && !isInitializing) {
      const status = action === 'accept' ? 'preparing' : 'cancelled';
      updateOrderStatus(actionOrderId, status).finally(() => {
        router.replace('/');
      });
    }
  }, [searchParams, isInitializing, updateOrderStatus, router]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
        const { action, payload } = event.data;
        if (payload?.orderId) {
          const status = action === 'accept' ? 'preparing' : 'cancelled';
          updateOrderStatus(payload.orderId, status);
        }
      }
    };
    if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    return () => {
      if (typeof navigator !== 'undefined' && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [updateOrderStatus]);

    // Auto-Accept Native Check (from CapacitorStorage)
    useEffect(() => {
      if (isInitializing) return;
      const checkNativeAutoAccept = async () => {
        try {
          const { value } = await Preferences.get({ key: 'auto_accept_order' });
          if (value === 'true') {
            // Auto accept the first pending order if it exists
            const pendingOrders = orders.filter((o: any) => o.status === 'pending');
            if (pendingOrders.length > 0) {
              await Preferences.remove({ key: 'auto_accept_order' });
              await updateOrderStatus(pendingOrders[0].id, 'preparing');
            } else if (incomingOrder) {
              await Preferences.remove({ key: 'auto_accept_order' });
              await updateOrderStatus(incomingOrder.id, 'preparing');
            }
          }
        } catch (e) {
          // ignore
        }
      };
      
      const interval = setInterval(checkNativeAutoAccept, 1500);
      return () => clearInterval(interval);
    }, [orders, incomingOrder, updateOrderStatus, isInitializing]);

  if (isInitializing) {
    return (
      <div className="flex flex-col min-h-screen pt-8 px-6 pb-24 max-w-md mx-auto bg-[#F8FAFC]">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-6"></div>
        <div className="flex gap-2 mb-6">
          <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] pt-4 max-w-md w-full mx-auto relative bg-[#F8FAFC] overflow-hidden">
      
      {/* Sound Permission Overlay */}
      <AnimatePresence>
        {!soundEnabled && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center p-6"
          >
            <div className="bg-white rounded-3xl p-8 text-center max-w-[300px] w-full shadow-2xl">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Enable Sound Notifications</h3>
              <p className="text-gray-500 mb-6 text-sm">Please tap below to allow order ringtones to play in the background when a new order arrives.</p>
              <button 
                onClick={() => {
                  setSoundEnabled(true);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('soundPermission', 'granted');
                  }
                  if (alarmAudio.current) {
                    alarmAudio.current.play().then(() => {
                      if (alarmAudio.current) {
                        alarmAudio.current.pause();
                        alarmAudio.current.currentTime = 0;
                      }
                    }).catch(e => console.log("Unlock failed:", e));
                  }
                }}
                className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
              >
                Allow Sound
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Incoming Order Modal */}
      <AnimatePresence>
        {incomingOrder && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-black/60 backdrop-blur-xl flex flex-col justify-center items-center p-6"
          >
            <div className="relative mb-8">
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-orange-500 rounded-full"
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="relative w-28 h-28 bg-gradient-to-tr from-orange-400 to-rose-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.6)] border-4 border-white"
              >
                <BellRing size={48} className="text-white" />
              </motion.div>
            </div>
            
            <h2 className="text-4xl font-heading font-black text-white mb-2 tracking-tight">New Order!</h2>
            <p className="text-white/90 mb-8 text-xl font-medium tracking-wide">Order #{incomingOrder.id}</p>
            
            <div className="bg-white/90 backdrop-blur-md rounded-3xl w-full p-6 shadow-2xl mb-8 border border-white/20">
              <h3 className="font-heading font-black text-slate-800 text-2xl mb-4">{incomingOrder.items}</h3>
              {incomingOrder.customer && (
                <div className="mb-4 text-left border-t border-slate-200/50 pt-4">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Customer Info</p>
                  <p className="text-slate-800 font-bold text-lg">{incomingOrder.customer}</p>
                  {incomingOrder.address && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{incomingOrder.address}</p>}
                  {incomingOrder.restaurantInstructions && (
                    <div className="mt-4 p-4 bg-orange-50/80 rounded-2xl border border-orange-100">
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Note from customer</p>
                      <p className="text-sm font-bold text-orange-900">{incomingOrder.restaurantInstructions}</p>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-200/50 pt-4 mt-2">
                <span className="text-slate-500 font-bold uppercase text-xs tracking-wider">Total Amount</span>
                <span className="text-3xl font-black text-emerald-600">₹{Number(incomingOrder.total || 0).toFixed(0)}</span>
              </div>
            </div>

            <div className="w-full flex gap-3">
              <button 
                onClick={() => updateOrderStatus(incomingOrder.id, 'cancelled')}
                className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold text-lg active:scale-95 transition-transform backdrop-blur-md border border-white/20"
              >
                Reject
              </button>
              <button 
                onClick={() => updateOrderStatus(incomingOrder.id, 'preparing')}
                className="flex-[2] bg-gradient-to-r from-emerald-400 to-teal-500 text-white py-4 rounded-2xl font-bold text-lg shadow-[0_8px_30px_rgba(16,185,129,0.4)] active:scale-95 transition-transform border border-emerald-300/50"
              >
                Accept Order
              </button>
            </div>
          </motion.div>
        )}

        {/* Order Details Modal (View Details) */}
        {activeOrderDetails && !incomingOrder && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-black/50 flex flex-col justify-end"
            onClick={() => setActiveOrderDetails(null)}
          >
            <div className="bg-white rounded-t-3xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto pb-24">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-text-primary">Order Details</h2>
                  <p className="text-text-muted text-sm font-medium">#{activeOrderDetails.id}</p>
                </div>
                <button 
                  onClick={() => setActiveOrderDetails(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-text-primary text-lg mb-2">Items</h3>
                  <div className="p-4 bg-bg-main rounded-xl border border-border-subtle">
                    <p className="font-medium text-text-primary">{activeOrderDetails.items}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-text-primary text-lg mb-2">Customer Info</h3>
                  <div className="p-4 bg-bg-main rounded-xl border border-border-subtle space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-text-primary">{activeOrderDetails.customer}</span>
                      {/* Phone hidden */}
                    </div>
                    {activeOrderDetails.address && (
                      <div className="flex items-start gap-2 text-sm text-text-muted">
                        <MapPin size={16} className="shrink-0 mt-0.5 text-accent" />
                        <span>{activeOrderDetails.address}</span>
                      </div>
                    )}
                    {activeOrderDetails.restaurantInstructions && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs font-bold text-yellow-800 uppercase mb-1">Note from customer</p>
                        <p className="text-sm font-medium text-yellow-900">{activeOrderDetails.restaurantInstructions}</p>
                      </div>
                    )}
                    {activeOrderDetails.cooking_request && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200 mt-2">
                        <p className="text-xs font-bold text-red-800 uppercase mb-1">Cooking Request</p>
                        <p className="text-sm font-medium text-red-900">{activeOrderDetails.cooking_request}</p>
                      </div>
                    )}
                    {activeOrderDetails.cutlery_needed && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-blue-900">Cutlery Requested</p>
                        <span className="text-xs font-extrabold text-blue-700 bg-blue-100 px-2 py-1 rounded">YES</span>
                      </div>
                    )}
                  </div>
                </div>

                {activeOrderDetails.deliveryPartner && activeOrderDetails.status !== 'delivered' && (
                  <div>
                    <h3 className="font-bold text-text-primary text-lg mb-2">Delivery Partner</h3>
                    <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                          <Navigation size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-text-primary">{activeOrderDetails.deliveryPartner.name}</p>
                          {activeOrderDetails.deliveryPartner.vehicle && (
                            <p className="text-xs text-text-muted mt-0.5">{activeOrderDetails.deliveryPartner.vehicle}</p>
                          )}
                        </div>
                      </div>
                      {activeOrderDetails.deliveryPartner.phone && activeOrderDetails.deliveryPartner.phone !== 'N/A' && (
                        <a href={`tel:${activeOrderDetails.deliveryPartner.phone}`} className="text-sm font-bold text-primary px-4 py-2 bg-white rounded-xl shadow-sm border border-border-subtle">
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center p-4 bg-bg-alt rounded-xl border border-border-subtle">
                  <span className="text-text-muted font-bold">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">₹{Number(activeOrderDetails.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Header Section */}
      <div className="flex-shrink-0 bg-[#F8FAFC] z-40 pb-2 px-6 mb-2 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 w-full">
        <div className="flex-1 min-w-0 pr-4">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight truncate">Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium -mt-0.5 truncate">Manage your live orders</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stallRes?.is_open ? 'Online' : 'Offline'}</span>
          <button 
            onClick={async () => {
              if (isInitializing) return;
              const newState = !stallRes?.is_open;
              mutateStall((prev: any) => ({ ...prev, is_open: newState }), { revalidate: false });
              try {
                if (stallRes && stallRes.id) {
                  await api.put(`/stalls/${stallRes.id}`, { is_open: newState });
                } else {
                  const vendorRes = await api.get('/stalls/merchant/my-stall');
                  if (vendorRes.data && vendorRes.data.id) {
                    await api.put(`/stalls/${vendorRes.data.id}`, { is_open: newState });
                  }
                }
              } catch (err) {
                console.error("Failed to update status", err);
                mutateStall((prev: any) => ({ ...prev, is_open: !newState }), { revalidate: false });
              }
            }}
            className={`w-14 h-8 rounded-full flex items-center p-1 ${isInitializing ? '' : 'transition-colors duration-300'} ${
              stallRes?.is_open ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-slate-300"
            }`}
          >
            <div 
              className={`w-6 h-6 rounded-full bg-white shadow-md transform ${isInitializing ? '' : 'transition-transform duration-300'}`} 
              style={{ transform: stallRes?.is_open ? "translateX(1.5rem)" : "translateX(0)", transitionDuration: isTransitionReady ? '300ms' : '0ms' }}
            />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link href="/insights" className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-rose-500 rounded-[24px] p-5 shadow-[0_8px_30px_rgba(244,63,94,0.3)] transition-transform active:scale-95 block border border-white/20">
          <div className="absolute -right-4 -bottom-4 opacity-20 transform rotate-12">
             <Store size={80} color="white" />
          </div>
          <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1 relative z-10 drop-shadow-sm">Orders Today</p>
          <p className="text-4xl font-heading font-black text-white relative z-10 drop-shadow-md">{stats.ordersToday || 0}</p>
        </Link>
        <Link href="/earnings" className="relative overflow-hidden bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[24px] p-5 shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-transform active:scale-95 block border border-white/20">
          <div className="absolute -right-4 -bottom-4 opacity-20 transform -rotate-12">
             <CheckCircle2 size={80} color="white" />
          </div>
          <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest mb-1 relative z-10 drop-shadow-sm">Revenue</p>
          <p className="text-4xl font-heading font-black text-white relative z-10 drop-shadow-md">
            <span className="text-2xl mr-1 opacity-80">₹</span>{(stats.revenueToday || 0).toFixed(0)}
          </p>
        </Link>
      </div>

      {/* Active Orders List */}
      <h2 className="text-xl font-heading font-black text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Store size={16} /></span>
        Live Queue
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 hide-scrollbar w-full">
        {(['new', 'preparing', 'ready', 'out_for_delivery', 'completed', 'past'] as const).map((tab) => {
          const isActive = activeTab === tab;
          const count = activeTabCounts[tab];
          
          const labels: Record<string, string> = { new: 'New', preparing: 'Preparing', ready: 'Ready / Waiting', out_for_delivery: 'Out for Delivery', completed: 'Completed', past: 'Past' };
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-shrink-0 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                isActive 
                  ? 'text-white shadow-[0_4px_15px_rgba(0,0,0,0.1)]' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isActive && (
                <motion.div layoutId="activeTab" className="absolute inset-0 bg-slate-900 rounded-full" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                 {labels[tab]} {count > 0 && <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>{count}</span>}
              </span>
            </button>
          );
        })}
      </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 px-6 pb-24 hide-scrollbar pt-2">
        {(() => {

          if (filteredOrders.length === 0) {
            return (
              <div className="text-center py-16 px-6 mt-4">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} className="text-slate-300" />
                </div>
                <p className="text-xl font-heading font-black text-slate-800">No orders here</p>
                <p className="text-sm text-slate-500 font-medium mt-2">Check back later or change tabs.</p>
              </div>
            );
          }

          const renderOrderCard = (order: any) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id} 
              className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col gap-4 relative overflow-hidden"
            >
              {/* Status color bar hint */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                order.status === 'pending' ? 'bg-orange-400' :
                order.status === 'preparing' ? 'bg-amber-400' :
                order.status === 'ready' ? 'bg-blue-400' :
                order.status === 'delivered' ? 'bg-emerald-400' : 'bg-slate-300'
              }`} />

              <div className="flex justify-between items-start pl-2">
                <div>
                  <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg mb-3">
                    Order #{order.id}
                  </span>
                  <h3 className="font-heading font-black text-slate-900 text-xl leading-tight pr-4">{order.items}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 font-bold uppercase tracking-wider">
                    {['delivered', 'cancelled', 'declined'].includes(order.status) && order.created_at
                      ? `${new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${order.time}`
                      : order.time}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900 text-2xl">₹{Number(order.total || 0).toFixed(0)}</p>
                </div>
              </div>

              {/* View Details Button */}
              <div className="pl-2">
                <button
                  onClick={() => setActiveOrderDetails(order)}
                  className="w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  View Details
                </button>
              </div>

              {/* Status Actions */}
              <div className="pt-3 border-t border-slate-100 flex gap-2 pl-2">
                {order.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'declined')}
                      className="flex-[1] py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold text-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                    >
                      Decline
                    </button>
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-orange-400 to-rose-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(244,63,94,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <ChefHat size={18} /> Accept
                    </button>
                  </>
                )}

                {order.status === 'preparing' && (
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-sm shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    <PackageCheck size={18} /> Ready for Pickup
                  </button>
                )}

                {['ready', 'assigned', 'heading_to_stall', 'at_stall'].includes(order.status) && (
                  <button 
                    onClick={() => setHandoverOrderId(order.id)}
                    className="w-full py-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 size={18} /> Handover to Rider
                  </button>
                )}
  
                {['heading_to_customer', 'at_customer'].includes(order.status) && (
                  <div className="w-full py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center gap-2">
                    <Navigation size={18} /> Out with Rider
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="w-full py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-sm flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> Delivered
                  </div>
                )}
              </div>
            </motion.div>
          );

          if (activeTab === 'past') {
            const grouped = filteredOrders.reduce((acc: any, o: any) => {
               const d = new Date(o.created_at || o.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
               if (!acc[d]) acc[d] = [];
               acc[d].push(o);
               return acc;
            }, {});

            return Object.entries(grouped).map(([date, dateOrders]: [string, any]) => {
              const isToday = date === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={date} className="mb-6 last:mb-0">
                   <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-1">{isToday ? 'Today' : date}</h3>
                   <div className="space-y-4">
                     {dateOrders.map(renderOrderCard)}
                   </div>
                </div>
              );
            });
          }

          return filteredOrders.map(renderOrderCard);
        })()}
      </div>

      {/* Handover PIN Modal */}
      <AnimatePresence>
        {handoverOrderId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setHandoverOrderId(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-inner border border-blue-100">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Verify Pickup</h3>
                <p className="text-slate-500 text-sm mt-2 mb-6 px-2 leading-relaxed">
                  Ask the Rider for the <strong className="text-slate-700">4-digit Delivery PIN</strong> to hand over Order #{handoverOrderId} safely.
                </p>
                
                <input 
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={pickupPin}
                  onChange={(e) => setPickupPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  className="w-full text-center text-2xl font-black tracking-[0.2em] py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                  autoFocus
                />
                
                <div className="w-full flex gap-3 mt-6">
                  <button 
                    onClick={() => setHandoverOrderId(null)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => updateOrderStatus(handoverOrderId, 'heading_to_customer', pickupPin)}
                    disabled={pickupPin.length !== 4}
                    className="flex-[2] py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_4px_15px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm Handover
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
