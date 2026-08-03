"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, ShoppingBag, ShieldAlert, Bike, LogOut, Bell, MessageSquare, ChevronRight, Users } from "lucide-react";
import Cookies from "js-cookie";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login') return null;

  const links = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Live Orders", href: "/orders", icon: ShoppingBag },
    { name: "Vendors", href: "/vendors", icon: Store },
    { name: "Riders", href: "/riders", icon: Bike },
    { name: "Customers", href: "/customers", icon: Users },
    { name: "Disputes", href: "/disputes", icon: ShieldAlert },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Support", href: "/dashboard/support", icon: MessageSquare },
  ];

  const handleLogout = () => {
    Cookies.remove("swaddo_admin_token");
    Cookies.remove("token");
    Cookies.remove("role");
    router.push("/login");
  };

  return (
    <aside className="w-72 bg-bg-alt/80 backdrop-blur-xl border-r border-border-subtle h-screen sticky top-0 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 overflow-hidden relative">
      {/* Decorative Blob */}
      <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/10 to-transparent -z-10 blur-xl" />

      <div className="p-8 border-b border-border-subtle/50 flex items-center gap-4">
        <motion.div 
          initial={{ rotate: -10, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 text-white font-bold font-heading text-2xl"
        >
          S
        </motion.div>
        <div>
          <h2 className="font-heading font-black text-text-primary text-xl tracking-tight leading-none">Swaddo</h2>
          <span className="text-primary text-xs font-bold uppercase tracking-widest">Admin Portal</span>
        </div>
      </div>

      <nav className="flex-1 p-6 space-y-2 overflow-y-auto hide-scrollbar">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href) && (link.href !== "/dashboard" || pathname === "/dashboard");
          
          return (
            <Link
              key={link.name}
              href={link.href}
              className="block relative"
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/20"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative flex items-center justify-between px-4 py-3.5 rounded-2xl transition-colors font-semibold text-sm z-10",
                isActive 
                  ? "text-primary" 
                  : "text-text-muted hover:text-text-primary hover:bg-bg-main/50"
              )}>
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? "text-primary drop-shadow-sm" : "opacity-60"} strokeWidth={isActive ? 2.5 : 2} />
                  {link.name}
                </div>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <ChevronRight size={16} strokeWidth={3} className="text-primary" />
                  </motion.div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-border-subtle/50 bg-bg-main/30 backdrop-blur-md">
        <button 
          onClick={handleLogout}
          className="group flex items-center justify-center gap-3 w-full px-4 py-3.5 rounded-2xl text-[#B82F12] bg-red-50 hover:bg-red-100 hover:shadow-sm border border-red-100 transition-all font-bold text-sm"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Secure Sign Out
        </button>
      </div>
    </aside>
  );
}
