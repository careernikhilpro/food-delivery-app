"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLocation } from "@/context/LocationContext";

interface OnboardingProps {
  onComplete: () => void;
}

const slide = {
  id: "welcome",
  title: (
    <>
      WELCOME TO <br />
      <span className="text-[#FF5722]">SWADDO</span>
    </>
  ),
  description: "Delicious food from your\nfavorite restaurants,\ndelivered to your door.",
  image: "/onboarding/scooter.png",
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const finishOnboarding = () => {
    localStorage.setItem("swaddo_onboarding_completed", "true");
    onComplete();
  };

  const slideVariants = {
    enter: {
      x: 500,
      opacity: 0,
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: {
      zIndex: 0,
      x: -500,
      opacity: 0,
    },
  };

  return (
    <div className="fixed inset-0 z-[90000] bg-white flex flex-col overflow-hidden touch-none">
      
      <AnimatePresence mode="popLayout">
        <motion.div
          key="slide-welcome"
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
                {slide.title}
              </h1>
              <p className="font-body text-gray-500 font-medium text-[16px] leading-[1.7] whitespace-pre-line px-4">
                {slide.description}
              </p>
            </div>

            {/* Image Content */}
            <div className="relative w-full h-[320px] my-auto flex items-center justify-center -mt-2">
               <Image 
                 src={slide.image} 
                 alt="Onboarding illustration" 
                 fill
                 className="object-contain mix-blend-multiply contrast-125 brightness-110"
                 priority
               />
            </div>

          </div>
        </motion.div>
      </AnimatePresence>

      {/* Static Bottom Actions */}
      <div className="absolute bottom-10 left-0 right-0 px-6 w-full flex flex-col items-center z-20 max-w-md mx-auto">
        <button
          onClick={finishOnboarding}
          className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-transform active:scale-95 mb-6"
        >
          Get Started
        </button>
      </div>

    </div>
  );
}
