const fs = require('fs');
const file = 'd:/swaddoapk/swaddo-delivery-app/src/app/active-delivery/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add newJob state and stopRingtone
if (!content.includes('const [newJob, setNewJob] = useState')) {
  content = content.replace(
    /const \[showDeliveryModal, setShowDeliveryModal\] = useState\(false\);/,
    `const [showDeliveryModal, setShowDeliveryModal] = useState(false);\n  const [newJob, setNewJob] = useState<any>(null);\n  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);\n  const riderIdRef = useRef<string | null>(null);\n\n  const stopRingtone = () => {\n    const audio = document.getElementById('ringtone') as HTMLAudioElement;\n    if (audio) {\n      audio.pause();\n      audio.currentTime = 0;\n    }\n  };\n`
  );
}

// 2. Add acceptJob and rejectJob
if (!content.includes('const acceptJob = useCallback')) {
  content = content.replace(
    /const stopRingtone = \(\) => \{[\s\S]*?\};\n/,
    `const stopRingtone = () => {
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
      api.patch(\`/delivery/assignments/\${targetJobId}/reject\`, { riderId }).catch(() => {});
    }
    stopRingtone();
    setNewJob(null);
  }, [newJob]);

  const acceptJob = useCallback(async (jobIdToAccept?: string) => {
    const targetJobId = jobIdToAccept || newJob?.id;
    if (!targetJobId) return;
    
    setAcceptingJobId(targetJobId);
    stopRingtone();
    try {
      const riderId = riderIdRef.current || localStorage.getItem('riderId');
      const apiPromise = api.patch(\`/delivery/assignments/\${targetJobId}/accept\`, {
        riderId: riderId,
        lat: riderLocRef.current?.lat,
        lng: riderLocRef.current?.lng
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please try again.")), 15000)
      );
      
      await Promise.race([apiPromise, timeoutPromise]);
      
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
  }, [newJob, router]);\n`
  );
}

// 3. Add swaddo_new_job event listener
if (!content.includes("window.addEventListener('swaddo_new_job'")) {
  content = content.replace(
    /useEffect\(\(\) => \{\n    \/\/ Fetch order locations/,
    `useEffect(() => {
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
    // Fetch order locations`
  );
}

// 4. Add the modal JSX at the very end before closing ActiveDeliveryContentInner
if (!content.includes('AnimatePresence>\\n        {newJob &&')) {
  content = content.replace(
    /<\/div>\n    <\/div>\n  \);\n\}\n\nfunction ActiveDeliveryContent\(\) \{/,
    `    {/* New Job Modal */}
      <AnimatePresence>
        {newJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-[#10B981] p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -z-0"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/5 rounded-tr-full -z-0"></div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 relative z-10">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-pulse">
                    <Store size={24} className="text-[#10B981]" />
                  </div>
                </div>
                <h3 className="text-white text-2xl font-black mb-1 relative z-10 tracking-tight">New Order!</h3>
                <p className="text-[#10B981] font-bold text-sm bg-white px-3 py-1 rounded-full inline-block uppercase tracking-wider relative z-10">
                  {newJob.returnPayout > 0 ? 'Delivery + Return' : 'Delivery'}
                </p>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Earning</p>
                    <p className="text-2xl font-black text-[#10B981] tracking-tighter">₹{newJob.earnings}</p>
                  </div>
                  <div className="w-[1px] h-10 bg-slate-200"></div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Distance</p>
                    <p className="text-xl font-black text-slate-800 tracking-tighter">{newJob.dropoffDistance} <span className="text-sm font-bold text-slate-400">km</span></p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#10B981]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Store size={16} className="text-[#10B981]" />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pickup From</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">{newJob.stallName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => rejectJob()}
                    disabled={!!acceptingJobId}
                    className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 bg-slate-100 active:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => acceptJob()}
                    disabled={!!acceptingJobId}
                    className="flex-[2] py-3.5 rounded-xl font-black text-white bg-[#10B981] active:bg-[#059669] transition-colors shadow-lg shadow-[#10B981]/30 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {acceptingJobId === newJob.id ? <Loader2 size={18} className="animate-spin" /> : 'Accept Job'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </div>
  );
}

function ActiveDeliveryContent() {`
  );
}

fs.writeFileSync(file, content);
console.log('Patched active-delivery');
