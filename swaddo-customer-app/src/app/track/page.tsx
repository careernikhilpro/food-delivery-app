"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { Home, Bike, Check, Phone, MessageSquare, Star, Store, Navigation, Loader2, Clock, X } from "lucide-react";
import { io } from "socket.io-client";
import { api } from "@/lib/api";
const stages = ["Order Placed", "Preparing Food", "Out for Delivery", "Arriving"];

import { LiveTrackingMap } from "@/components/maps/LiveTrackingMap";
import { useJsApiLoader, MarkerF } from "@react-google-maps/api";

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
      const ease = 1 - (1 - progress) * (1 - progress); // easeOutQuad
      
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

const RealMapInner = ({ mapToken, riderLoc, userLoc, stallLoc, stageIndex, riderAssigned, onDistanceUpdate }: { mapToken: string, riderLoc: {lat: number, lng: number} | null, userLoc: {lat: number, lng: number}, stallLoc: {lat: number, lng: number}, stageIndex: number, riderAssigned: boolean, onDistanceUpdate?: (dist: string, etaMinutes: string) => void }) => {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: mapToken,
    libraries: libraries,
  });
  const [routePath, setRoutePath] = useState<{lat: number, lng: number}[]>([]);
  const mapRef = useRef<any>(null);
  const lastFetchedRouteStage = useRef<number | null>(null);
  const interactTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mapReady, setMapReady] = useState(false);

  

  const baseRouteInfo = useRef<{distanceKm: number, durationMin: number, straightLineDist: number} | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!riderLoc || !userLoc || !stallLoc) return;
      if (lastFetchedRouteStage.current === stageIndex) return;
      if (!isLoaded || !window.google) return;

      let origin = riderLoc;
      let destination = stageIndex < 2 ? stallLoc : userLoc;
        try {
          const res = await api.post('/location/route', {
            originLat: origin.lat,
            originLng: origin.lng,
            destLat: destination.lat,
            destLng: destination.lng
          });
          const data = res.data.data;
          if (data && data.polyline) {
            const decodedPath = window.google.maps.geometry.encoding.decodePath(data.polyline);
            setRoutePath(decodedPath.map((p: any) => ({ lat: p.lat(), lng: p.lng() })));
            
            const straightLineDist = window.google.maps.geometry.spherical.computeDistanceBetween(origin, destination);
            baseRouteInfo.current = {
              distanceKm: parseFloat(data.distanceKm),
              durationMin: parseFloat(data.durationMin),
              straightLineDist
            };
            
            if (onDistanceUpdate) onDistanceUpdate(data.distanceKm + " km", Math.round(data.durationMin) + " Mins");
            lastFetchedRouteStage.current = stageIndex;
          }
        } catch (err) {
          console.error("Failed to fetch route from backend API", err);
        }
    };
    fetchRoute();
  }, [riderLoc, userLoc, stageIndex, isLoaded]);

  // Real-time live distance/ETA updates based on rider movement
  useEffect(() => {
    if (!riderLoc || !isLoaded || !window.google) return;
    
    const target = stageIndex < 2 ? stallLoc : userLoc;
    const currentStraightDist = window.google.maps.geometry.spherical.computeDistanceBetween(riderLoc, target);
    
    if (baseRouteInfo.current && baseRouteInfo.current.straightLineDist > 0) {
      const ratio = currentStraightDist / baseRouteInfo.current.straightLineDist;
      const estDistKm = Math.max(0.01, baseRouteInfo.current.distanceKm * ratio);
      const estDuration = Math.max(1, Math.round(baseRouteInfo.current.durationMin * ratio));
      if (onDistanceUpdate) onDistanceUpdate(estDistKm.toFixed(3) + " km", estDuration + " Mins");
    } else {
      const estDistKm = (currentStraightDist * 1.4) / 1000;
      const estDuration = Math.max(1, Math.round((estDistKm / 25) * 60));
      if (onDistanceUpdate) onDistanceUpdate(estDistKm.toFixed(3) + " km", estDuration + " Mins");
    }
  }, [riderLoc, stageIndex, userLoc, isLoaded]);

  if (!isLoaded || !mapToken) {
    return (
      <div className="absolute inset-0 bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#FDFBF7]">
      <LiveTrackingMap apiKey={mapToken} riderLoc={riderLoc} storeLoc={stallLoc} userLoc={userLoc} stageIndex={stageIndex} routePolyline={typeof routePath === 'string' ? routePath : undefined} className="w-full h-full" />

      {!riderAssigned && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: "-50%", x: "-50%" }}
          animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
          className="absolute top-1/2 left-1/2 bg-white/80 backdrop-blur-2xl px-8 py-6 rounded-[32px] shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-white/60 flex flex-col items-center pointer-events-none z-10 min-w-[280px]"
        >
          <div className="relative mb-4">
             <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="font-heading font-black text-gray-900 text-xl tracking-tight">Waiting for Rider...</h3>
          <p className="text-gray-500 font-medium text-sm mt-1.5 text-center">Finding a delivery partner for your order</p>
        </motion.div>
      )}
    </div>
  );
};

