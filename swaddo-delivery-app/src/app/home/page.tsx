"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { connectSocket, disconnectSocket, getSocket } from "@/lib/socket";
import { api } from "@/lib/api";
import { Navigation, Menu, Settings, LogOut, CheckCircle, Clock, MapPin, Store, ChevronRight, X, User, Volume2, Siren, CheckCircle2, XCircle, Package, BellRing, Loader2 } from "lucide-react";
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';

const LocationService = registerPlugin<any>('LocationService');
import { Preferences } from '@capacitor/preferences';
import { useRouter, useSearchParams } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useWebPush } from "@/hooks/usePushNotifications";

import Link from "next/link";

function HomeContent() {
  useAuth();
  useWebPush();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isOnline") === "true";
    }
    return false;
  });
  const [watchId, setWatchId] = useState<string | number | null>(null);
  const [newJob, setNewJob] = useState<any>(null);
  const [timer, setTimer] = useState(300);
  const [stats, setStats] = useState({ deliveries: 0, earnings: 0, floatingCash: 0, hours: 0 });
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('soundPermission') === 'granted';
    }
    return false;
  });
  const riderIdRef = useRef<string>("");
  const alarmAudio = useRef<HTMLAudioElement | null>(null);
  const acceptSliderRef = useRef<HTMLDivElement>(null);
  const [isAccepted, setIsAccepted] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    // Initialize audio
    alarmAudio.current = new Audio('/orderring.mp3');
    alarmAudio.current.volume = 1.0;
    alarmAudio.current.loop = true;

      const storedRiderId = localStorage.getItem("riderId");
      let currentRiderId = storedRiderId;
      
      if (!currentRiderId) {
          try {
              const token = localStorage.getItem("swaddo_delivery_token");
              if (token) {
                  const base64Url = token.split('.')[1];
                  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                  const payload = JSON.parse(window.atob(base64));
                  if (payload && payload.id) {
                      currentRiderId = payload.id.toString();
                      localStorage.setItem("riderId", currentRiderId as string);
                  }
              }
          } catch (e) {
              console.error("Failed to parse token for riderId", e);
          }
      }
      
      if (currentRiderId) {
          riderIdRef.current = currentRiderId;
          Preferences.set({ key: 'riderId', value: currentRiderId });
      } else {
          console.error("NO RIDER ID FOUND!");
      }

    const savedOnline = localStorage.getItem("isOnline");
    if (savedOnline === "true") {
      setIsOnline(true);
    }
    const savedJob = localStorage.getItem("pendingJob");
    const savedTimer = localStorage.getItem("pendingTimer");
    if (savedJob && savedTimer) {
      const remaining = parseInt(savedTimer) - Math.floor(Date.now() / 1000);
      if (remaining > 0) {
        setNewJob(JSON.parse(savedJob));
        setTimer(remaining);
      } else {
        localStorage.removeItem("pendingJob");
        localStorage.removeItem("pendingJob");
        localStorage.removeItem("pendingTimer");
      }
    }
    
    // Cache dashboard stats to prevent loaders
    const cachedStats = sessionStorage.getItem("dashboardStats");
    if (cachedStats) {
      try {
        setStats(JSON.parse(cachedStats));
      } catch (e) {}
    }

    // Fetch real performance stats from backend
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/delivery/dashboard');
        if (res.data) {
          const newStats = {
            deliveries: res.data.deliveries || 0,
            earnings: res.data.earnings || 0,
            floatingCash: res.data.floatingCash || 0,
            hours: res.data.hours || 0
          };
          
          const newStr = JSON.stringify(newStats);
          const oldStr = sessionStorage.getItem("dashboardStats");
          if (newStr !== oldStr) {
            setStats(newStats);
            sessionStorage.setItem("dashboardStats", newStr);
          }

          // Auto offline if limit exceeded while online
          if (res.data.floatingCash >= 2000 && isOnline) {
            alert("Floating cash limit reached. You have been taken offline. Please deposit cash to receive more orders.");
            toggleOnlineStatus(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      }
    };
    
    const fetchActiveAssignments = async () => {
      try {
        const res = await api.get('/delivery/assignments/active');
        if (res.data && res.data.data) {
           const allAssignments = res.data.data;
           const active = allAssignments.filter((a: any) => a.assignmentStatus !== 'assigned');
           setActiveAssignments(active);
           
           const assigned = allAssignments.find((a: any) => a.assignmentStatus === 'assigned');
           if (assigned) {
             const payload = {
                id: 'job_' + assigned.orderId,
                dropoffDistance: assigned.pickupDistance,
                earnings: assigned.earnings,
                customerName: assigned.customerName,
                itemCount: 1, 
                itemsSummary: "Accept to see details",
                stallName: assigned.stallName,
                pickupLat: assigned.stallLat,
                pickupLng: assigned.stallLng,
                deliveryLat: assigned.deliveryLat,
                deliveryLng: assigned.deliveryLng,
                returnPayout: assigned.pickupPayout || 0
             };
             setNewJob((prev: any) => prev ? prev : payload);
             localStorage.setItem("pendingJob", JSON.stringify(payload));
           }
        }
      } catch (e) {
        console.error("Failed to fetch active assignments", e);
      }
    };
    
    fetchDashboardStats();
    fetchActiveAssignments();
    
    // Auto-refresh stats every 30 seconds
    const statsInterval = setInterval(() => {
        fetchDashboardStats();
        fetchActiveAssignments();
    }, 30000);
    
    // Refresh stats when app returns to foreground
    const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
       if (isActive) {
           fetchDashboardStats();
           fetchActiveAssignments();
       }
    });
    
    setMounted(true);
    
    return () => {
        clearInterval(statsInterval);
        appStateListener.then(listener => listener.remove()).catch(() => {});
    };
  }, [isOnline]);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mounted || !isOnline) return;

    let checking = false;
    const checkBattery = async () => {
      if (checking) return;
      checking = true;
      try {
        if (Capacitor.isNativePlatform()) {
          const { Device } = await import('@capacitor/device');
          const batteryInfo = await Device.getBatteryInfo();
          let level = batteryInfo.batteryLevel;
          if (level !== undefined) {
             if (level > 1.0) level = level / 100.0;
             if (level < 0.15 && !batteryInfo.isCharging) {
               const activeJob = localStorage.getItem("activeDelivery");
               if (!activeJob) {
                 alert("Battery below 15%. Going offline automatically.");
                 try {
                   await api.post("/delivery/status", { status: "offline" });
                 } catch (e) {}
                 setIsOnline(false);
                 localStorage.setItem("isOnline", "false");
                 window.location.reload(); // Force full reset to clear watchers cleanly
               }
             }
          }
        }
      } catch (err) {
        console.error("Battery check failed:", err);
      } finally {
        checking = false;
      }
    };

    checkBattery(); // Check immediately on mount/re-render
    const batteryTimer = setInterval(checkBattery, 60000); // Check every 60 seconds
    return () => clearInterval(batteryTimer);
  }, [mounted, isOnline]);

  const toggleOnlineStatus = async (newStatus: boolean) => {
    if (newStatus) {
      if (stats.floatingCash >= 2000) {
        alert("Your floating cash limit (₹2000) has been reached. Please deposit cash to go online and receive new orders.");
        return;
      }
      try {
        if (Capacitor.isNativePlatform()) {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.set({ key: 'swaddo_api_url', value: process.env.NEXT_PUBLIC_API_URL || "https://food-delivery-app-wfv0.onrender.com" });
          
          const { Device } = await import('@capacitor/device');
          const batteryInfo = await Device.getBatteryInfo();
          let level = batteryInfo.batteryLevel;
          if (level !== undefined) {
             if (level > 1.0) level = level / 100.0; // normalize 8% (returns 8) to 0.08
             if (level < 0.15 && !batteryInfo.isCharging) {
               alert("Battery is below 15%. Please charge your phone to go online.");
               return;
             }
          }
          
          const riderId = riderIdRef.current || localStorage.getItem("riderId");
          const token = localStorage.getItem("token") || "";
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://food-delivery-app-wfv0.onrender.com";
          
          // Request permissions FIRST before starting Native Location Service
          const { Geolocation } = await import('@capacitor/geolocation');
          
          let perm = await Geolocation.checkPermissions();
          if (perm.location !== 'granted') {
             perm = await Geolocation.requestPermissions();
             if (perm.location !== 'granted') {
                 alert("Location permission is required to go online.");
                 return;
             }
          }

          // Get first location to ensure we have a fix before going online
          try {
              const firstPos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
              await api.post("/delivery/ping", { lat: firstPos.coords.latitude, lng: firstPos.coords.longitude });
          } catch (e) {
              console.log("Initial location fetch timed out, proceeding anyway", e);
          }

          // Now start the background service safely
          await LocationService.startService({
             riderId: String(riderId),
             apiUrl: String(apiUrl),
             authToken: String(token)
          });
          
          // Listen to native broadcast for local UI updates
          if ((window as any).locationListener) {
              (window as any).locationListener.remove();
          }
          (window as any).locationListener = await LocationService.addListener('locationUpdate', (location: any) => {
             setCurrentLocation({ lat: location.lat, lng: location.lng });
             const currentSocket = getSocket();
             if (currentSocket && riderId) {
                 currentSocket.emit("rider_sync_location", { riderId, lat: location.lat, lng: location.lng });
             }
          });
        } else {
          // Web fallback
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
          });
          await api.post("/delivery/ping", { lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
        
        await api.post("/delivery/status", { status: "online" });
        setIsOnline(true);
        localStorage.setItem("isOnline", "true");
        
      } catch (err: any) {
        console.error("Failed to go online", err);
        const errorMsg = err?.message || err?.toString() || "Unknown error";
        alert("Error going online: " + errorMsg);
      }
    } else {
      try {
        if (Capacitor.isNativePlatform()) {
          try {
              await LocationService.stopService();
          } catch (e) {
              console.log("Error stopping native service", e);
          }
          if ((window as any).locationListener) {
              (window as any).locationListener.remove();
          }
        }
        await api.post("/delivery/status", { status: "offline" });
        setIsOnline(false);
        localStorage.setItem("isOnline", "false");
        disconnectSocket();
      } catch (err) {
        console.error("Failed to go offline", err);
      }
    }
  };

  useEffect(() => {
    if (!mounted) return;

    if (isOnline) {
      localStorage.setItem("isOnline", "true");
      const socket = connectSocket();
      
      const emitOnline = () => {
          const riderId = riderIdRef.current || localStorage.getItem("riderId");
          socket?.emit("rider_online", { riderId, lat: currentLocation?.lat, lng: currentLocation?.lng });
        };
        
        socket?.on("connect", emitOnline);
        if (socket?.connected) {
          emitOnline();
        }

        socket?.on("job_offer", (data) => {
          setNewJob(data);
          setTimer(300);
          localStorage.setItem("pendingJob", JSON.stringify(data));
          localStorage.setItem("pendingTimer", (Math.floor(Date.now() / 1000) + 300).toString());
        });

        socket?.on("job_revoked", (payload) => {
          setNewJob((prev: any) => {
            if (prev && prev.id === payload.id) {
              localStorage.removeItem("pendingJob");
              localStorage.removeItem("pendingTimer");
              return null;
            }
            return prev;
          });
        });

        socket?.on("job_accepted_by_me", (payload) => {
          setNewJob(null);
          localStorage.setItem("currentJob", JSON.stringify(payload));
          localStorage.setItem('activeDelivery', `job_${payload.id}`);
          router.push(`/active-delivery?id=job_${payload.id}`);
        });
        
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NEW_ORDER_PUSH') {
              setNewJob(event.data.data);
            }
          });
        }
    } else {
      localStorage.setItem("isOnline", "false");
      disconnectSocket();
    }

    let pingTimer: NodeJS.Timeout;
    if (isOnline) {
      pingTimer = setInterval(() => {
        // Send heartbeat for online hours
        api.post('/delivery/ping-time').catch(console.error);
        setStats(prev => ({ ...prev, hours: prev.hours + 1 }));

        api.get('/delivery/assignments/active').then(res => {
          if (res.data && res.data.data) {
             const allAssignments = res.data.data;
             const active = allAssignments.filter((a: any) => a.assignmentStatus !== 'assigned');
             setActiveAssignments(active);
             
             const assigned = allAssignments.find((a: any) => a.assignmentStatus === 'assigned');
             if (assigned) {
               const payload = {
                  id: 'job_' + assigned.orderId,
                  dropoffDistance: assigned.pickupDistance,
                  earnings: assigned.earnings,
                  customerName: assigned.customerName,
                  itemCount: 1, 
                  itemsSummary: "Accept to see details",
                  stallName: assigned.stallName,
                  pickupLat: assigned.stallLat,
                  pickupLng: assigned.stallLng,
                  deliveryLat: assigned.deliveryLat,
                  deliveryLng: assigned.deliveryLng,
                  returnPayout: assigned.pickupPayout || 0
               };
               setNewJob((prev: any) => prev ? prev : payload);
               localStorage.setItem("pendingJob", JSON.stringify(payload));
             }
          }
        }).catch(() => {});

        // Force a location ping every 15s so the rider stays fresh in the 30s assignment window
        // even if they are stationary and the background watcher doesn't trigger.
        Geolocation.getCurrentPosition({ enableHighAccuracy: true }).then(pos => {
          api.post("/delivery/ping", { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {});
        }).catch(err => console.error("Interval location error:", err));
        
      }, 15000); 
    }

    return () => {
      disconnectSocket();
      if (pingTimer) clearInterval(pingTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, mounted]);

  // Make sure we remove the event listener safely
  useEffect(() => {
    const handleCustomNewJob = (e: any) => {
      if (isOnline) {
        console.log('Custom new job event received:', e.detail);
        setNewJob(e.detail);
        setTimer(300);
        localStorage.setItem("pendingJob", JSON.stringify(e.detail));
        localStorage.setItem("pendingTimer", (Math.floor(Date.now() / 1000) + 300).toString());
      }
    };
    window.addEventListener('swaddo_new_job', handleCustomNewJob);
    return () => window.removeEventListener('swaddo_new_job', handleCustomNewJob);
  }, [isOnline]);

  // Timer auto-decline logic REMOVED intentionally 
  // so the order stays on screen indefinitely until the rider acts on it.
  // Robust State-Driven Ringing Logic
  useEffect(() => {
    if (newJob && soundEnabled && alarmAudio.current && alarmAudio.current.paused) {
      alarmAudio.current.play().catch(e => console.log('Autoplay blocked:', e));
    } else if (!newJob && alarmAudio.current && !alarmAudio.current.paused) {
      alarmAudio.current.pause();
      alarmAudio.current.currentTime = 0;
    }
  }, [newJob, soundEnabled]);

  const acceptJob = useCallback(async (jobIdToAccept?: string | any) => {
    const targetJobId = (typeof jobIdToAccept === 'string') ? jobIdToAccept : newJob?.id;
    if (!targetJobId) return;
    try {
      const res = await api.patch(`/delivery/assignments/${targetJobId}/accept`, {
        riderId: riderIdRef.current,
        lat: currentLocation?.lat,
        lng: currentLocation?.lng
      });
      // Store active delivery to prevent navigating away
      localStorage.setItem('activeDelivery', targetJobId);
      
      localStorage.removeItem("pendingJob");
      localStorage.removeItem("pendingTimer");
      setNewJob(null);
      router.push(`/active-delivery?id=${targetJobId}`);
    } catch (err: any) {
      console.log(err.message);
      alert(err.response?.data?.message || "Failed to accept job");
      setNewJob(null);
      setIsAccepted(false);
      localStorage.removeItem("pendingJob");
      localStorage.removeItem("pendingTimer");
    }
  }, [newJob?.id, currentLocation, router]);

  const rejectJob = useCallback((jobIdToReject?: string) => {
    // Optionally call an endpoint to explicitly reject
    setNewJob(null);
    localStorage.removeItem("pendingJob");
    localStorage.removeItem("pendingTimer");
  }, []);

  // Handle Push Notification Actions (from URL or active Window)
  useEffect(() => {
    const action = searchParams.get('action');
    const actionOrderId = searchParams.get('orderId');
    if (action && actionOrderId) {
      if (action === 'accept') {
         acceptJob(actionOrderId).finally(() => {
           router.replace('/home');
         });
      } else {
         rejectJob(actionOrderId);
         router.replace('/home');
      }
    }
  }, [searchParams, acceptJob, rejectJob, router]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
        const { action, payload } = event.data;
        if (payload?.orderId) {
          if (action === 'accept') {
             acceptJob(payload.orderId);
          } else {
             rejectJob(payload.orderId);
          }
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
  }, [acceptJob, rejectJob]);

  useEffect(() => {
    if (!mounted) return;
    const checkNativeAutoAccept = async () => {
      try {
        const { value } = await Preferences.get({ key: 'auto_accept_order' });
        if (value === 'true') {
          if (newJob) {
            await Preferences.remove({ key: 'auto_accept_order' });
            await acceptJob(newJob.id);
          }
        }
      } catch (e) {}
    };
    const interval = setInterval(checkNativeAutoAccept, 1500);
    return () => clearInterval(interval);
  }, [mounted, newJob, acceptJob]);

  if (!mounted) return null; // Prevent UI flicker on mount

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] overflow-hidden pt-5 px-5 pb-4 max-w-md mx-auto relative bg-[#F8FAFC]">
      
      {/* Sound Permission Overlay */}
      <AnimatePresence>
        {!soundEnabled && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center p-5"
          >
            <div className="bg-white rounded-3xl p-6 text-center max-w-[280px] w-full shadow-2xl">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Volume2 size={28} />
              </div>
              <h3 className="text-lg font-bold mb-2">Enable Sound</h3>
              <p className="text-gray-500 mb-5 text-[13px] leading-relaxed">Please tap below to allow order ringtones to play in the background.</p>
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
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform"
              >
                Allow Sound
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Toggle */}
      <div className="flex items-center justify-between mb-5 bg-white p-4 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-end gap-2 mb-1.5">
              <h1 className="text-[28px] font-black tracking-tight text-slate-900 leading-none">Status</h1>
              {currentTime && (
                <span className="text-[12px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
            <p className="text-[13px] font-medium text-slate-500">
              {isOnline ? (
                <span className="text-[#10B981] font-bold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>Online & Ready</span>
              ) : "Currently Offline"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert("SOS Emergency Activated! Alerting authorities and support team.")}
            className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-sm border border-red-100 active:scale-95 transition-all hover:bg-red-100"
          >
            <Siren size={24} strokeWidth={2.5} />
          </button>
          
          {/* Large Premium Toggle */}
          <button 
            onClick={() => {
              if (!isOnline && stats.floatingCash >= 2000) {
                alert("Your floating cash limit (₹2000) has been reached. Please deposit cash to go online and receive new orders.");
                return;
              }
              toggleOnlineStatus(!isOnline);
            }}
            className={`w-[72px] h-10 rounded-full flex items-center p-1 transition-all duration-500 shadow-inner ${
              isOnline ? "bg-[#10B981]" : "bg-slate-200"
            }`}
          >
            <motion.div 
              className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center"
              initial={false}
              animate={{ x: isOnline ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {isOnline ? <CheckCircle2 size={18} className="text-[#10B981]" /> : <XCircle size={18} className="text-slate-400" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Active Assignments */}
      {activeAssignments.length > 0 && (
        <div className="mb-5">
          <h2 className="text-[16px] font-black text-slate-800 mb-3 tracking-tight px-1 flex items-center justify-between">
            <span>Current Tasks</span>
            <span className="bg-[#10B981] text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{activeAssignments.length} ACTIVE</span>
          </h2>
          <div className="flex flex-col gap-3">
            {activeAssignments.map((a: any, idx: number) => {
               const isHeadingToStall = a.orderStatus === 'heading_to_stall' || a.orderStatus === 'assigned';
               const isAtStall = a.orderStatus === 'at_stall';
               return (
                 <div key={a.orderId} onClick={() => router.push(`/active-delivery?id=job_${a.orderId}`)} className="bg-white rounded-[20px] p-4 border-2 border-[#10B981]/20 shadow-[0_4px_16px_rgba(16,185,129,0.05)] cursor-pointer active:scale-[0.98] transition-transform flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                         {isHeadingToStall || isAtStall ? <Store size={20} /> : <User size={20} />}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#10B981] mb-0.5 uppercase tracking-wide">
                          {isHeadingToStall ? 'Go to Stall' : isAtStall ? 'Pickup Order' : 'Deliver Order'}
                        </p>
                        <p className="text-[14px] font-black text-slate-800">
                          Order #{String(a.orderId).slice(-4).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-400" />
                 </div>
               )
            })}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <h2 className="text-[16px] font-black text-slate-800 mb-3 tracking-tight px-1">Today's Performance</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-tl-[24px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px] p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center transition-transform hover:-translate-y-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-1 flex items-center gap-1.5"><Package size={14} className="text-[#10B981]"/> Deliveries</span>
          <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats.deliveries}</span>
        </div>
        <div className="bg-white rounded-tl-[24px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px] p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center transition-transform hover:-translate-y-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-1 flex items-center gap-1.5">Earnings</span>
          <span className="text-3xl font-black text-[#10B981] tracking-tighter">₹{stats.earnings}</span>
        </div>
        <div className="bg-white rounded-tl-[24px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px] p-4 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center transition-transform hover:-translate-y-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] mb-1 flex items-center gap-1.5"><Clock size={14} className="text-blue-500"/> Online Time</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-[22px] font-black text-slate-800 tracking-tight">
              {Math.floor(stats.hours / 60)}<span className="text-[12px] font-bold text-slate-400 ml-0.5 mr-1">h</span>
              {stats.hours % 60}<span className="text-[12px] font-bold text-slate-400 ml-0.5">m</span>
            </span>
          </div>
        </div>
        <Link href="/floating-cash" className={`bg-white rounded-tl-[24px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-center transition-all hover:-translate-y-0.5 active:scale-95 ${stats.floatingCash >= 2000 ? 'border-2 border-red-500 bg-red-50/50' : 'border border-slate-100 relative overflow-hidden'}`}>
          {stats.floatingCash < 2000 && <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/5 rounded-bl-[24px] -z-0"></div>}
          <div className="flex justify-between items-center mb-1 relative z-10">
            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${stats.floatingCash >= 2000 ? 'text-red-600' : 'text-slate-400'}`}>Float Cash</span>
          </div>
          <span className={`text-[26px] font-black tracking-tighter relative z-10 leading-none ${stats.floatingCash >= 2000 ? 'text-red-600' : 'text-orange-500'}`}>₹{stats.floatingCash}</span>
          <div className="flex items-center gap-1.5 mt-1.5">
             <span className="text-[9px] font-semibold text-slate-400">Limit: ₹2000</span>
             {stats.floatingCash >= 2000 && (
               <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Deposit!</span>
             )}
          </div>
        </Link>
      </div>

      {/* Main Illustration Area */}
      <div className="flex-1 flex flex-col items-center justify-center mt-2 relative min-h-[140px]">
        {isOnline ? (
          <div className="relative flex flex-col items-center justify-center h-32 w-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#10B981]/10 rounded-full animate-ping"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[#10B981]/20 rounded-full animate-pulse"></div>
            <div className="w-14 h-14 bg-white rounded-full border-[3px] border-[#10B981]/30 flex items-center justify-center relative z-10 shadow-[0_4px_16px_rgba(16,185,129,0.4)]">
               <MapPin size={24} className="text-[#10B981] animate-bounce mt-1" strokeWidth={2.5} />
            </div>
            <p className="text-center text-[#10B981] text-[13px] font-bold mt-4 tracking-wide relative z-10">Searching for nearby orders...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center opacity-80 justify-center w-full">
            <div className="w-14 h-14 rounded-[16px] bg-slate-200/60 flex items-center justify-center mb-3 rotate-3 transition-transform hover:rotate-0 shadow-sm border border-slate-200">
              <Navigation size={24} className="text-slate-400" strokeWidth={2.5} />
            </div>
            <h3 className="text-[20px] font-black text-slate-800 tracking-tight leading-none">You're Offline</h3>
            <p className="text-[12px] font-medium text-slate-500 mt-2 max-w-[200px] leading-snug">Go online to start receiving delivery requests.</p>
          </div>
        )}
      </div>

      {/* Job Offer Modal (Full Screen) */}
      <AnimatePresence>
        {newJob && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col justify-center items-center p-6"
          >
            <div className="absolute inset-0 bg-[#10B981]/5 backdrop-blur-3xl -z-10"></div>
            
            <motion.div 
              animate={{ scale: [1, 1.1, 1], rotate: [0, -10, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-20 h-20 bg-[#10B981] rounded-full flex items-center justify-center mb-6 shadow-[0_8px_32px_rgba(16,185,129,0.4)] relative"
            >
              <div className="absolute inset-0 rounded-full border-4 border-[#10B981]/30 animate-ping"></div>
              <BellRing size={36} className="text-white relative z-10" />
            </motion.div>
            
            <h2 className="text-[28px] font-black tracking-tight text-slate-900 mb-1 text-center leading-none">New Delivery!</h2>
            <p className="text-slate-500 mb-8 text-center text-sm font-bold tracking-wide">Review order details below</p>
            
            <div className="bg-white rounded-[24px] w-full p-6 shadow-[0_8px_40px_rgba(0,0,0,0.08)] mb-8 space-y-4 border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#10B981]/10 rounded-bl-full -z-0"></div>
              
              <div className="flex items-center gap-3 relative z-10 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <Store className="text-slate-700" size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup From</p>
                  <span className="font-black text-slate-800 text-[16px] leading-none block">{newJob.stallName || "Restaurant"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10 py-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1.5">
                    <MapPin size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Pickup</span>
                  </div>
                  <span className="font-black text-slate-800 text-lg leading-none">{(newJob.pickupDistance && newJob.pickupDistance !== 999999) ? `${newJob.pickupDistance} km` : "---"}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1.5">
                    <Navigation size={14} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Drop-off</span>
                  </div>
                  <span className="font-black text-slate-800 text-lg leading-none">{newJob.dropoffDistance ? `${newJob.dropoffDistance} km` : "---"}</span>
                </div>
              </div>

              {/* Itemized Payout Section */}
              <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-100 relative z-10">
                {/* Pickup Payout */}
                {newJob.pickupPayout !== undefined && newJob.pickupPayout > 0 && (
                  <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-[12px] border border-emerald-100">
                    <span className="text-[12px] uppercase font-bold text-emerald-600 tracking-wider">Pickup Pay</span>
                    <span className="text-[18px] font-black text-emerald-700">₹{parseFloat(newJob.pickupPayout).toFixed(2)}</span>
                  </div>
                )}
                
                {/* Delivery Base Payout */}
                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-[12px] border border-slate-100">
                    <span className="text-[12px] uppercase font-bold text-slate-500 tracking-wider">Delivery Pay</span>
                    <span className="text-[18px] font-black text-slate-700">₹{parseFloat(newJob.earnings || newJob.deliveryPay || "15").toFixed(2)}</span>
                  </div>

                {/* Return Payout */}
                {newJob.returnPayout !== undefined && newJob.returnPayout > 0 && (
                  <div className="flex justify-between items-center bg-blue-50/50 p-2.5 rounded-[12px] border border-blue-100">
                    <span className="text-[12px] uppercase font-bold text-blue-600 tracking-wider">Return Pay</span>
                    <span className="text-[18px] font-black text-blue-700">₹{parseFloat(newJob.returnPayout).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end pt-4 mt-2 relative z-10">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Total Payout</span>
                <span className="text-[32px] font-black tracking-tighter text-[#10B981] leading-none">₹{parseFloat(newJob.totalPayout || newJob.earnings || newJob.deliveryPay || "15").toFixed(1)}</span>
              </div>
            </div>

            <div className="w-full">
              <button
                onClick={() => {
                  if (!isAccepted) {
                    setIsAccepted(true);
                    acceptJob();
                  }
                }}
                disabled={isAccepted}
                className={`w-full h-[68px] rounded-[24px] flex items-center justify-center font-black tracking-widest text-[16px] shadow-[0_8px_24px_rgba(16,185,129,0.3)] transition-all ${
                  isAccepted 
                    ? 'bg-slate-400 text-white cursor-not-allowed' 
                    : 'bg-[#10B981] text-white active:scale-[0.98] active:bg-[#059669]'
                }`}
              >
                {isAccepted ? (
                  <Loader2 className="animate-spin text-white" size={28} strokeWidth={3} />
                ) : (
                  "ACCEPT ORDER"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <AnimatePresence>
        {mounted && !newJob && !isOnline && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-6 right-6 z-40"
          >
            <button 
              onClick={() => toggleOnlineStatus(true)}
              className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-white py-4 rounded-[20px] font-black tracking-wide text-lg shadow-[0_12px_32px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/20"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
              GO ONLINE NOW
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
