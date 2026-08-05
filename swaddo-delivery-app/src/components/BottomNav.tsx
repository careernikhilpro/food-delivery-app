"use client";

import { Home, Wallet, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();

  // Don't show bottom nav on login or active-delivery map views
  if (pathname === '/login' || pathname.startsWith('/active-delivery')) return null;

  const navItems = [
    { name: "Home", icon: Home, path: "/home" },
    { name: "Earnings", icon: Wallet, path: "/earnings" },
    { name: "Account", icon: User, path: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200/80 rounded-t-[32px] shadow-[0_-8px_30px_rgba(16,185,129,0.08)] z-50 overflow-hidden pb-safe">
      <div className="flex justify-around items-center h-[76px] px-4 max-w-md mx-auto relative">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.path}
              className="relative flex flex-col items-center justify-center w-20 h-full group transition-all"
            >
              {isActive && (
                <div className="absolute top-0 w-10 h-1 bg-[#10B981] rounded-b-full shadow-[0_2px_8px_rgba(16,185,129,0.5)]"></div>
              )}
              <div className={`flex flex-col items-center justify-center gap-1 mt-2 transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                <div className={`p-1.5 rounded-2xl transition-colors duration-300 ${isActive ? "bg-[#10B981]/10 text-[#10B981]" : "text-slate-400 group-hover:text-slate-600"}`}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "fill-[#10B981]/20" : ""} />
                </div>
                <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? "text-[#10B981]" : "text-slate-400"}`}>
                  {item.name}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
