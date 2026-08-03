"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Store, ShoppingBag, Bike, ShieldAlert, TrendingUp, ArrowUpRight, Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const [stats, setStats] = useState({
    ordersToday: 0,
    revenueToday: 0,
    activeVendors: 0,
    activeRiders: 0,
    pendingDisputes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (error) {
        console.log("Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    
    // Poll every 30 seconds for live feel
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-[80vh]">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Orders", value: stats.ordersToday, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Today's Revenue", value: `₹${stats.revenueToday}`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
    { label: "Active Vendors", value: stats.activeVendors, icon: Store, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Active Riders", value: stats.activeRiders, icon: Bike, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Pending Disputes", value: stats.pendingDisputes, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-2"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Live System Status</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-heading font-black text-text-primary tracking-tight"
          >
            Platform Overview
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-text-muted mt-1 font-medium"
          >
            Real-time statistics and activity for the Swaddo platform.
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className={`bg-bg-alt/80 backdrop-blur-xl rounded-3xl p-6 shadow-sm border ${stat.border} flex flex-col hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden group`}
            >
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl group-hover:scale-150 transition-transform duration-700`} />
              
              <div className="flex justify-between items-start mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-inner`}>
                  <Icon size={24} strokeWidth={2.5} />
                </div>
                <ArrowUpRight size={20} className={`${stat.color} opacity-50`} />
              </div>
              
              <div className="mt-auto relative z-10">
                <p className="text-4xl font-black font-heading text-text-primary tracking-tight mb-1">{stat.value}</p>
                <p className="text-sm text-text-muted font-semibold">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Placeholder for Quick Actions or Activity Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 bg-bg-alt/80 backdrop-blur-xl rounded-3xl p-8 border border-border-subtle shadow-sm flex items-center justify-center min-h-[300px]"
      >
        <div className="text-center flex flex-col items-center opacity-50">
          <Activity size={48} className="mb-4 text-text-muted" strokeWidth={1} />
          <h3 className="text-xl font-heading font-bold text-text-primary">Live Activity Feed</h3>
          <p className="text-text-muted mt-2">Connecting to order stream...</p>
        </div>
      </motion.div>
    </div>
  );
}
