const fs = require('fs');
const file = 'swaddo-delivery-app/src/app/home/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const useEffectRegex = /useEffect\(\(\) => \{\n    if \(\!mounted\) return; \/\/ Prevent overwriting localStorage[\s\S]*?\/\/ eslint-disable-next-line react-hooks\/exhaustive-deps\n  \}, \[isOnline, mounted\]\);/;

const replacement = \
  const toggleOnlineStatus = async (newStatus: boolean) => {
    if (newStatus) {
      if (stats.floatingCash >= 2000) {
        alert("Your floating cash limit (?2000) has been reached. Please deposit cash to go online and receive new orders.");
        return;
      }
      try {
        if (Capacitor.isNativePlatform()) {
          const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');
          
          let watcherId;
          watcherId = await BackgroundGeolocation.addWatcher(
            {
              backgroundMessage: "Swaddo is tracking your location to assign deliveries.",
              backgroundTitle: "Delivery Tracking Active",
              requestPermissions: true,
              stale: false,
              distanceFilter: 10 // meters
            },
            function callback(location, error) {
              if (error) {
                if (error.code === "NOT_AUTHORIZED") {
                  if (window.confirm("This app needs your location to assign orders, but does not have permission.")) {
                    BackgroundGeolocation.openSettings();
                  }
                }
                return;
              }
              
              if (location) {
                setCurrentLocation({ lat: location.latitude, lng: location.longitude });
                api.post("/delivery/ping", { lat: location.latitude, lng: location.longitude }).catch(() => {});
                
                const currentSocket = getSocket();
                if (currentSocket) {
                  const riderId = riderIdRef.current || localStorage.getItem("riderId");
                  currentSocket.emit("rider_sync_location", { riderId, lat: location.latitude, lng: location.longitude });
                }
              }
            }
          );
          setWatchId(watcherId);
          
          const { Geolocation } = await import('@capacitor/geolocation');
          const firstPos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
          await api.post("/delivery/ping", { lat: firstPos.coords.latitude, lng: firstPos.coords.longitude });
        }
        
        await api.post("/delivery/status", { status: "online" });
        setIsOnline(true);
        localStorage.setItem("isOnline", "true");
        
      } catch (err) {
        console.error("Failed to go online", err);
        alert("Failed to access location or backend. Cannot go online.");
      }
    } else {
      try {
        if (Capacitor.isNativePlatform() && watchId !== null) {
          const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');
          BackgroundGeolocation.removeWatcher({ id: watchId as string });
          setWatchId(null);
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
              return null;
            }
            return prev;
          });
        });

        socket?.on("job_accepted_by_me", (payload) => {
          setNewJob(null);
          localStorage.setItem("currentJob", JSON.stringify(payload));
          localStorage.setItem('activeDelivery', \\\job_\\\\\\);
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
        api.post('/delivery/ping-time').catch(console.error);
        setStats(prev => ({ ...prev, hours: prev.hours + 1 }));
      }, 30000); 
    }

    return () => {
      disconnectSocket();
      if (pingTimer) clearInterval(pingTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, mounted]);
\;

content = content.replace(useEffectRegex, replacement);

content = content.replace(/setIsOnline\(\!isOnline\)/g, "toggleOnlineStatus(!isOnline)");
content = content.replace(/setIsOnline\(true\)/g, "toggleOnlineStatus(true)");
content = content.replace(/setIsOnline\(false\)/g, "toggleOnlineStatus(false)");

fs.writeFileSync(file, content);
