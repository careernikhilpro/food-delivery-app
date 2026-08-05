"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/context/LocationContext";
import { ChevronDown, MapPin, Search, X, Navigation, ArrowLeft, LocateFixed, Plus, Briefcase, Home as HomeIcon, MoreVertical, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { api } from "@/lib/api";

interface LocationSelectorProps {
  isMobile?: boolean;
  customTrigger?: (onClick: () => void) => React.ReactNode;
}

export default function LocationSelector({ isMobile = false, customTrigger }: LocationSelectorProps) {
  const { currentLocation, setCurrentLocation, fullAddress, setFullAddress, setCoordinates, hasSetLocation } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    // Fetch saved addresses if user is logged in
    const token = localStorage.getItem('swaddo_token');
    if (token) {
      api.get('/auth/addresses')
         .then(res => setSavedAddresses(res.data.slice(0, 3)))
         .catch(err => console.error("Failed to fetch addresses:", err));
    }
  }, []);

  // Force open if the user hasn't explicitly set a location yet
  const isMandatoryOpen = mounted && !hasSetLocation;
  const showModal = isOpen || isMandatoryOpen;

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 3) {
      setIsSearching(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
          const res = await fetch(`${baseUrl}/location/autosuggest?query=${encodeURIComponent(query)}`);
          const data = await res.json();
          setResults(data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setResults([]);
    }
  };

  const handleSelectLocation = async (result: any) => {
    setIsSearching(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
      const res = await fetch(`${baseUrl}/location/geocode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: result.description })
      });
      const geocodeData = await res.json();
      
      if (geocodeData.data) {
        setCoordinates(geocodeData.data.lat, geocodeData.data.lng);
        let locationName = result.mainText || (result.description ? result.description.split(",")[0] : (result.title || "Location"));
        setCurrentLocation(locationName);
        setFullAddress(result.description || locationName);
        localStorage.setItem("swaddo_location_type", "manual");
        setIsOpen(false);
      } else {
        alert("Failed to fetch exact location coordinates. Please try another place.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch exact location coordinates.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setCurrentLocation("Locating...");
      setIsOpen(false);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            setCoordinates(latitude, longitude);
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';
            const res = await fetch(`${baseUrl}/location/reverse-geocode`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat: latitude, lng: longitude })
            });
            const data = await res.json();
              if (data && data.data) {
                let locationName = data.data.city || "Location found";
                let fAddr = data.data.address || locationName;
                if (data.data.address) {
                  const parts = data.data.address.split(',').map((s: string) => s.trim()).filter((s: string) => !s.includes('+') && !s.match(/^[A-Z0-9]{4}\+[A-Z0-9]{2,}/));
                  if (parts.length > 0) {
                    locationName = parts[0] + (parts[1] && parts[1] !== data.data.city ? ", " + parts[1] : "");
                  }
                }
                setCurrentLocation(locationName);
                setFullAddress(fAddr);
                localStorage.setItem("swaddo_location_type", "live");
              } else {
                setCurrentLocation("Current Location"); // Fallback text so UI doesn't break
                setFullAddress("Current Location");
                localStorage.setItem("swaddo_location_type", "live");
            }
          } catch (err) {
            console.error(err);
            setCurrentLocation("Current Location");
            localStorage.setItem("swaddo_location_type", "live");
          }
        },
        (error) => {
          console.error("GPS Denied/Failed", error);
          if (!hasSetLocation) {
             setIsOpen(true); // Re-open modal if they denied GPS and hadn't set location
          }
        }
      );
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {customTrigger ? (
        customTrigger(() => setIsOpen(true))
      ) : isMobile ? (
        <div className="flex flex-col justify-center cursor-pointer" onClick={() => setIsOpen(true)}>
          <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider leading-none mb-1">Delivering to</span>
          <div className="flex items-center gap-1 font-heading font-bold text-sm leading-none text-text-primary whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
            {currentLocation || "Set Location"} <ChevronDown size={14} className="text-primary shrink-0" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-text-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsOpen(true)}>
          <MapPin size={22} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider leading-tight">Delivering to</span>
            <div className="flex items-center gap-1 font-heading font-semibold text-sm">
              {currentLocation || "Set Location"} <ChevronDown size={14} className="text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] flex flex-col overflow-y-auto w-full h-full">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="w-full h-full flex flex-col bg-[#f8f9fa]"
            >
              {/* Header */}
              <div className="flex items-center px-4 py-3 pt-5 bg-white sticky top-0 z-10">
                <button onClick={() => setIsOpen(false)} className="p-1 -ml-1">
                  <ArrowLeft size={22} strokeWidth={2} className="text-gray-800" />
                </button>
                <h2 className="text-[17px] font-bold text-gray-900 ml-3">Select Your Location</h2>
              </div>

              {/* Search Bar */}
              <div className="px-4 py-2 bg-white">
                <div className="relative flex items-center w-full h-[46px] bg-white border border-gray-200 rounded-full px-4">
                  <input 
                    type="text" 
                    placeholder="Search an area or address"
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full bg-transparent outline-none text-[14px] text-gray-800 placeholder:text-gray-400"
                  />
                  <Search className="text-gray-400 shrink-0 ml-2" size={18} />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 px-4 py-4 bg-white pb-6">
                <button 
                  onClick={handleUseCurrentLocation}
                  className="flex-1 flex items-center justify-center gap-2 h-[42px] bg-white border border-gray-200 rounded-[10px] text-[13px] font-semibold text-gray-700"
                >
                  <LocateFixed size={16} strokeWidth={2.5} className="text-green-700" />
                  Use Current Location
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 h-[42px] bg-white border border-gray-200 rounded-[10px] text-[13px] font-semibold text-gray-700">
                  <Plus size={18} strokeWidth={2.5} className="text-green-700" />
                  Add New Address
                </button>
              </div>

              <div className="w-full h-2 bg-[#f8f9fa]"></div>
              {/* Saved Addresses Section */}
              <div className="px-4 py-5">
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">SAVED ADDRESSES</h3>
                
                <div className="bg-white rounded-[16px] flex flex-col overflow-hidden mb-6">
                  {savedAddresses.length > 0 ? (
                    savedAddresses.map((addr: any, idx: number) => (
                      <div 
                        key={addr.id || idx} 
                        className={`flex items-start gap-3 p-4 ${idx < savedAddresses.length - 1 ? 'border-b border-gray-100' : ''} cursor-pointer hover:bg-gray-50`}
                        onClick={() => {
                          setCoordinates(addr.lat, addr.lng);
                          setCurrentLocation(addr.full_address || addr.name);
                          setFullAddress(addr.full_address || addr.name);
                          localStorage.setItem("swaddo_location_type", "saved");
                          setIsOpen(false);
                        }}
                      >
                        <div className="w-[42px] h-[42px] rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                          {addr.tag === 'Home' ? <HomeIcon size={18} strokeWidth={1.5} className="text-gray-800" /> : <Briefcase size={18} strokeWidth={1.5} className="text-gray-800" />}
                        </div>
                        <div className="flex-1 flex flex-col justify-center pt-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[15px] text-gray-900">{addr.tag || 'Saved Address'}</span>
                            <button className="text-gray-600"><MoreVertical size={18} strokeWidth={2} /></button>
                          </div>
                          <span className="text-[13px] text-gray-500 leading-snug mt-1 pr-4 line-clamp-2">
                            {addr.full_address || `${addr.house_number}, ${addr.name}`}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">No saved addresses found</div>
                  )}
                </div>

                {/* Recently Searched */}
                <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2">RECENTLY SEARCHED</h3>
                
                <div className="bg-white rounded-[16px] p-4 flex items-start gap-3">
                  <div className="w-[42px] h-[42px] rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Clock size={18} strokeWidth={1.5} className="text-gray-800" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center pt-0.5">
                    <span className="font-bold text-[15px] text-gray-900 line-clamp-1 pr-2">{currentLocation || "Location Search"}</span>
                    <span className="text-[13px] text-gray-500 leading-snug mt-1 line-clamp-1">{fullAddress || "Select a location to see address"}</span>
                  </div>
                </div>

              </div>
              
              {/* If user is actively searching, show results */}
              {isSearching && <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>}
              {!isSearching && results.length > 0 && (
                <div className="px-4 pb-6 mt-4">
                   <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-3">SEARCH RESULTS</h3>
                   <div className="bg-white rounded-[20px] shadow-sm flex flex-col overflow-hidden">
                     {results.map((result, idx) => (
                       <button 
                         key={idx}
                         onClick={() => handleSelectLocation(result)}
                         className={`w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 transition-colors ${idx !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
                       >
                         <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                           <MapPin size={18} className="text-gray-600" />
                         </div>
                         <div className="flex-1 flex flex-col">
                           <span className="font-bold text-[15px] text-gray-900 line-clamp-1">{result.mainText || result.title || result.description}</span>
                           <span className="text-[13px] text-gray-500 line-clamp-2 mt-1 leading-tight">{result.description}</span>
                         </div>
                       </button>
                     ))}
                   </div>
                </div>
              )}
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
