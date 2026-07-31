"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Phone, CheckCircle, Store, User, Loader2, Home } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { App } from "@capacitor/app";
import { io, Socket } from "socket.io-client";
import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";

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
  const orderId = searchParams.get('id') as string;
  
  const [stageIndex, setStageIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [cashCollected, setCashCollected] = useState(false);
  const [deliveryPin, setDeliveryPin] = useState("");
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

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
            totalAmount: order.totalAmount
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

    // Intercept and disable Android hardware back button
    const backListener = App.addListener('backButton', () => {
      // Do nothing, effectively disabling the back button
      console.log('Back button disabled during active delivery');
    });

    // Setup Socket
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5005";
    const socket: Socket = io(socketUrl);

    // Setup Geolocation Watch
    let watchId: number;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setRiderLocation({ lat: latitude, lng: longitude });
          riderLocRef.current = { lat: latitude, lng: longitude };
          localStorage.setItem(`rider_loc_${orderId}`, JSON.stringify({ lat: latitude, lng: longitude }));
          
          // Emit location to backend
          socket.emit("rider_location_update", {
            orderId,
            latitude,
            longitude
          });
        },
        (error) => {
          console.error("Error fetching location:", error);
          // Removed hardcoded fallback that caused the rider marker to jump randomly on GPS timeout
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }

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
      backListener.then(listener => listener.remove());
      if (watchId) navigator.geolocation.clearWatch(watchId);
      socket.disconnect();
    };
  }, [orderId]);

  const handleNextStage = async () => {
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
      setStageIndex(prev => prev + 1);
      api.patch(`/orders/${orderId}/status`, { status: nextStage }).catch(() => {});
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
    <div className="relative h-screen w-full bg-bg-main overflow-hidden flex flex-col">
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

        {/* Top Back Button / Header overlay */}
        <div className="absolute top-safe pt-4 px-4 w-full z-10 flex justify-between items-start pointer-events-none">
          <div className="bg-bg-alt px-4 py-2 rounded-full shadow-md pointer-events-auto border border-border-subtle">
            <span className="font-heading font-bold text-primary">Order #{String(orderId).slice(-4).toUpperCase() || '102A'}</span>
          </div>
          {orderData && (
            <div className="bg-accent px-4 py-2 rounded-full shadow-md font-bold text-white pointer-events-auto">
              ₹{orderData.earnings}
            </div>
          )}
        </div>
      </div>

      {/* Swipeable Bottom Sheet */}
      <motion.div 
        className="bg-bg-alt rounded-t-[32px] shadow-[0_-10px_40px_rgba(43,36,32,0.1)] border-t border-border-subtle z-30 flex flex-col"
        initial={{ y: "20%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="w-12 h-1.5 bg-border-subtle rounded-full mx-auto my-3" />
        
        <div className="px-6 pb-8 pt-2">
          
          {completed ? (
            <div className="flex flex-col items-center justify-center py-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
              >
                <CheckCircle size={80} className="text-primary mb-4" />
              </motion.div>
              <h2 className="text-2xl font-heading font-bold text-text-primary">Delivery Completed!</h2>
              <p className="text-text-muted mt-2">Earnings added to your wallet.</p>
            </div>
          ) : (
            <>
              {/* Stage Indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                <h2 className="text-lg font-heading font-bold text-text-primary">
                  {STAGES[stageIndex].title}
                </h2>
              </div>

              {/* Target Info Card */}
              {orderData && (
                <div className="bg-bg-main border border-border-subtle rounded-2xl p-4 mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">
                        {stageIndex < 2 ? "Pickup From" : "Deliver To"}
                      </p>
                      <h3 className="font-heading font-bold text-lg text-text-primary">
                        {stageIndex < 2 ? orderData.stallName : orderData.customerName}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${stageIndex < 2 ? stallLocation?.lat + ',' + stallLocation?.lng : customerLocation?.lat + ',' + customerLocation?.lng}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 hover:bg-blue-500/20 transition-colors"
                      >
                        <Navigation size={20} />
                      </a>
                      <a 
                        href={`tel:${stageIndex < 2 ? orderData.stallPhone : orderData.customerPhone}`}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Phone size={20} />
                      </a>
                    </div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stageIndex < 2 ? stallLocation?.lat + ',' + stallLocation?.lng : customerLocation?.lat + ',' + customerLocation?.lng}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-text-muted text-sm hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    <MapPin size={16} className="shrink-0 mt-0.5" />
                    <p className="underline underline-offset-2">{stageIndex < 2 ? orderData.stallAddress : orderData.customerAddress}</p>
                  </a>
                  
                  {stageIndex >= 2 && orderData.deliveryInstructions && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <p className="text-xs font-bold text-blue-800 uppercase mb-1">Delivery Instructions</p>
                      <p className="text-sm font-medium text-blue-900">{orderData.deliveryInstructions}</p>
                    </div>
                  )}
                </div>
              )}

              {/* COD Banner & Checkbox */}
              {orderData?.paymentMethod === 'cod' && stageIndex >= 2 && (
                <div className="bg-[#8B4513]/10 border border-[#8B4513]/20 rounded-2xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-[#8B4513] text-sm">To Collect (Cash)</span>
                    <span className="font-bold text-[#8B4513] text-xl">₹{orderData.totalAmount}</span>
                  </div>
                  {stageIndex === 3 && (
                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-xl border border-border-subtle shadow-sm">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded accent-primary border-border-subtle"
                        checked={cashCollected}
                        onChange={(e) => setCashCollected(e.target.checked)}
                      />
                      <span className="font-bold text-text-primary text-sm">I have collected ₹{orderData.totalAmount} in cash.</span>
                    </label>
                  )}
                </div>
              )}

              {/* Action Button */}
              {stageIndex === 1 ? (
                <div className="w-full bg-blue-50 border border-blue-200 text-blue-800 p-5 rounded-2xl text-center shadow-inner">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">Pickup Verification</p>
                  <p className="text-lg">Provide PIN <span className="font-black text-3xl tracking-widest text-blue-900 mx-1">{String((parseInt(orderId) * 83) % 10000).padStart(4, '0')}</span> to Merchant</p>
                  <p className="text-xs font-medium opacity-70 mt-2">Waiting for merchant to handover...</p>
                </div>
              ) : (
                <button 
                  onClick={handleNextStage}
                  disabled={stageIndex === 3 && orderData?.paymentMethod === 'cod' && !cashCollected}
                  className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-primary/30 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {STAGES[stageIndex].action}
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
