"use client";

import { useState, useEffect, useRef, Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Phone, CheckCircle, Store, User, Loader2, Home, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { App } from "@capacitor/app";
import { io, Socket } from "socket.io-client";
import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";
import { MarkerF } from '@react-google-maps/api';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

const libraries: any = ["geometry"];


const getStoreIcon = () => {
  const svg = `
    <svg width="40" height="44" viewBox="0 0 40 44" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="18" r="16" fill="#E8B159" stroke="white" stroke-width="2"/>
      <path d="M20 44 L14 30 L26 30 Z" fill="#E8B159"/>
      <svg x="10" y="8" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 21h18"></path><path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2-4h14l2 4"></path><line x1="5" y1="21" x2="5" y2="10"></line><line x1="19" y1="21" x2="19" y2="10"></line><path d="M9 21v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"></path>
      </svg>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getHomeIcon = () => {
  const svg = `
    <svg width="40" height="44" viewBox="0 0 40 44" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="18" r="16" fill="#2B2420" stroke="white" stroke-width="2"/>
      <path d="M20 44 L14 30 L26 30 Z" fill="#2B2420"/>
      <svg x="10" y="8" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const getBikeIcon = (rotation: number) => {
  const svg = `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="20" fill="white" stroke="#E2401C" stroke-width="2"/>
      <g transform="translate(12, 12) rotate(${rotation} 12 12)">
        <rect x="6" y="6" width="12" height="2" rx="1" fill="#E2401C" />
        <rect x="11" y="2" width="2" height="6" rx="1" fill="#333333" />
        <rect x="9" y="7" width="6" height="12" rx="3" fill="#E2401C" />
        <circle cx="12" cy="12" r="3.5" fill="#2B2420" />
        <rect x="11" y="17" width="2" height="5" rx="1" fill="#333333" />
      </g>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};



const AnimatedRiderMarker = ({ targetLocation }: { targetLocation: {lat: number, lng: number} }) => {
  const [currentLocation, setCurrentLocation] = useState(targetLocation);
  const [rotation, setRotation] = useState(0);
  const prevLocationRef = useRef(targetLocation);
  
  useEffect(() => {
    if (!targetLocation) return;
    
    const lat1 = prevLocationRef.current.lat * Math.PI / 180;
    const lng1 = prevLocationRef.current.lng * Math.PI / 180;
    const lat2 = targetLocation.lat * Math.PI / 180;
    const lng2 = targetLocation.lng * Math.PI / 180;
    
    const y = Math.sin(lng2 - lng1) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    
    if (Math.abs(targetLocation.lat - prevLocationRef.current.lat) > 0.00001 || 
        Math.abs(targetLocation.lng - prevLocationRef.current.lng) > 0.00001) {
      setRotation(bearing);
    }

    const startTime = performance.now();
    const duration = 1500;
    const startLoc = { ...prevLocationRef.current };
    
    let animationFrameId: number;
    
    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - (1 - progress) * (1 - progress);
      
      setCurrentLocation({
        lat: startLoc.lat + (targetLocation.lat - startLoc.lat) * ease,
        lng: startLoc.lng + (targetLocation.lng - startLoc.lng) * ease
      });
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        prevLocationRef.current = targetLocation;
      }
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [targetLocation]);

  return (
    <MarkerF 
      position={currentLocation} 
      options={{
        icon: {
          url: getBikeIcon(rotation),
          anchor: window.google ? new window.google.maps.Point(24, 24) : undefined,
        },
        zIndex: 100
      }}
    />
  );
};

const STAGES = [
  { id: 'heading_to_stall', title: 'Heading to Stall', action: 'Confirm Arrival at Stall' },
  { id: 'at_stall', title: 'At Stall', action: 'Confirm Pickup' },
  { id: 'heading_to_customer', title: 'Heading to Customer', action: 'Confirm Arrival at Customer' },
  { id: 'at_customer', title: 'At Customer', action: 'Confirm Delivery' },
];

function ActiveDeliveryContentInner({ mapboxToken }: { mapboxToken: string }) {
  useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderIdRaw = searchParams.get('id') as string;
  const orderId = orderIdRaw?.startsWith('job_') ? orderIdRaw.replace('job_', '') : orderIdRaw;
  
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [cashCollected, setCashCollected] = useState(false);
  const [deliveryPin, setDeliveryPin] = useState("");
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [newJob, setNewJob] = useState<any>(null);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const riderIdRef = useRef<string | null>(null);

  const stopRingtone = () => {
    const audio = document.getElementById('ringtone') as HTMLAudioElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const rejectJob = useCallback((jobIdToReject?: string) => {
    const targetJobId = jobIdToReject || newJob?.id;
    if (targetJobId) {
      const riderId = riderIdRef.current || localStorage.getItem('riderId');
      api.patch(`/delivery/assignments/${targetJobId}/reject`, { riderId }).catch(() => {});
    }
    stopRingtone();
    setNewJob(null);
  }, [newJob]);

  const acceptJob = useCallback(async (jobIdToAccept?: string) => {
    const targetJobId = jobIdToAccept || newJob?.id;
    if (!targetJobId) return;
    
    const riderId = riderIdRef.current || localStorage.getItem('riderId');
    console.log(`[ACCEPT_UI] CLICK ${targetJobId}`);
    console.log(`[ACCEPT_UI] riderId=${riderId}`);
    console.log(`[ACCEPT_UI] PATCH_START /delivery/assignments/${targetJobId}/accept`);
    
    setAcceptingJobId(targetJobId);
    stopRingtone();
    try {
      const apiPromise = api.patch(`/delivery/assignments/${targetJobId}/accept`, {
        riderId: riderId,
        lat: riderLocRef.current?.lat,
        lng: riderLocRef.current?.lng
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 15000)
      );
      
      const res: any = await Promise.race([apiPromise, timeoutPromise]);
      console.log(`[ACCEPT_UI] PATCH_RESPONSE status=${res?.status || 200}`);
      console.log(`[ACCEPT_UI] SUCCESS ${targetJobId}`);
      
      setNewJob(null);
      // Reload active-delivery to show both orders in bottom sheet or navigate home
      router.push('/home');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message;
      if (errMsg === 'ORDER_ALREADY_ACCEPTED' || errMsg === 'Order not found in DB') {
         setTimeout(() => alert("This order was already accepted by someone else or is no longer available."), 100);
      } else {
         setTimeout(() => alert(errMsg || "Failed to accept job."), 100);
      }
      setNewJob(null);
    } finally {
      setAcceptingJobId(null);
    }
  }, [newJob, router]);


  const [orderData, setOrderData] = useState<any>(null);
  const [riderLocation, setRiderLocation] = useState<{lat: number, lng: number} | null>(null);
  
  // Dynamic locations from API
  const [stallLocation, setStallLocation] = useState<{lat: number, lng: number} | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number} | null>(null);
  const mapRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const stallMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const lastFetchedRouteStage = useRef<number | null>(null);
  const interactTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const riderLocRef = useRef<{lat: number, lng: number} | null>(null);

  const [routePath, setRoutePath] = useState<{lat: number, lng: number}[]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (lastFetchedRouteStage.current === stageIndex) return;

      let destination = null;
      if (stageIndex < 2 && stallLocation) {
        destination = stallLocation;
      } else if (stageIndex >= 2 && customerLocation) {
        destination = customerLocation;
      }

      if (riderLocation && destination && window.google) {
        try {
          const res = await api.post('/location/route', {
            originLat: riderLocation.lat,
            originLng: riderLocation.lng,
            destLat: destination.lat,
            destLng: destination.lng
          });
          const data = res.data.data;
          if (data && data.polyline) {
            const decodedPath = window.google.maps.geometry.encoding.decodePath(data.polyline);
            setRoutePath(decodedPath.map((p: any) => ({ lat: p.lat(), lng: p.lng() })));
            lastFetchedRouteStage.current = stageIndex;
          }
        } catch (err) {
          console.error("Failed to fetch route from backend API", err);
        }
      }
    };
    fetchRoute();
  }, [riderLocation, stallLocation, customerLocation, stageIndex]);

  

  useEffect(() => {
    const handleCustomNewJob = (e: any) => {
      const payload = e.detail;
      if (payload && payload.action === 'NEW_ORDER' && payload.orderId) {
         setNewJob({
           id: 'job_' + payload.orderId,
           dropoffDistance: payload.dropoffDistance || 'N/A',
           earnings: payload.earnings || 0,
           customerName: payload.customerName || 'Customer',
           itemCount: payload.itemCount || 1,
           itemsSummary: payload.itemsSummary || 'Accept to see details',
           stallName: payload.stallName || 'Stall',
           pickupLat: payload.pickupLat,
           pickupLng: payload.pickupLng,
           deliveryLat: payload.deliveryLat,
           deliveryLng: payload.deliveryLng,
           returnPayout: payload.pickupPayout || 0
         });
         const audio = document.getElementById('ringtone') as HTMLAudioElement;
         if (audio) {
           audio.loop = true;
           audio.play().catch(e => console.error("Audio play failed:", e));
         }
      }
    };
    window.addEventListener('swaddo_new_job', handleCustomNewJob);
    return () => window.removeEventListener('swaddo_new_job', handleCustomNewJob);
  }, []);

  useEffect(() => {
    // Fetch order locations
    const fetchLocations = async () => {
      if (!orderId || orderId === 'undefined' || orderId === 'null') {
        localStorage.removeItem('activeDelivery');
        router.push('/home');
        return;
      }
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data && res.data.data) {
          const order = res.data.data;
          
          if (order.status === 'delivered' || order.status === 'cancelled') {
             localStorage.removeItem('activeDelivery');
             router.push('/home');
             return;
          }

          setStallLocation({ lat: order.stall?.lat || 25.611, lng: order.stall?.lng || 85.130 });
          setCustomerLocation({ lat: order.deliveryLat || 25.590, lng: order.deliveryLng || 85.140 });
          setOrderData({
            stallName: order.stall?.name || "Stall",
            stallAddress: order.stall?.address || "Food Court",
            stallPhone: order.stall?.phone || "N/A",
            customerName: order.customer?.name || "Customer",
            customerAddress: order.deliveryAddress || "Customer Location",
            customerPhone: order.customer?.phone || "N/A",
            deliveryInstructions: order.customer?.instructions || "",
            earnings: order.earnings || 45,
            paymentMethod: order.paymentMethod,
            totalAmount: order.totalAmount,
            items: order.items
          });
          
          if (order.status === 'heading_to_customer') setStageIndex(2);
          else if (order.status === 'at_customer') setStageIndex(3);
          else if (order.status === 'at_stall') setStageIndex(1);
          
        }
      } catch (err: any) {
        console.error("Failed to fetch order details", err);
        const status = err.response?.status;
        if (status === 404 || status === 403 || status === 400) {
           localStorage.removeItem('activeDelivery');
           router.push('/home');
        }
      }
    };
    fetchLocations();
    const orderPollInterval = setInterval(fetchLocations, 3000);

    // Intercept Android hardware back button to allow navigating back to Home for Stacked Orders
    const backListener = App.addListener('backButton', () => {
      router.push('/home');
    });

    // Setup Socket
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_SOCKET_URL; 
    if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) {
      socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
    }
    const socket: Socket = io(socketUrl || "http://localhost:5005", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    // Setup Geolocation Watch
    let watchId: any;
    const startWatch = async () => {
      try {
        const check = async () => {
          if (Capacitor.isNativePlatform()) {
             const perm = await Geolocation.requestPermissions();
             if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') return false;
             return true;
          }
          return "geolocation" in navigator;
        };

        const hasPermission = await check();
        if (!hasPermission) {
          console.error("Location permission denied or not supported.");
          return;
        }

        const callback = (position: any, err?: any) => {
          if (err || !position) {
             console.error("Error fetching location:", err);
             return;
          }
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setRiderLocation({ lat: latitude, lng: longitude });
          riderLocRef.current = { lat: latitude, lng: longitude };
          localStorage.setItem(`rider_loc_${orderId}`, JSON.stringify({ lat: latitude, lng: longitude }));
          
          socket.emit("rider_location_update", {
            orderId,
            latitude,
            longitude
          });
        };

        if (Capacitor.isNativePlatform()) {
          watchId = await Geolocation.watchPosition({ enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }, callback);
        } else {
          watchId = navigator.geolocation.watchPosition(callback as any, (err) => console.error(err), { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 });
        }
      } catch (err) {
        console.error("Geolocation watch setup failed", err);
      }
    };

    startWatch();

    const pingInterval = setInterval(() => {
      if (riderLocRef.current) {
        socket.emit("rider_location_update", {
          orderId,
          latitude: riderLocRef.current.lat,
          longitude: riderLocRef.current.lng
        });
      }
    }, 2000);

    // Listen to real-time order updates
    const orderChannel = `order:${orderId}`;
    socket.on(orderChannel, (update: any) => {
      if (update.status === 'cancelled' || update.status === 'declined') {
        alert("This order has been cancelled by the merchant/customer.");
        localStorage.removeItem('activeDelivery');
        router.push('/home');
      } else if (update.status === 'ready') {
        setOrderData((prev: any) => prev ? { ...prev, isReady: true } : prev);
      } else if (update.status === 'heading_to_customer') {
        setStageIndex(2);
      }
    });

    return () => {
      clearInterval(pingInterval);
      clearInterval(orderPollInterval);
      backListener.then(listener => listener.remove());
      if (watchId) {
        if (Capacitor.isNativePlatform()) Geolocation.clearWatch({ id: watchId });
        else navigator.geolocation.clearWatch(watchId);
      }
      socket.disconnect();
    };
  }, [orderId]);

  const handleNextStage = async (pin?: string) => {
    if (!orderId) return;

    try {
      if (stageIndex === 3) {
        if (orderData?.paymentMethod === 'cod' && !cashCollected) {
          alert("Please confirm you have collected the cash from the customer.");
          return;
        }
        setShowDeliveryModal(true);
        return;
      }
  
      if (stageIndex < STAGES.length - 1) {
        const nextStage = STAGES[stageIndex + 1].id;
        
        // Pass pin if provided
        const payload: any = { status: nextStage };
        if (pin) payload.pin = pin;
        
        await api.patch(`/orders/${orderId}/status`, payload);
        setStageIndex(prev => prev + 1);
      }
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.message || "Something went wrong"));
    }
  };

  const confirmDelivery = async () => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'delivered', pin: deliveryPin });
      setCompleted(true);
      setShowDeliveryModal(false);
      
      if (orderData?.paymentMethod === 'cod') {
        await api.patch(`/orders/${orderId}/confirm-cash-collected`).catch(console.error);
      }
      
      localStorage.removeItem('activeDelivery');
      setTimeout(() => { router.push("/home"); }, 2000);
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.message || "Invalid PIN"));
    }
  };

  const initialCenter = useMemo(() => ({ lat: 25.611, lng: 85.130 }), []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-bg-main overflow-hidden flex flex-col z-[100]">
      {/* Real Map Area */}
      <div className="flex-1 relative bg-[#FDFBF7]">
        {!mapboxToken || !riderLocation ? (
          <div className="flex items-center justify-center w-full h-full text-text-muted font-medium bg-[#FDFBF7]">
            <Loader2 className="animate-spin text-primary mr-2" /> Fetching GPS location...
          </div>
        ) : (
          <div className="absolute inset-0">
            <LiveTrackingMap apiKey={mapboxToken} riderLoc={riderLocation} storeLoc={stallLocation} userLoc={customerLocation} stageIndex={stageIndex} routePolyline={typeof routePath === 'string' ? routePath : undefined} className="w-full h-full" />

          </div>
        )}

        {/* Top Header overlay */}
        <div className="absolute top-8 pt-safe-8 px-5 w-full z-10 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-2 pointer-events-auto">
            <button 
              onClick={() => router.push('/home')}
              className="bg-white/90 backdrop-blur-md w-10 h-10 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-white/40 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ChevronRight className="rotate-180 text-slate-800" size={24} />
            </button>
            <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] border border-white/40 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-black text-slate-800 tracking-wider text-[13px]">ORDER #{String(orderId).slice(-4).toUpperCase() || '102A'}</span>
            </div>
          </div>
          {orderData && (
            <div className="bg-[#10B981] px-5 py-2.5 rounded-full shadow-[0_4px_16px_rgba(16,185,129,0.3)] font-black text-white pointer-events-auto text-[15px]">
              ₹{orderData.earnings}
            </div>
          )}
        </div>
      </div>

      {/* Swipeable Bottom Sheet */}
      <motion.div 
        className="bg-white rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.08)] z-30 flex flex-col relative overflow-hidden"
        initial={{ y: "20%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3" />
        
        <div className="px-5 pb-8 pt-2">
          
          {completed ? (
            <div className="flex flex-col items-center justify-center py-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <CheckCircle size={80} className="text-[#10B981] mb-4" />
              </motion.div>
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Delivery Completed!</h2>
              <p className="text-slate-500 font-bold mt-2">Earnings added to your wallet.</p>
            </div>
          ) : (
            <>
              {/* Stage Indicator */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center relative">
                  <div className="w-3 h-3 rounded-full bg-[#10B981] animate-ping absolute" />
                  <div className="w-3 h-3 rounded-full bg-[#10B981] relative" />
                </div>
                <h2 className="text-[20px] font-black tracking-tight text-slate-800">
                  {STAGES[stageIndex].title}
                </h2>
              </div>

              {/* Target Info Card */}
              {orderData && (
                <div className="bg-[#F8FAFC] border border-slate-100 rounded-[20px] p-5 mb-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/5 rounded-bl-full -z-0"></div>
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {stageIndex < 2 ? "Pickup From" : "Deliver To"}
                      </p>
                      <h3 className="font-black text-[18px] text-slate-800 leading-tight">
                        {stageIndex < 2 ? orderData.stallName : orderData.customerName}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${stageIndex < 2 ? stallLocation?.lat + ',' + stallLocation?.lng : customerLocation?.lat + ',' + customerLocation?.lng}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors shadow-sm"
                      >
                        <Navigation size={22} />
                      </a>
                      <a 
                        href={`tel:${stageIndex < 2 ? orderData.stallPhone : orderData.customerPhone}`}
                        className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-[#10B981] hover:bg-emerald-100 transition-colors shadow-sm"
                      >
                        <Phone size={22} />
                      </a>
                    </div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stageIndex < 2 ? stallLocation?.lat + ',' + stallLocation?.lng : customerLocation?.lat + ',' + customerLocation?.lng}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-slate-500 text-[13px] font-medium hover:text-blue-600 transition-colors cursor-pointer relative z-10"
                  >
                    <MapPin size={18} className="shrink-0 mt-0.5 text-slate-400" />
                    <p className="leading-snug pr-4">{stageIndex < 2 ? orderData.stallAddress : orderData.customerAddress}</p>
                  </a>
                  
                  {stageIndex >= 2 && orderData.deliveryInstructions && (
                    <div className="mt-4 p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 relative z-10">
                      <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1">Delivery Instructions</p>
                      <p className="text-[13px] font-bold text-blue-900">{orderData.deliveryInstructions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Order Items Info for Customer Delivery */}
              {orderData?.items && stageIndex >= 2 && (
                <div className="bg-slate-50 border border-slate-100 rounded-[20px] p-5 mb-5 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-400">Order Items</p>
                  <p className="text-[14px] font-bold text-slate-700">{orderData.items}</p>
                </div>
              )}

              {/* COD Banner & Checkbox */}
              {orderData?.paymentMethod === 'cod' && stageIndex >= 2 && (
                <div className="bg-orange-50 border border-orange-100 rounded-[20px] p-5 mb-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-orange-800 text-[13px] uppercase tracking-wide">To Collect (Cash)</span>
                    <span className="font-black text-orange-700 text-[22px]">₹{orderData.totalAmount}</span>
                  </div>
                  {stageIndex === 3 && (
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 bg-white rounded-xl border border-orange-200 shadow-sm transition-all hover:bg-orange-50/50">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded text-[#10B981] accent-[#10B981] border-slate-300"
                        checked={cashCollected}
                        onChange={(e) => setCashCollected(e.target.checked)}
                      />
                      <span className="font-bold text-slate-700 text-[13px]">I have collected ₹{orderData.totalAmount} in cash.</span>
                    </label>
                  )}
                </div>
              )}

              {/* Action Button */}
              {stageIndex === 1 ? (
                <div className="w-full bg-slate-50 border border-slate-100 p-5 rounded-[20px] text-center shadow-sm">
                  {orderData?.items && (
                    <div className="mb-4 text-left border-b border-slate-200 pb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-slate-400">Order Items</p>
                      <p className="text-[14px] font-bold text-slate-700">{orderData.items}</p>
                    </div>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">Pickup Verification</p>
                  <p className="text-[14px] font-bold text-slate-700 mb-3">Ask the Merchant for the 4-digit Pickup PIN</p>
                  <input 
                    type="text" 
                    maxLength={4}
                    placeholder="----"
                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-4 text-center font-black text-3xl tracking-[1em] text-slate-700 focus:outline-none focus:border-[#10B981] transition-colors mb-4"
                    id="merchantPinInput"
                  />
                  <button 
                    onClick={() => {
                      const input = (document.getElementById('merchantPinInput') as HTMLInputElement).value;
                      if(input.length === 4) handleNextStage(input);
                      else alert("Please enter the 4-digit Merchant PIN");
                    }}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-black py-4 rounded-[20px] transition-all shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] active:scale-95 text-lg"
                  >
                    Verify & Confirm Pickup
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleNextStage()}
                  disabled={stageIndex === 3 && orderData?.paymentMethod === 'cod' && !cashCollected}
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-black py-4 rounded-[20px] transition-all shadow-[0_8px_24px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_32px_rgba(16,185,129,0.4)] active:scale-95 text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {STAGES[stageIndex].action}
                  <ChevronRight size={20} strokeWidth={3} />
                </button>
              )}
            </>
          )}

        </div>
      </motion.div>

      {/* Delivery PIN Modal */}
      <AnimatePresence>
        {showDeliveryModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
              <h3 className="text-xl font-bold mb-2 text-slate-800 mt-2">Verify Delivery</h3>
              <p className="text-slate-500 mb-6 text-sm">Ask the Customer for their <strong className="text-slate-700">4-digit Delivery PIN</strong>.</p>
              
              {orderData?.paymentMethod === 'cod' && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-xl mb-6 font-bold flex justify-between items-center px-4">
                  <span>Collect Cash:</span>
                  <span className="text-xl">₹{orderData.totalAmount}</span>
                </div>
              )}
              
              <input 
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={deliveryPin}
                onChange={(e) => setDeliveryPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="w-full text-center text-3xl font-black tracking-[0.3em] py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-primary focus:bg-white mb-6 transition-all"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setShowDeliveryModal(false)} className="flex-1 py-3.5 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
                <button onClick={confirmDelivery} disabled={deliveryPin.length !== 4} className="flex-[2] py-3.5 rounded-xl font-bold bg-primary text-white disabled:opacity-50 transition-all shadow-[0_4px_15px_rgba(255,87,34,0.3)] hover:shadow-[0_6px_20px_rgba(255,87,34,0.4)]">Confirm</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveDeliveryContent() {
  const [mapboxToken, setMapboxToken] = useState("");
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
        const res = await fetch(`${baseUrl}/location/map-token`);
        const data = await res.json();
        if (data.token) setMapboxToken(data.token);
        else if (data.mapboxToken) setMapboxToken(data.mapboxToken);
        else if (data.data?.mapboxToken) setMapboxToken(data.data.mapboxToken);
      } catch (err) {
        console.error("Failed to fetch map token", err);
      }
    };
    fetchToken();
  }, []);

  const initialCenter = useMemo(() => ({ lat: 25.611, lng: 85.130 }), []);

  if (!mapboxToken) {
    return <div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;
  }
  
  return <ActiveDeliveryContentInner mapboxToken={mapboxToken} />;
}

export default function ActiveDelivery() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <ActiveDeliveryContent />
    </Suspense>
  );
}
