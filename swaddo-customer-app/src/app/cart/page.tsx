"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  MapPin,
  Wallet,
  CreditCard,
  Banknote,
  ChevronDown,
  ChevronUp,
  Loader2,
  Info,
  X,
  Search,
  LocateFixed,
  Check,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Home,
  Briefcase,
  ReceiptText,
  Mic,
  DoorOpen,
  PhoneOff,
  BellOff,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { LocationPickerMap } from "@/components/maps/LocationPickerMap";
import { useCart } from "@/context/CartContext";
import { useLocation } from "@/context/LocationContext";
import { useLoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { load } from '@cashfreepayments/cashfree-js';

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const mapStyles = [
  { elementType: "labels.text.stroke", stylers: [{ color: "#FDFBF7" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e3e3e3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f8c967" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e9bc62" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9f2f9" }],
  },
];

export interface SavedAddress {
  id: string;
  tag: "Home" | "Work" | "Other";
  customerName?: string;
  customerPhone?: string;
  houseNumber: string;
  street: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
}

const VegIcon = () => (
  <div className="w-3 h-3 border-[1px] border-green-700 flex items-center justify-center rounded-[2px] shrink-0">
    <div className="w-1.5 h-1.5 bg-green-700 rounded-full"></div>
  </div>
);

const NonVegIcon = () => (
  <div className="w-3 h-3 border-[1px] border-[#8B3A1A] flex items-center justify-center rounded-[2px] shrink-0">
    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px] border-b-[#8B3A1A]"></div>
  </div>
);

const MapTilesWrapper = ({
  mapToken,
  mapLat,
  mapLng,
  setMapLat,
  setMapLng,
  mapRef,
  handleMapDragEnd,
}: any) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: mapToken,
    libraries,
  });

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      center={{ lat: mapLat, lng: mapLng }}
      zoom={17}
      options={{
        styles: mapStyles,
        disableDefaultUI: true,
        backgroundColor: "#FDFBF7",
        gestureHandling: "greedy",
      }}
      onLoad={(map) => {
        mapRef.current = map;
      }}
      onDragEnd={handleMapDragEnd}
    />
  );
};