const RealMap = (props: any) => {
  const [mapToken, setMapToken] = useState("");
  
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await api.get('/location/map-token');
        if (res.data?.token) setMapToken(res.data.token);
      } catch (err) {
        console.error("Failed to fetch map token", err);
      }
    };
    fetchToken();
  }, []);

  if (!mapToken) {
    return (
      <div className="absolute inset-0 bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return <RealMapInner mapToken={mapToken} {...props} />;
};

function OrderTrackingContent() {
  useAuth();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  
  const [orderStatus, setOrderStatus] = useState<any>({
    stageIndex: 0, // 0: Placed, 1: Prep, 2: Out, 3: Arriving
    status: 'pending',
    eta: "12 Mins",
    riderLocation: null,
    userLocation: { lat: 25.590, lng: 85.140 },
    stallLocation: { lat: 25.611, lng: 85.130 },
    rider: null,
    orderData: null,
  });

  const [routeDistance, setRouteDistance] = useState("Calculating...");
  const [notFound, setNotFound] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    if (!orderId) return;
    
    // 1. Fetch real initial status
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data && res.data.data) {
          const order = res.data.data;
          
          let newStage = 0;
          if (order.status === 'preparing' || order.status === 'ready') newStage = 1;
          if (order.status === 'heading_to_stall' || order.status === 'assigned' || order.status === 'at_stall') newStage = 1;
          if (order.status === 'heading_to_customer') newStage = 2;
          if (order.status === 'at_customer' || order.status === 'delivered') newStage = 3;
          
          let stallLocation = { lat: order.stall?.lat || 25.611, lng: order.stall?.lng || 85.130 };
          let customerLocation = { lat: order.deliveryLat || 25.590, lng: order.deliveryLng || 85.140 };

          // Note: Initial rider location might only come from live socket pings. 
          // If the backend returns it in `order.riderLocation`, we'd use it here.
          let rLoc = order.riderLocation || null;
          
          if (!rLoc) {
            try {
              const localRider = localStorage.getItem(`rider_loc_${orderId}`);
              if (localRider) {
                rLoc = JSON.parse(localRider);
              }
            } catch(e) {}
          }

          setOrderStatus((prev: any) => ({ 
            ...prev, 
            stageIndex: newStage, 
            status: order.status,
            stallLocation,
            userLocation: customerLocation,
            riderLocation: rLoc, 
            rider: order.rider ? { name: order.rider.name, phone: order.rider.phone, vehicle: order.rider.vehicle, photo: order.rider.photo } : null,
            orderData: order,
            eta: newStage < 2 ? (order.stall?.estimated_prep_time ? order.stall.estimated_prep_time + " Mins" : "25 Mins") : prev.eta
          }));
        } else {
          setNotFound(true);
        }
      } catch (err: any) {
        console.error("Failed to fetch order", err);
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        
        if (status === 403) {
           setErrorDetails({
             title: "Access Denied", 
             message: msg || "This order doesn't seem to belong to you. Please check your active orders."
           });
        } else if (status === 404) {
           setErrorDetails({
             title: "Order Not Found", 
             message: msg || "We couldn't find the order you're looking for."
           });
        } else {
           setErrorDetails({
             title: "Something went wrong", 
             message: "Unable to track this order at the moment. Please try again later."
           });
        }
      }
    };
    fetchOrder();

    // 2. Listen for live updates on targeted channel
    let socketUrl = process.env.NEXT_PUBLIC_WS_URL; if (!socketUrl && process.env.NEXT_PUBLIC_API_URL) socketUrl = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, ""); const socket = io(socketUrl || "http://localhost:5005", { transports: ["websocket", "polling"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000, reconnectionDelayMax: 5000 });

    const orderChannel = `order:${orderId}`;
    socket.on("connect", () => {
      console.log(`Connected to global socket for order tracking`);
      socket.emit("join_room", orderChannel);
      socket.emit("join_room", `room_${orderId}`); // The backend broadcasts rider_location_update to room_${orderId}
    });

    socket.on('rider_location_update', (data: any) => {
      console.log("[Socket] Received Rider Location Update:", data);
      setOrderStatus((prev: any) => {
        if (data.latitude && data.longitude) {
          return {
            ...prev,
            riderLocation: { lat: data.latitude, lng: data.longitude },
            status: data.status || prev.status
          };
        }
        return prev;
      });
    });

    socket.on(orderChannel, (update: any) => {
      console.log("[Socket] Received Status Update:", update);

      setOrderStatus((prev: any) => {
        // Default to keeping the current stage, preventing regression!
        let newStage = prev.stageIndex;
        
        if (update.status === 'placed' || update.status === 'pending') newStage = 0;
        if (update.status === 'preparing' || update.status === 'ready') newStage = 1;
        if (update.status === 'heading_to_stall' || update.status === 'assigned' || update.status === 'at_stall') newStage = 1;
        if (update.status === 'heading_to_customer') newStage = 2;
        if (update.status === 'at_customer' || update.status === 'delivered') newStage = 3;

        return {
          ...prev,
          stageIndex: newStage,
          status: update.status,
          rider: update.deliveryPartner || prev.rider,
          riderLocation: update.riderLocation || prev.riderLocation,
          eta: update.deliveryPartner && newStage < 2 ? "25 Mins" : prev.eta
        };
      });
    });

    const fallbackInterval = setInterval(() => {
      try {
        const localRider = localStorage.getItem(`rider_loc_${orderId}`);
        if (localRider) {
          const parsed = JSON.parse(localRider);
          setOrderStatus((prev: any) => {
            if (!prev.riderLocation || prev.riderLocation.lat !== parsed.lat || prev.riderLocation.lng !== parsed.lng) {
              return { ...prev, riderLocation: parsed };
            }
            return prev;
          });
        }
      } catch (e) {}
    }, 2000);

    const apiPollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data && res.data.data) {
          const rLoc = res.data.data.riderLocation;
          if (rLoc && rLoc.lat && rLoc.lng) {
             setOrderStatus((prev: any) => {
               if (!prev.riderLocation || prev.riderLocation.lat !== rLoc.lat || prev.riderLocation.lng !== rLoc.lng) {
                 return { ...prev, riderLocation: rLoc };
               }
               return prev;
             });
          }
        }
      } catch(e) {}
    }, 5000);

    return () => {
      clearInterval(fallbackInterval);
      clearInterval(apiPollInterval);
      socket.disconnect();
    };
  }, [orderId]);

  useEffect(() => {
    if (orderStatus.status === 'delivered') {
      const timer = setTimeout(() => {
        window.location.href = '/';
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [orderStatus.status]);

  if (errorDetails || notFound) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-bg-main p-6">
        <div className="text-center max-w-sm bg-white p-8 rounded-3xl shadow-sm border border-border-subtle">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <Store size={40} className="text-primary opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-3 font-heading">{errorDetails?.title || "Order Not Found"}</h2>
          <p className="text-text-muted mb-8">{errorDetails?.message || "This order does not exist or has been erased."}</p>
          <button 
            onClick={() => window.location.href = '/orders'}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            Go to My Orders
          </button>
        </div>
      </div>
    );
  }

  if (orderStatus.status === 'payment_pending') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full bg-bg-main p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mb-6"
        >
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-xl">
            <Clock size={40} strokeWidth={3} />
          </div>
        </motion.div>
        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">Payment Pending</h2>
        <p className="text-gray-500 font-medium mb-8 max-w-[280px]">Your order is on hold because the payment was not completed. Please try ordering again.</p>
        
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full max-w-[300px] bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-4 rounded-2xl transition-colors shadow-lg"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (orderStatus.status === 'cancelled' || orderStatus.status === 'declined') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full bg-bg-main p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mb-6"
        >
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl">
            <X size={48} strokeWidth={3} />
          </div>
        </motion.div>
        <h2 className="text-3xl font-heading font-bold text-gray-900 mb-2">Order Cancelled</h2>
        <p className="text-gray-500 font-medium mb-8 max-w-[280px]">This order was cancelled. Please place a new order if you wish.</p>
        
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full max-w-[300px] bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-4 rounded-2xl transition-colors shadow-lg"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (orderStatus.status === 'delivered') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full bg-bg-main p-6 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-6"
        >
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-xl">
            <Check size={48} strokeWidth={3} />
          </div>
        </motion.div>
        <h2 className="text-3xl font-heading font-bold text-text-primary mb-2">Delivered Successfully!</h2>
        <p className="text-text-muted mb-8 max-w-[280px]">Your order has arrived. Enjoy your meal and don't forget to rate your experience.</p>
        
        <button 
          onClick={() => window.location.href = '/profile'}
          className="w-full max-w-[300px] bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-2xl transition-colors shadow-lg shadow-primary/30"
        >
          View Order History
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-bg-main relative">
      {/* Dynamic Map Component */}
      <div className="flex-1 relative z-0">
        <RealMap 
          riderLoc={orderStatus.riderLocation}
          userLoc={orderStatus.userLocation}
          stallLoc={orderStatus.stallLocation}
          stageIndex={orderStatus.stageIndex}
          riderAssigned={!!orderStatus.rider}
          onDistanceUpdate={(dist: any, eta: any) => {
            setRouteDistance(dist);
            setOrderStatus((prev: any) => ({ ...prev, eta: prev.stageIndex >= 2 ? (eta || prev.eta) : prev.eta }));
          }}
        />
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 w-full z-10 p-4 pt-safe pointer-events-none flex justify-center">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white/90 backdrop-blur-2xl rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-white/50 p-2 pr-6 flex items-center justify-between pointer-events-auto max-w-[340px] w-full gap-4"
        >
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 shrink-0 relative overflow-hidden">
             <div className="absolute inset-0 bg-primary/10 animate-ping opacity-50"></div>
             <Bike size={22} className="text-primary relative z-10" />
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-gray-900 text-[17px] tracking-tight truncate">Order #{orderId?.toString().padStart(4, '0')}</h2>
              <p className="text-[11px] font-bold text-gray-500 tracking-wider uppercase mt-0.5">{orderStatus.status.replace(/_/g, ' ')}</p>
            </div>
            <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl text-center">
              <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-0.5">Delivery PIN</p>
              <p className="font-black text-primary tracking-widest text-lg leading-none">{orderId ? String((parseInt(orderId.toString()) * 137) % 10000).padStart(4, '0') : "0000"}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ETA Bottom Sheet UI */}
      <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-auto">
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 25 }}
          className="bg-[#F8F9FA]/95 backdrop-blur-3xl rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.15)] p-6 pb-safe border-t border-white/80 relative"
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-gray-300/60 rounded-full"></div>
          
          <div className="flex justify-between items-end mt-4 mb-6">
            <div>
              <p className="text-gray-500 font-bold text-[11px] mb-0.5 uppercase tracking-widest">Estimated Arrival</p>
              <h1 className="text-[42px] font-heading font-black text-primary leading-none tracking-tighter drop-shadow-sm">{orderStatus.eta.replace(' Mins', '')}<span className="text-[24px] ml-1">Mins</span></h1>
            </div>
            <div className="text-right pb-1">
              <p className="text-gray-500 font-bold text-[10px] mb-1 uppercase tracking-widest">Distance</p>
              <p className="text-[16px] font-heading font-black text-gray-900 leading-none">{routeDistance}</p>
            </div>
          </div>

          {/* Delivery Partner Info */}
          {orderStatus.rider && (
            <div className="bg-white rounded-[24px] p-4 flex items-center gap-4 border border-gray-100 mb-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="w-[54px] h-[54px] bg-gradient-to-br from-primary to-orange-400 rounded-full border-[3px] border-orange-50 shadow-md flex items-center justify-center flex-shrink-0 relative z-10 overflow-hidden">
              {orderStatus.rider.photo ? (
                <img src={orderStatus.rider.photo} alt={orderStatus.rider.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-heading font-black text-[22px]">{orderStatus.rider.name?.charAt(0) || 'R'}</span>
              )}
              </div>
              <div className="flex-1 relative z-10">
                <h3 className="font-heading font-black text-gray-900 text-[17px] leading-tight mb-0.5">{orderStatus.rider.name || 'Ramu K.'}</h3>
                <div className="flex items-center text-[12px] font-bold text-gray-500 tracking-wide">
                  <Star size={13} className="text-yellow-500 fill-yellow-500 mr-1" />
                  4.8 • {orderStatus.rider.vehicle || 'Bike'}
                </div>
              </div>
              <div className="flex gap-2 relative z-10">
                <button className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center shadow-sm text-primary transition-colors active:scale-95">
                  <MessageSquare size={20} />
                </button>
                <a href={`tel:${orderStatus.rider.phone || ''}`} className="w-12 h-12 bg-primary hover:bg-primary-hover rounded-full flex items-center justify-center shadow-lg shadow-primary/30 text-white active:scale-95 transition-all">
                  <Phone size={20} className="fill-white" />
                </a>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div className="relative pt-2 pl-2">
            <div className="absolute left-6 top-3 bottom-8 w-1 bg-gray-200 rounded-full"></div>
            {/* Active Track Highlight */}
            <div className="absolute left-6 top-3 w-1 bg-primary rounded-full transition-all duration-700" style={{ height: `${(orderStatus.stageIndex / (stages.length - 1)) * 100}%` }}></div>
            
            {stages.map((stage: string, index: number) => {
              const isCompleted = index <= orderStatus.stageIndex;
              const isCurrent = index === orderStatus.stageIndex;
              
              return (
                <div key={index} className={`flex items-start mb-6 last:mb-2 relative z-10 transition-all duration-500 ${isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs mr-4 transition-all duration-500 shrink-0 ${isCompleted ? 'bg-primary shadow-[0_4px_12px_rgba(232,76,28,0.3)] scale-110 ring-4 ring-orange-50' : 'bg-gray-200 border-2 border-white text-gray-400'}`}>
                    {isCompleted ? <Check size={16} strokeWidth={3.5} /> : <span className="font-bold">{index + 1}</span>}
                  </div>
                  <div className={`pt-2 transition-all duration-500 ${isCurrent ? 'scale-105 origin-left' : ''}`}>
                    <h4 className={`font-black tracking-tight text-[15px] ${isCurrent ? 'text-primary' : 'text-gray-900'}`}>{stage}</h4>
                    {isCurrent && <p className="text-gray-500 text-[12px] font-medium mt-0.5 leading-snug">Your order is currently {stage.toLowerCase()}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function OrderTracking() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <OrderTrackingContent />
    </Suspense>
  )
}

