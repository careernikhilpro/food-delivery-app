"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLocation } from "@/context/LocationContext";
import { MapPin, Zap, Tag } from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: "welcome",
    title: (
      <>
        WELCOME TO <br />
        <span className="text-[#FF5722]">SWADDO</span>
      </>
    ),
    description: "Delicious food from your\nfavorite restaurants,\ndelivered to your door.",
    image: "/onboarding/scooter.png",
  },
  {
    id: "fast",
    title: (
      <>
        FAST DELIVERY <br />
        <span className="text-[#FF5722]">YOU CAN TRUST</span>
      </>
    ),
    description: "Lightning-fast delivery\nat your fingertips.",
    image: "/onboarding/food.png",
  },
  {
    id: "deals",
    title: (
      <>
        GREAT FOOD <br />
        <span className="text-[#FF5722]">GREAT DEALS</span>
      </>
    ),
    description: "Exclusive offers and\nexciting discounts\non every order.",
    image: "/onboarding/coupon.png",
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { resetToLiveLocation } = useLocation();

  const handleNext = () => {
    if (currentSlide < 3) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const finishOnboarding = () => {
    localStorage.setItem("swaddo_onboarding_completed", "true");
    onComplete();
  };

  const handleAllowLocation = () => {
    resetToLiveLocation();
    finishOnboarding();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
    }),
  };

  return (
    <div className="fixed inset-0 z-[90000] bg-white flex flex-col overflow-hidden touch-none">
      
      {/* Static Header / Skip */}
      {currentSlide < 3 && (
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-end z-20">
          <button
            onClick={() => setCurrentSlide(3)}
            className="text-gray-900 font-bold text-sm tracking-wide bg-transparent outline-none active:scale-95 transition-transform"
          >
            Skip
          </button>
        </div>
      )}

      <AnimatePresence mode="popLayout" custom={1}>
        {currentSlide < 3 ? (
          <motion.div
            key={`slide-${currentSlide}`}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col w-full h-full relative"
          >
            <div className="flex-1 flex flex-col items-center justify-between pt-16 pb-[120px] px-6 max-w-md mx-auto w-full">
              
              {/* Text Content */}
              <div className="w-full mt-4 text-center">
                <h1 className="font-body font-extrabold text-[40px] leading-[1.2] text-gray-900 mb-5 tracking-wide drop-shadow-sm uppercase">
                  {slides[currentSlide].title}
                </h1>
                <p className="font-body text-gray-500 font-medium text-[16px] leading-[1.7] whitespace-pre-line px-4">
                  {slides[currentSlide].description}
                </p>
              </div>

              {/* Image Content */}
              <div className="relative w-full h-[320px] my-auto flex items-center justify-center -mt-2">
                 <Image 
                   src={slides[currentSlide].image} 
                   alt="Onboarding illustration" 
                   fill
                   className="object-contain mix-blend-multiply contrast-125 brightness-110"
                   priority
                 />
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="location-slide"
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col w-full h-full bg-white relative"
          >
            {/* Map Illustration Header */}
            <div className="w-full h-[40%] relative bg-gray-50">
              <Image 
                src="/onboarding/map.png" 
                alt="Map location" 
                fill
                className="object-cover"
                priority
              />
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent"></div>
              <div className="absolute -bottom-6 left-0 right-0 w-full h-12 bg-white rounded-t-[32px]"></div>
            </div>

            <div className="flex-1 flex flex-col px-6 pb-8 max-w-md mx-auto w-full -mt-2 bg-white rounded-t-[32px] relative z-10">
              <h1 className="font-heading font-black text-[28px] text-gray-900 text-center mb-3">
                Allow Location Access
              </h1>
              <p className="text-gray-500 font-medium text-[15px] text-center leading-relaxed mb-8 px-4">
                We need your location to find the best restaurants near you and deliver your orders.
              </p>

              {/* Permissions List */}
              <div className="bg-gray-50 rounded-3xl p-5 mb-auto">
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <MapPin size={20} className="text-[#FF5722]" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Find nearby restaurants</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <Zap size={20} className="text-green-600" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Faster delivery</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Tag size={20} className="text-purple-600" />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Exclusive local offers</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleAllowLocation}
                  className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold text-lg py-4 rounded-2xl shadow-[0_8px_20px_rgba(255,87,34,0.3)] transition-transform active:scale-95"
                >
                  Allow Location
                </button>
                <button
                  onClick={finishOnboarding}
                  className="w-full bg-white text-gray-600 font-bold text-lg py-4 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 transition-colors active:scale-95"
                >
                  Not Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static Bottom Actions */}
      {currentSlide < 3 && (
        <div className="absolute bottom-10 left-0 right-0 px-6 w-full flex flex-col items-center z-20 max-w-md mx-auto">
          {currentSlide === 2 ? (
            <button
              onClick={handleNext}
              className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-transform active:scale-95 mb-6"
            >
              Get Started
            </button>
          ) : (
            <div className="h-14 flex items-center justify-center w-full mb-6" onClick={handleNext}>
               <div className="w-full h-full absolute inset-0 z-0"></div>
            </div>
          )}
          
          {/* Dots */}
          <div className="flex gap-2 mb-4 z-10">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-6 bg-[#FF5722]" : "w-2 bg-gray-200"
                }`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