export default function Cart() {
  useAuth();
  const router = useRouter();
  const { cart, updateQuantity, clearCart, cartTotal, cartItemCount } =
    useCart();
  const {
    currentLocation,
    latitude,
    longitude,
    setCoordinates,
    setCurrentLocation,
    resetToLiveLocation,
    liveLatitude,
    liveLongitude,
  } = useLocation();
  const mapLatInitial = latitude || 25.611;
  const mapLngInitial = longitude || 85.13;

  // States
  const [isBillExpanded, setIsBillExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Cart & Suggestion States
  const [stallCoords, setStallCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(20);
  const [distanceKms, setDistanceKms] = useState<string | null>(null);
  const [foodMarkup, setFoodMarkup] = useState(0);
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);

  // Order Options
  const [deliveryInstructions, setDeliveryInstructions] = useState<string[]>([]);
  const [activeDeliveryTab, setActiveDeliveryTab] = useState<"modes" | "instructions">("modes");
  const [restaurantInstructions, setRestaurantInstructions] = useState("");
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);
  const [customDirections, setCustomDirections] = useState("");
  const [tempDirections, setTempDirections] = useState("");

  // Redesign UI States
  const [deliveryMode, setDeliveryMode] = useState<"quick" | "basic">("basic");
  const [activeTab, setActiveTab] = useState<
    "popular" | "beverages" | "desserts" | "sides"
  >("popular");

  // Address States
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [isAddressListOpen, setIsAddressListOpen] = useState(false);

  // Map Modal States
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapLat, setMapLat] = useState(mapLatInitial);
  const [mapLng, setMapLng] = useState(mapLngInitial);
  const [mapAddressTag, setMapAddressTag] = useState<"Home" | "Work" | "Other">(
    "Home",
  );
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchError, setMapSearchError] = useState("");
  const [editAddressId, setEditAddressId] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const isProgrammaticMapSearch = useRef(false);
  const [mapboxToken, setMapboxToken] = useState("");
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  // Distance logic
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Fetch Token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";
        const res = await fetch(`${baseUrl}/location/map-token`);
        const data = await res.json();
        if (data.token) setMapboxToken(data.token);
        else if (data.data?.token) setMapboxToken(data.data.token);
      } catch (err) {
        console.error("Failed to fetch map token", err);
      }
    };
    fetchToken();
  }, []);

  // Fetch Cart Stall Info & Suggested Items
  useEffect(() => {
    if (cart.stallId) {
      api
        .get(`/stalls/${cart.stallId}`)
        .then((res) => {
          if (res.data) {
            setIsCutleryEnabled(res.data.is_cutlery_enabled === true);
            setStallOfferTitle(res.data.active_offer_title || null);
            if (res.data.latitude && res.data.longitude) {
              setStallCoords({
                lat: parseFloat(res.data.latitude),
                lng: parseFloat(res.data.longitude),
              });
            }
          }
        })
        .catch(console.error);

      api
        .get(`/stalls/${cart.stallId}/menu`)
        .then((res) => {
          const allItems = res.data || [];
          const filtered = allItems.filter(
            (i: any) => !cart.items.find((ci) => ci.id === i.id.toString()),
          );
          setSuggestedItems(filtered);
        })
        .catch(console.error);
    }
  }, [cart.stallId, cart.items]);

  const [isCookingRequestActive, setIsCookingRequestActive] = useState(false);
  const [cookingRequest, setCookingRequest] = useState("");
  const [cutleryNeeded, setCutleryNeeded] = useState(false);
  const [isCutleryEnabled, setIsCutleryEnabled] = useState(false);
  const [stallOfferTitle, setStallOfferTitle] = useState<string | null>(null);

  // Delivery Fee Calculation
  useEffect(() => {
    const calculateDistance = async () => {
      if (!cart.stallId) return;
      const activeAddress =
        savedAddresses.find((a: any) => a.id === selectedAddressId) || null;
      const targetLat = activeAddress ? activeAddress.latitude : mapLatInitial;
      const targetLng = activeAddress ? activeAddress.longitude : mapLngInitial;

      if (
        activeAddress &&
        (activeAddress.latitude !== latitude ||
          activeAddress.longitude !== longitude)
      ) {
        setCoordinates(activeAddress.latitude, activeAddress.longitude);
      }

      if (stallCoords && targetLat && targetLng) {
        const haversineDist = getDistance(
          stallCoords.lat,
          stallCoords.lng,
          targetLat,
          targetLng,
        );
        
        let actualDist = haversineDist;
        let newMarkup = 0;
        try {
          const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";
          const routeRes = await fetch(`${baseUrl}/location/route`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              originLat: stallCoords.lat,
              originLng: stallCoords.lng,
              destLat: targetLat,
              destLng: targetLng,
            }),
          });
          const data = await routeRes.json();
          if (data.status === "success" && data.data && data.data.distanceKm) {
             actualDist = data.data.distanceKm;
          }
          if (
            data.status === "success" &&
            data.data &&
            data.data.distanceKm >= 4.0
          ) {
            newMarkup = 20;
          }
        } catch (e) {
          if (haversineDist >= 3.2) newMarkup = 20;
        }

        let fee = 18;
        if (actualDist <= 1.4) {
          fee = 18;
        } else if (actualDist <= 2.0) {
          fee = 18 + ((actualDist - 1.4) / 0.6) * 5;
        } else if (actualDist <= 3.0) {
          fee = 23 + ((actualDist - 2.0) / 1.0) * 6;
        } else if (actualDist <= 4.0) {
          fee = 29 + ((actualDist - 3.0) / 1.0) * 7;
        } else {
          fee = 36;
        }
        fee = Math.round(fee * 100) / 100;

        setDeliveryFee(fee);
        setDistanceKms(actualDist.toFixed(1));
        setFoodMarkup(newMarkup);
      }
    };

    calculateDistance();
  }, [
    stallCoords,
    mapLatInitial,
    mapLngInitial,
    savedAddresses,
    selectedAddressId,
    cart.items.length,
  ]);

  const handleMapDragEnd = async (lat: number, lng: number) => {
    setMapLat(lat);
    setMapLng(lng);
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api";
      const res = await fetch(`${baseUrl}/location/reverse-geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      const data = await res.json();
      if (data && data.status === "success" && data.data) {
        isProgrammaticMapSearch.current = true;
        setMapSearchQuery(data.data.address || data.data.city || "");
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (isProgrammaticMapSearch.current) {
      isProgrammaticMapSearch.current = false;
      return;
    }
    if (!mapSearchQuery || mapSearchQuery.length < 3) {
      setMapSearchResults([]);
      return;
    }

    setIsSearchingMap(true);
    setMapSearchError("");
    const timerId = setTimeout(() => {
      api
        .get(`/location/autosuggest?query=${mapSearchQuery}`)
        .then((res) => {
          setIsSearchingMap(false);
          if (res.data && res.data.data && res.data.data.length > 0) {
            setMapSearchResults(res.data.data);
          } else {
            setMapSearchResults([]);
            setMapSearchError("No results found");
          }
        })
        .catch(() => {
          setIsSearchingMap(false);
          setMapSearchResults([]);
          setMapSearchError("No results found");
        });
    }, 500);

    return () => clearTimeout(timerId);
  }, [mapSearchQuery]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get("/auth/addresses");
      const mapped = res.data.map((a: any) => ({
        id: a.id.toString(),
        tag: a.tag,
        customerName: a.name,
        customerPhone: a.phone,
        houseNumber: a.house_number,
        fullAddress: a.full_address,
        latitude: parseFloat(a.lat),
        longitude: parseFloat(a.lng),
      }));
      setSavedAddresses(mapped);
      if (mapped.length > 0 && !selectedAddressId) {
        setSelectedAddressId(mapped[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch addresses:", e);
    }
  };

  const handleSaveAddress = async () => {
    const finalAddress = mapSearchQuery || "Location Selected on Map";
    try {
      if (editAddressId) {
        await api.delete(`/auth/addresses/${editAddressId}`);
      }

      const res = await api.post("/auth/addresses", {
        tag: mapAddressTag,
        name: customerName,
        phone: customerPhone,
        house_number: houseNumber || "",
        full_address: finalAddress,
        lat: mapLat,
        lng: mapLng,
      });

      await fetchAddresses();
      if (!editAddressId) setSelectedAddressId(res.data.id.toString());
    } catch (err) {
      console.error("Failed to save address", err);
    }

    setIsMapOpen(false);
    setHouseNumber("");
    setCustomerName("");
    setCustomerPhone("");
    setEditAddressId(null);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const itemTotal = cartTotal + foodMarkup * cartItemCount;
  const GST = Math.round(itemTotal * 0.05);
  const finalTotal = itemTotal + GST + deliveryFee;
  
  const totalSaved = cart.items.reduce((sum, item) => sum + (Math.round(item.price * 1.20) - item.price) * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!cart.stallId || cart.items.length === 0) return;
    setIsPlacingOrder(true);

    const selectedAddr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      alert("Please select or add a delivery address.");
      setIsPlacingOrder(false);
      return;
    }

    const baseDeliveryAddress = selectedAddr.houseNumber
      ? `${selectedAddr.houseNumber}, ${selectedAddr.fullAddress}`
      : selectedAddr.fullAddress;

    const finalDeliveryAddress = selectedAddr.customerName
      ? `${selectedAddr.customerName} | ${baseDeliveryAddress}`
      : baseDeliveryAddress;

    try {
      const payload = {
        stallId: cart.stallId,
        totalAmount: finalTotal,
        itemTotal: itemTotal,
        deliveryCharge: deliveryFee,
        gstAmount: GST,
        platformFee: Math.round(itemTotal * 0.22),
        restaurantShare: itemTotal - Math.round(itemTotal * 0.22),
        deliveryAddress: finalDeliveryAddress,
        deliveryLat: selectedAddr.latitude,
        deliveryLng: selectedAddr.longitude,
        customerPhone: selectedAddr.customerPhone || undefined,
        deliveryInstructions: [
          ...deliveryInstructions,
          customDirections ? `Directions: ${customDirections}` : null
        ].filter(Boolean).join(", ") || null,
        restaurantInstructions,
        paymentMethod,
        cookingRequest: cookingRequest || null,
        cutleryNeeded: cutleryNeeded,
        items: cart.items.map((item: any) => ({
          ...item,
          price: item.price + foodMarkup,
          quantity: item.quantity || item.qty || 1,
        })),
      };

      if (paymentMethod === "cod") {
        const res = await api.post("/orders", payload);
        if (res.data && res.data.order) {
          setShowSuccessAnim(true);
          if (typeof window !== "undefined") {
            resetToLiveLocation();
            setTimeout(() => {
              clearCart();
              router.push(`/track?id=${res.data.order.id}`);
            }, 2500);
          } else {
            clearCart();
          }
        } else {
          alert("Failed to place order.");
          setIsPlacingOrder(false);
        }
      } else {
        const orderRes = await api.post("/payments/create-order", payload);
        if (!orderRes.data || !orderRes.data.payment_session_id) {
          throw new Error("Failed to initialize payment");
        }

        try {
          const cashfree = await load({
            mode: "production",
          });

          setIsPlacingOrder(true);
          let checkoutOptions = {
            paymentSessionId: orderRes.data.payment_session_id,
            redirectTarget: "_modal",
          };

          cashfree.checkout(checkoutOptions).then(async (result: any) => {
            if(result.error){
              alert("Payment failed: " + result.error.message);
              setIsPlacingOrder(false);
            }
            if(result.redirect){
              // Redirected for payment
              console.log("Redirected");
            }
            if(result.paymentDetails){
              // Payment completed, verify on backend
              try {
                await api.post("/payments/verify", {
                  swaddo_order_id: orderRes.data.order_id,
                  gateway_order_id: orderRes.data.gateway_order_id,
                });

                setShowSuccessAnim(true);
                if (typeof window !== "undefined") {
                  resetToLiveLocation();
                  setTimeout(() => {
                    clearCart();
                    router.push(`/`);
                  }, 2500);
                } else {
                  clearCart();
                }
              } catch (err: any) {
                console.error(err);
                alert(
                  "Payment verification failed: " +
                    (err.response?.data?.message || err.message),
                );
                setIsPlacingOrder(false);
              }
            }
          });
        } catch (err) {
          alert("Cashfree SDK failed to load. Are you online?");
          setIsPlacingOrder(false);
          return;
        }
      }
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Unknown error occurred";
      if (err.response?.data) {
        errorMessage =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data.error ||
              err.response.data.message ||
              JSON.stringify(err.response.data);
      } else if (err.message) {
        errorMessage = err.message;
      }
      alert("Failed to place order: " + errorMessage);
      setIsPlacingOrder(false);
    }
  };

  const displayedSuggestedItems = suggestedItems;

  if ((!cart.items || cart.items.length === 0) && !showSuccessAnim) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm flex flex-col items-center justify-center p-8 bg-white rounded-[24px] shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
            <ShoppingBag size={32} className="text-green-600" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-800 mb-2">
            Your cart is empty
          </h2>
          <p className="text-[14px] text-gray-500 mb-8 font-medium">
            Looks like you haven't added anything to your cart yet.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-[#00A14F] text-white font-bold text-[15px] py-4 rounded-full shadow-[0_4px_12px_rgba(0,161,79,0.3)] hover:bg-[#009146] transition-colors"
          >
            Explore Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSuccessAnim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
              className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mb-6 relative"
            >
              <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50" />
              <Check size={64} className="text-emerald-500 relative z-10" />
            </motion.div>
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="font-heading font-black text-3xl text-slate-800 text-center mb-2 tracking-tight"
            >
              Order Placed!
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-500 font-medium text-center"
            >
              We've received your order and are processing it.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-scroll-container bg-[#F5F6F8] pb-[100px] font-body relative h-[100vh] overflow-y-auto hide-scrollbar">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" />

        <div className="bg-[#00A14F] px-4 pt-4 pb-[80px] sticky top-0 z-0 overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <button
              onClick={() => router.back()}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-bold text-[16px] text-white flex-1 tracking-wide">
              {cart.stallName}
            </h1>
          </div>
          <div className="absolute right-[-10px] top-2 opacity-10 pointer-events-none z-0 flex flex-col items-center transform -rotate-12">
            <svg width="120" height="30" viewBox="0 0 120 30">
              <path id="curve" d="M 10 30 Q 60 -10 110 30" fill="transparent" />
              <text
                className="font-bold text-[14px] tracking-widest"
                fill="white"
              >
                <textPath href="#curve" startOffset="50%" textAnchor="middle">
                  EVERYDAY
                </textPath>
              </text>
            </svg>
            <span className="font-black text-[18px] text-white leading-none tracking-tight -mt-1">
              LOWEST PRICE
            </span>
          </div>
        </div>

        <div className="relative z-10 -mt-[60px] bg-[#F5F6F8] rounded-t-[24px] min-h-screen px-3 pt-3 flex flex-col gap-3 pb-24">
          <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
            {cart.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex flex-col mb-4 last:mb-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 max-w-[55%]">
                    <div className="mt-[3px] shrink-0">
                      {item.isVeg !== false ? <VegIcon /> : <NonVegIcon />}
                    </div>
                    <h3 className="font-bold text-[14px] text-gray-800 leading-tight">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-start gap-3 shrink-0">
                    <div className="flex items-center justify-between w-[75px] py-1 bg-white text-gray-800 font-bold text-[14px] rounded-full shadow-sm border border-gray-200 shrink-0">
                      <button
                        onClick={() =>
                          updateQuantity(
                            cart.stallId!,
                            cart.stallName!,
                            item,
                            -1,
                          )
                        }
                        className="w-1/3 flex justify-center py-1"
                      >
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            cart.stallId!,
                            cart.stallName!,
                            item,
                            1,
                          )
                        }
                        className="w-1/3 flex justify-center py-1"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex flex-col items-end w-[40px]">
                      <span className="text-[12px] text-gray-400 line-through font-medium mb-0.5">
                        ₹{Math.round(item.price * 1.20)}
                      </span>
                      <span className="text-[14px] font-bold text-gray-800">
                        ₹{item.price}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Action Pills */}
            <div className="flex flex-wrap gap-2 py-1">
              <button 
                onClick={() => router.push(`/stall/${cart.stallId}`)}
                className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 text-[12px] font-medium text-gray-500 shrink-0 hover:bg-gray-50"
              >
                <Plus size={14} className="text-gray-400" /> Add Items
              </button>

              {!cookingRequest && !isCookingRequestActive && (
                <button 
                  onClick={() => setIsCookingRequestActive(true)}
                  className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 text-[12px] font-medium text-gray-500 shrink-0 hover:bg-gray-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                  Cooking requests
                </button>
              )}

              {isCutleryEnabled && (
                <label className="flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1.5 text-[12px] font-medium text-gray-500 shrink-0 hover:bg-gray-50 cursor-pointer">
                  <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center ${cutleryNeeded ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                    {cutleryNeeded && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                  <input type="checkbox" className="hidden" checked={cutleryNeeded} onChange={(e) => setCutleryNeeded(e.target.checked)} />
                  Cutlery Needed
                </label>
              )}
            </div>

            {isCookingRequestActive && !cookingRequest && (
              <div className="mt-3 flex items-center gap-2">
                <input 
                  type="text" 
                  autoFocus
                  id="cooking-request-input"
                  placeholder="Any cooking requests? (e.g. Make it spicy)" 
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-green-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setCookingRequest(e.currentTarget.value);
                      setIsCookingRequestActive(false);
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('cooking-request-input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      setCookingRequest(input.value.trim());
                    }
                    setIsCookingRequestActive(false);
                  }}
                  className="px-4 py-1.5 bg-[#00A14F] text-white text-[12px] font-bold rounded-lg shrink-0"
                >
                  Add
                </button>
              </div>
            )}

            {cookingRequest && (
              <div className="mt-3 flex items-start gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 relative">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mt-0.5 shrink-0">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
                <p className="text-[13px] text-gray-700 pr-6">{cookingRequest}</p>
                <button 
                  onClick={() => setCookingRequest("")}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-red-500 bg-white rounded-full p-0.5 shadow-sm border border-gray-100"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>



          {/* Complete Your Meal */}
          {displayedSuggestedItems.length > 0 && (
          <div className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 overflow-hidden">
            <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-4">
              COMPLETE YOUR MEAL
            </h3>

            {/* Tabs */}
            <div className="flex items-center bg-[#F6F6F6] p-1 rounded-full mb-5 w-fit">
              {["Popular", "Beverages", "Desserts", "Sides"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase() as any)}
                  className={`capitalize px-4 py-1.5 rounded-full text-[13px] transition-colors ${activeTab === tab.toLowerCase() ? "bg-white shadow-sm text-[#008A45] font-bold" : "text-[#5C5C5C] font-semibold"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Suggested Items Horizontal Scroll */}
            <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 snap-x pt-2">
              {displayedSuggestedItems.map((sitem) => (
                <div
                  key={sitem.id}
                  className="flex flex-col shrink-0 w-[105px] snap-start"
                >
                  <div className="w-[105px] h-[105px] bg-white rounded-[12px] mb-2 relative overflow-visible border border-gray-200 shadow-sm flex items-center justify-center p-2">
                    <Image
                      src={sitem.img || sitem.image}
                      alt={sitem.name}
                      fill
                      className="object-cover p-2 rounded-[12px]"
                    />
                    <button
                      onClick={() =>
                        updateQuantity(
                          cart.stallId || "1",
                          cart.stallName || "Restaurant",
                          {
                            id: sitem.id,
                            name: sitem.name,
                            price: sitem.price,
                            isVeg: sitem.is_veg ?? true,
                          },
                          1,
                        )
                      }
                      className="absolute -top-2 -right-2 w-[28px] h-[28px] bg-white border border-[#FF007F] rounded-full flex items-center justify-center z-10 shadow-sm"
                    >
                      <Plus
                        size={16}
                        className="text-[#FF007F]"
                        strokeWidth={2.5}
                      />
                    </button>
                  </div>
                  <div className="flex items-start gap-1">
                    <div className="mt-[2px] shrink-0">
                      {(sitem.isVeg ?? sitem.is_veg) !== false ? <VegIcon /> : <NonVegIcon />}
                    </div>
                    <h4 className="font-medium text-[13px] text-gray-800 leading-tight line-clamp-2 w-full">
                      {sitem.name}
                    </h4>
                  </div>
                  <span className="font-bold text-[13px] text-gray-800 mt-1 pl-[15px]">
                    ₹{sitem.price}
                  </span>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Delivery Modes & Instructions */}
          <div className="bg-white rounded-[20px] p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-1 bg-[#F5F6F8] rounded-full p-1 mb-5">
              <button 
                onClick={() => setActiveDeliveryTab("modes")}
                className={`flex-1 rounded-full py-2.5 flex items-center justify-center gap-1.5 text-[13px] transition-all ${activeDeliveryTab === "modes" ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-bold text-green-800" : "text-gray-500 font-medium hover:bg-gray-200/50"}`}
              >
                Delivery Modes{" "}
                <span className="bg-[#00A14F] text-white text-[9px] px-1.5 py-0.5 rounded-sm tracking-wider">
                  NEW
                </span>
              </button>
              <button 
                onClick={() => setActiveDeliveryTab("instructions")}
                className={`flex-1 rounded-full py-2.5 flex items-center justify-center text-[13px] transition-all ${activeDeliveryTab === "instructions" ? "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] font-bold text-green-800" : "text-gray-500 font-medium hover:bg-gray-200/50"}`}
              >
                Instructions
              </button>
            </div>

            {activeDeliveryTab === "modes" && (
              <div className="flex flex-col gap-4">
                <label style={{ display: 'none' }} className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${deliveryMode === "quick" ? "border-[#FF007F]" : "border-gray-300"}`}
                  >
                    {deliveryMode === "quick" && (
                      <div className="w-2.5 h-2.5 bg-[#FF007F] rounded-full"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="deliveryMode"
                    className="hidden"
                    checked={deliveryMode === "quick"}
                    onChange={() => setDeliveryMode("quick")}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center w-full mb-0.5">
                      <span
                        className={`font-medium text-[15px] flex items-center gap-1 transition-colors ${deliveryMode === "quick" ? "text-gray-400" : "text-gray-300"}`}
                      >
                        Quick <span className="text-[#FF007F]">⚡</span>
                      </span>
                      <span
                        className={`font-medium text-[14px] transition-colors ${deliveryMode === "quick" ? "text-gray-500" : "text-gray-300"}`}
                      >
                        +₹7
                      </span>
                    </div>
                    <span className="text-[12px] text-gray-300 font-medium">
                      Add address to check delivery time
                    </span>
                  </div>
                </label>

                <div style={{ display: 'none' }} className="w-full h-[1px] border-t border-dashed border-gray-200"></div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${deliveryMode === "basic" ? "border-[#FF007F]" : "border-gray-300"}`}
                  >
                    {deliveryMode === "basic" && (
                      <div className="w-2.5 h-2.5 bg-[#FF007F] rounded-full"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="deliveryMode"
                    className="hidden"
                    checked={deliveryMode === "basic"}
                    onChange={() => setDeliveryMode("basic")}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-center w-full mb-0.5">
                      <span
                        className={`font-bold text-[15px] transition-colors ${deliveryMode === "basic" ? "text-gray-900" : "text-gray-600"}`}
                      >
                        Premium
                      </span>
                    </div>
                    <span className="text-[12px] text-gray-500 font-medium">
                      Fast door step delivery
                    </span>
                  </div>
                </label>
              </div>
            )}

            {activeDeliveryTab === "instructions" && (
              <div className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 snap-x pt-1 -mx-2 px-2">
                {[
                  { id: 'Directions to reach', icon: <Mic size={22} className="mb-2.5" /> },
                  { id: 'Leave at the door', icon: <DoorOpen size={22} className="mb-2.5" /> },
                  { id: 'Avoid calling', icon: <PhoneOff size={22} className="mb-2.5" /> },
                  { id: 'Avoid ringing bell', icon: <BellOff size={22} className="mb-2.5" /> },
                  { id: 'Leave with security', icon: <Shield size={22} className="mb-2.5" /> },
                ].map((instruction) => {
                  let isDisabled = false;
                  if (instruction.id === 'Leave at the door') {
                    isDisabled = deliveryInstructions.includes('Leave with security');
                  } else if (instruction.id === 'Leave with security') {
                    isDisabled = deliveryInstructions.includes('Leave at the door');
                  }
                  
                  const isSelected = deliveryInstructions.includes(instruction.id) || (instruction.id === 'Directions to reach' && customDirections.length > 0);
                  return (
                    <button
                      key={instruction.id}
                      disabled={isDisabled}
                      onClick={() => {
                        if (instruction.id === 'Directions to reach') {
                          setTempDirections(customDirections);
                          setIsDirectionsModalOpen(true);
                        } else {
                          if (isSelected) {
                            setDeliveryInstructions(deliveryInstructions.filter(i => i !== instruction.id));
                          } else {
                            setDeliveryInstructions([...deliveryInstructions, instruction.id]);
                          }
                        }
                      }}
                      className={`flex flex-col shrink-0 w-[95px] h-[100px] snap-start border rounded-[16px] p-3 transition-all text-left relative ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-100' : isSelected ? 'border-[#00A14F] bg-green-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    >
                      {isSelected && (
                        <div className="absolute top-2.5 right-2.5 bg-[#00A14F] text-white rounded-full p-0.5 shadow-sm">
                          <Check size={10} strokeWidth={4} />
                        </div>
                      )}
                      <div className={`${isDisabled ? 'text-gray-400' : isSelected ? 'text-[#00A14F]' : 'text-gray-500'}`}>
                        {instruction.icon}
                      </div>
                      <span className={`text-[12px] leading-[1.2] ${isDisabled ? 'text-gray-400 font-medium' : isSelected ? 'text-gray-900 font-bold' : 'text-gray-600 font-medium'}`}>
                        {instruction.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Offers */}
          <div style={{ display: 'none' }} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-700 text-white rounded-[10px] flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line
                    x1="7"
                    y1="7"
                    x2="7.01"
                    y2="7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-bold text-[14px] text-gray-800">
                Payment offers & more
              </span>
            </div>
            <ChevronDown size={20} className="text-gray-800 -rotate-90" />
          </div>

          {/* Applied Offer */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-700 text-white rounded-[10px] flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line
                    x1="7"
                    y1="7"
                    x2="7.01"
                    y2="7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="font-bold text-[14px] text-gray-800">
                ₹{totalSaved} saved with 'Items at ₹{cartTotal}'
              </span>
            </div>
            <span className="text-green-700 text-[13px] font-bold flex items-center gap-0.5">
              <Check size={14} strokeWidth={3} /> Applied
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4 flex flex-col gap-4">
            <h3 className="font-bold text-[15px] text-gray-800">
              Select Payment Method
            </h3>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMethod === "upi" ? "border-[#FF007F]" : "border-gray-300"}`}
              >
                {paymentMethod === "upi" && (
                  <div className="w-2.5 h-2.5 bg-[#FF007F] rounded-full"></div>
                )}
              </div>
              <input
                type="radio"
                name="paymentMethod"
                className="hidden"
                checked={paymentMethod === "upi"}
                onChange={() => setPaymentMethod("upi")}
              />
              <div className="flex items-center gap-2 flex-1">
                <CreditCard size={18} className="text-gray-600" />
                <span
                  className={`font-medium text-[15px] transition-colors ${paymentMethod === "upi" ? "text-gray-800" : "text-gray-500"}`}
                >
                  Pay Online (Cashfree)
                </span>
              </div>
            </label>

            <div style={{ display: 'none' }} className="w-full h-[1px] border-t border-dashed border-gray-200"></div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${paymentMethod === "cod" ? "border-[#FF007F]" : "border-gray-300"}`}
              >
                {paymentMethod === "cod" && (
                  <div className="w-2.5 h-2.5 bg-[#FF007F] rounded-full"></div>
                )}
              </div>
              <input
                type="radio"
                name="paymentMethod"
                className="hidden"
                checked={paymentMethod === "cod"}
                onChange={() => setPaymentMethod("cod")}
              />
              <div className="flex items-center gap-2 flex-1">
                <Banknote size={18} className="text-gray-600" />
                <span
                  className={`font-medium text-[15px] transition-colors ${paymentMethod === "cod" ? "text-gray-800" : "text-gray-500"}`}
                >
                  Cash on Delivery
                </span>
              </div>
            </label>
          </div>

          {/* Bill Summary */}
          <div
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 ${isBillExpanded ? "pb-0" : ""}`}
          >
            <div
              onClick={() => setIsBillExpanded(!isBillExpanded)}
              className="flex items-center justify-between p-4 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-700 text-white rounded-[10px] flex items-center justify-center">
                  <ReceiptText size={18} className="text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px] text-gray-800">
                      To Pay
                    </span>
                    <span className="text-[14px] text-gray-400 line-through font-medium">
                      ₹{finalTotal + totalSaved}
                    </span>
                    <span className="font-bold text-[15px] text-gray-800">
                      ₹{finalTotal}
                    </span>
                  </div>
                  <span className="text-green-600 text-[13px] font-bold mt-0.5">
                    ₹{totalSaved} saved on the total!
                  </span>
                </div>
              </div>
              {isBillExpanded ? (
                <ChevronUp
                  size={22}
                  className="text-gray-800"
                  strokeWidth={2.5}
                />
              ) : (
                <ChevronDown
                  size={22}
                  className="text-gray-800"
                  strokeWidth={2.5}
                />
              )}
            </div>

            {isBillExpanded && (
              <div className="flex flex-col w-full animate-in slide-in-from-top-2 duration-200">
                <div className="w-full h-[1px] bg-gray-100"></div>
                <div className="px-4 py-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-gray-500 font-medium">
                      Item Total
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 line-through font-medium">
                        ₹{itemTotal + totalSaved}
                      </span>
                      <span className="text-[#00A14F] font-bold">
                        ₹{itemTotal}
                      </span>
                    </div>
                  </div>

                  <div className="w-full border-t border-dashed border-gray-200"></div>

                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-gray-500 font-medium border-b border-dashed border-gray-400 pb-[1px] leading-none">
                      Delivery Fee | {distanceKms ? distanceKms : "..."} kms
                    </span>
                    <span className="text-gray-600 font-medium">
                      ₹{deliveryFee}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[14px]">
                    <span className="text-gray-500 font-medium border-b border-dashed border-gray-400 pb-[1px] leading-none">
                      Government Taxes
                    </span>
                    <span className="text-gray-600 font-medium">
                      ₹{GST.toFixed(2)}
                    </span>
                  </div>

                  <div className="w-full border-t border-dashed border-gray-200"></div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[15px] text-gray-800">
                      To Pay
                    </span>
                    <span className="font-bold text-[15px] text-gray-800">
                      ₹{finalTotal}
                    </span>
                  </div>
                </div>

                {/* Bottom Footer like screenshot */}
                <div className="w-full bg-gradient-to-r from-[#FFF0F5] to-white px-4 py-3 relative overflow-hidden flex items-center min-h-[70px]">
                  <div className="w-[80%] relative z-10">
                    <p className="text-[#6D1B4B] text-[13px] font-medium leading-[1.4]">
                      No platform fee, No packaging fee &<br />
                      Lowest item prices
                    </p>
                  </div>

                  {/* Pink SVG Stamp */}
                  <div className="absolute right-[-15px] bottom-[-15px] w-[100px] h-[100px] z-0 opacity-90 transform -rotate-[15deg]">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-[#FF007F]"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="38"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <defs>
                        <path
                          id="curvePink"
                          d="M 22,50 A 28,28 0 0,1 78,50"
                          fill="none"
                        />
                      </defs>
                      <text
                        fill="currentColor"
                        fontSize="10"
                        fontWeight="900"
                        letterSpacing="0.5"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        <textPath
                          href="#curvePink"
                          startOffset="50%"
                          textAnchor="middle"
                        >
                          EVERYDAY
                        </textPath>
                      </text>
                      <path
                        d="M 5,42 L 95,42 L 91,52 L 95,62 L 5,62 L 9,52 Z"
                        fill="currentColor"
                      />
                      <text
                        x="50"
                        y="55"
                        fill="white"
                        fontSize="10"
                        fontWeight="900"
                        letterSpacing="0"
                        textAnchor="middle"
                        style={{ fontFamily: "Arial, sans-serif" }}
                      >
                        LOWEST PRICE
                      </text>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="px-2 mt-2 mb-10">
            <h4 className="text-[12px] font-bold text-gray-500 mb-1">
              Cancellation policy:
            </h4>
            <p className="text-[12px] text-gray-400 font-medium leading-relaxed">
              Please double-check your order and address details. Orders are
              non-refundable once placed.
            </p>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] p-4 pt-5 pb-6 z-50 transition-transform">
          <div
            className="flex items-center justify-between mb-3 px-1 cursor-pointer"
            onClick={() => setIsAddressListOpen(true)}
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#00A14F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                <h3 className="font-black text-[14px] text-gray-800 tracking-tight">
                  {savedAddresses.find((a: any) => a.id === selectedAddressId)
                    ?.tag || "Delivery Address"}
                </h3>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1 ml-5">
                {savedAddresses.find((a: any) => a.id === selectedAddressId)
                  ?.fullAddress || "Select delivery address"}
              </p>
            </div>
            <span className="text-[12px] font-bold text-[#00A14F] bg-green-50 px-2 py-1 rounded-md">
              CHANGE
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className="w-full bg-[#00A14F] disabled:bg-gray-400 text-white font-bold text-[16px] py-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,161,79,0.25)] active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {isPlacingOrder ? (
              <Loader2 className="animate-spin" size={20} />
            ) : null}
            {isPlacingOrder ? "Processing..." : "Proceed to Pay"}
          </button>
        </div>
      </div>

      {/* Address List Modal */}
      <AnimatePresence>
        {isAddressListOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
              <h2 className="text-[18px] font-black text-gray-800 tracking-tight">
                Select Delivery Address
              </h2>
              <button
                onClick={() => setIsAddressListOpen(false)}
                className="p-2 bg-gray-50 rounded-full"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
              {savedAddresses.map((addr: any) => (
                <div
                  key={addr.id}
                  onClick={() => {
                    setSelectedAddressId(addr.id);
                    setIsAddressListOpen(false);
                  }}
                  className={`p-4 rounded-xl border-2 flex gap-3 cursor-pointer transition-all ${selectedAddressId === addr.id ? "border-[#00A14F] bg-green-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <div className="mt-0.5">
                    <MapPin
                      size={20}
                      className={
                        selectedAddressId === addr.id
                          ? "text-[#00A14F]"
                          : "text-gray-400"
                      }
                    />
                  </div>
                  <div className="flex flex-col w-full">
                    <div className="flex items-center justify-between w-full">
                      <h4 className="font-bold text-gray-800 text-[15px]">
                        {addr.tag || "Address"}
                      </h4>
                      {selectedAddressId === addr.id && (
                        <Check
                          size={18}
                          className="text-[#00A14F]"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <p className="text-gray-500 text-[13px] leading-relaxed mt-1 line-clamp-2">
                      {addr.fullAddress}
                    </p>
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  setIsAddressListOpen(false);
                  setMapSearchQuery("");
                  setHouseNumber("");
                  setMapAddressTag("Home");
                  setEditAddressId(null);
                  setIsMapOpen(true);
                }}
                className="w-full mt-2 py-4 border-2 border-dashed border-[#00A14F] rounded-xl text-[#00A14F] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-green-50 transition-colors"
              >
                <Plus size={18} strokeWidth={2.5} />
                Add New Address
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Modal */}
      <AnimatePresence>
        {isMapOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[999] bg-bg-main flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border-subtle bg-white">
              <button
                onClick={() => setIsMapOpen(false)}
                className="p-2 hover:bg-bg-alt rounded-full"
              >
                <X size={24} />
              </button>
              <h2 className="font-heading font-bold text-lg">
                Select Delivery Location
              </h2>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative">
              {/* Search Bar Overlay */}
              <div className="absolute top-4 left-4 right-4 z-10">
                <div className="bg-white rounded-xl shadow-md flex items-center px-4 py-3">
                  <Search size={20} className="text-text-muted mr-3" />
                  <input
                    type="text"
                    placeholder="Search area, street, landmark..."
                    className="flex-1 bg-transparent outline-none text-sm text-text-primary"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                  />
                  {isSearchingMap && (
                    <Loader2
                      size={16}
                      className="animate-spin text-primary mx-2"
                    />
                  )}
                </div>

                {mapSearchResults.length > 0 && (
                  <div className="mt-2 bg-white rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {mapSearchResults.map((loc: any, i: number) => (
                      <div
                        key={i}
                        className="px-4 py-3 border-b border-border-subtle hover:bg-bg-alt cursor-pointer flex flex-col"
                        onClick={() => {
                          const suggestionText =
                            loc.mainText || loc.description.split(",")[0];
                          setMapSearchQuery(suggestionText);
                          setMapSearchResults([]);
                          setIsSearchingMap(true);
                          try {
                            const geocoder = new window.google.maps.Geocoder();
                            geocoder.geocode(
                              {
                                placeId: loc.place_id,
                                address: loc.description,
                              },
                              (results, status) => {
                                if (
                                  status ===
                                    window.google.maps.GeocoderStatus.OK &&
                                  results &&
                                  results[0]
                                ) {
                                  const location = results[0].geometry.location;
                                  setMapLat(location.lat());
                                  setMapLng(location.lng());
                                  if (mapRef.current) {
                                    mapRef.current.panTo(location);
                                    mapRef.current.setZoom(17.5);
                                  }
                                }
                                setIsSearchingMap(false);
                              },
                            );
                          } catch (e) {
                            setIsSearchingMap(false);
                          }
                        }}
                      >
                        <span className="font-bold text-sm text-text-primary">
                          {loc.mainText || loc.description.split(",")[0]}
                        </span>
                        <span className="text-xs text-text-muted">
                          {loc.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {mapSearchError && (
                  <div className="mt-2 text-xs font-bold text-white bg-red-500/90 py-1.5 px-3 rounded-lg shadow-sm">
                    {mapSearchError}
                  </div>
                )}
              </div>

              <div className="absolute inset-0 w-full h-full bg-[#f5f5f5]">
                {!mapboxToken ? (
                  <div className="flex h-full w-full items-center justify-center bg-[#FDFBF7]">
                    <Loader2 className="animate-spin text-primary" size={40} />
                  </div>
                ) : (
                  <LocationPickerMap
                    apiKey={mapboxToken}
                    initialLocation={{ lat: mapLat, lng: mapLng }}
                    onLocationSelect={(lat, lng) => handleMapDragEnd(lat, lng)}
                  />
                )}

                <button
                  onClick={() => {
                    if (liveLatitude && liveLongitude) {
                      setMapLat(liveLatitude);
                      setMapLng(liveLongitude);
                      if (mapRef.current) {
                        mapRef.current.panTo({
                          lat: liveLatitude,
                          lng: liveLongitude,
                        });
                        mapRef.current.setZoom(17.5);
                      }
                    } else {
                      resetToLiveLocation();
                    }
                  }}
                  className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-lg text-primary hover:bg-gray-50 transition-colors z-20 border border-border-subtle"
                >
                  <LocateFixed size={24} />
                </button>
              </div>
            </div>

            {/* Bottom Form */}
            <div className="bg-white rounded-t-3xl p-5 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] z-20">
              <h3 className="font-bold text-text-primary mb-4">
                Enter Complete Address
              </h3>

              <div className="mb-4">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Recipient Name"
                  className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors mb-2"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Phone Number (Required)"
                  className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors mb-2"
                />
                <input
                  type="text"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="House / Flat / Block No."
                  className="w-full bg-bg-main border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block">
                  Save as
                </label>
                <div className="flex gap-3">
                  {["Home", "Work", "Other"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setMapAddressTag(tag as any)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${mapAddressTag === tag ? "bg-primary/10 border-primary text-primary" : "bg-white border-border-subtle text-text-muted"}`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSaveAddress}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
              >
                Save & Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directions Modal */}
      {isDirectionsModalOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsDirectionsModalOpen(false)}
          ></div>
          <div className="relative w-full max-w-md mx-auto bg-white rounded-t-[24px] shadow-2xl flex flex-col pt-2 pb-6 px-5 transition-transform translate-y-0">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5"></div>
            
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold text-gray-900">Directions to reach</h2>
              <button onClick={() => setIsDirectionsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full">
                <X size={16} />
              </button>
            </div>
            
            {savedAddresses.find(a => a.id === selectedAddressId) && (
              <p className="text-[13px] text-gray-500 mb-6 line-clamp-1">
                {savedAddresses.find(a => a.id === selectedAddressId)?.fullAddress}
              </p>
            )}

            {customDirections ? (
              <div className="bg-white border border-gray-200 rounded-[12px] p-3 mb-6 flex justify-between items-center shadow-sm">
                <span className="text-[13px] text-gray-700 font-medium">
                  {customDirections}
                </span>
                <button 
                  onClick={() => {
                    setCustomDirections("");
                    setTempDirections("");
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative mb-6">
                <textarea
                  value={tempDirections}
                  onChange={(e) => setTempDirections(e.target.value.slice(0, 200))}
                  placeholder="e.g. Ring the bell on the red gate"
                  className="w-full border border-gray-200 rounded-xl p-4 text-[14px] text-gray-800 outline-none focus:border-green-500 min-h-[120px] resize-none"
                ></textarea>
                <span className="absolute bottom-3 left-4 text-[12px] text-gray-400">
                  {tempDirections.length}/200
                </span>
              </div>
            )}

            <button
              onClick={() => {
                if (!customDirections) {
                  setCustomDirections(tempDirections.trim());
                }
                setIsDirectionsModalOpen(false);
              }}
              className="w-full bg-[#00A14F] text-white font-bold text-[15px] py-4 rounded-xl hover:bg-[#009146] transition-colors"
            >
              {customDirections ? "Done" : "Save Instructions"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
