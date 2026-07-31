"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { BarChart3, TrendingUp, TrendingDown, IndianRupee, ShoppingBag, Loader2, ChevronRight } from "lucide-react";

import useSWR from "swr";

export default function InsightsPage() {
  useAuth();
  const [period, setPeriod] = useState("this_week");
  
  const fetcher = (url: string) => api.get(url).then(res => res.data);
  const { data, error, isLoading: loading } = useSWR(`/stalls/merchant/insights?period=${period}`, fetcher);

  const periodLabel = period === 'today' ? 'Today' : period === 'this_week' ? 'This Week' : 'This Month';

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] bg-slate-50 relative max-w-md mx-auto w-full overflow-hidden">
      {/* Premium Header */}
      <div className="pt-10 px-6 pb-6 bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Business <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-500">Insights</span></h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Track your growth</p>
        </div>
        <select 
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-slate-100/80 text-sm font-bold text-slate-700 px-4 py-2.5 rounded-full outline-none shadow-sm hover:bg-slate-200 transition-colors cursor-pointer appearance-none border border-slate-200"
        >
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        {loading ? (
          <div className="p-6 space-y-6 max-w-md mx-auto pb-32">
            {/* Skeleton Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 h-32 animate-pulse flex flex-col justify-between">
                <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                <div className="h-8 bg-slate-100 rounded-full w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-full w-1/3 mt-2"></div>
              </div>
              <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 h-32 animate-pulse flex flex-col justify-between">
                <div className="h-4 bg-slate-100 rounded-full w-1/2"></div>
                <div className="h-8 bg-slate-100 rounded-full w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded-full w-1/3 mt-2"></div>
              </div>
            </div>
            
            {/* Skeleton Sales Chart Placeholder */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-50 h-64 animate-pulse flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div className="h-6 bg-slate-100 rounded-full w-1/3"></div>
                <div className="h-6 bg-slate-100 rounded-full w-16"></div>
              </div>
              <div className="flex-1 flex items-end justify-between gap-3">
                {[20, 45, 60, 30, 80, 50, 90].map((h, i) => (
                  <div key={i} className="bg-slate-100 rounded-t-lg w-full" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6 max-w-md mx-auto pb-32">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
                <div className="relative z-10">
                  <div className="flex items-center text-slate-500 mb-3 gap-1.5">
                    <IndianRupee size={16} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{periodLabel} Revenue</span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight truncate">₹{Number(data?.totalRevenue || 0).toFixed(0)}</div>
                  <div className="flex items-center text-green-500 text-xs font-bold mt-2 bg-green-50 w-max px-2 py-1 rounded-md">
                    <TrendingUp size={14} className="mr-1" />
                    +{data?.growthRevenue || 0}%
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 relative overflow-hidden group hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500 z-0"></div>
                <div className="relative z-10">
                  <div className="flex items-center text-slate-500 mb-3 gap-1.5">
                    <ShoppingBag size={16} />
                    <span className="text-[11px] font-bold uppercase tracking-wider">{periodLabel} Orders</span>
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight truncate">{data?.totalOrders || 0}</div>
                  <div className="flex items-center text-green-500 text-xs font-bold mt-2 bg-green-50 w-max px-2 py-1 rounded-md">
                    <TrendingUp size={14} className="mr-1" />
                    +{data?.growthOrders || 0}%
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Chart Placeholder */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">Sales Trend</h2>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">{periodLabel}</span>
              </div>
              <div className="h-44 flex items-end justify-between gap-2.5">
                {data?.chartData && data.chartData.length > 0 ? (
                  data.chartData.map((point: any, i: number) => {
                    const maxVal = Math.max(...data.chartData.map((d:any)=>d.value)) || 1;
                    const height = Math.max(10, (point.value / maxVal) * 100);
                    return (
                      <div key={i} className="flex-1 bg-slate-100 rounded-t-xl relative group flex justify-center cursor-pointer overflow-visible transition-all duration-300 hover:bg-slate-200" style={{ height: `${height}%`, minWidth: '12px' }}>
                        <div className="absolute bottom-0 w-full bg-slate-800 rounded-t-xl transition-all duration-300 opacity-80 group-hover:opacity-100" style={{ height: `100%` }}></div>
                        <span className="absolute -bottom-6 text-[10px] text-slate-400 font-bold truncate w-full text-center">
                          {point.label.substring(0,3)}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute -top-10 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-lg">
                          ₹{Number(point.value).toFixed(0)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <BarChart3 size={32} className="mb-2 opacity-50" />
                    <span className="text-sm font-bold">No sales data yet</span>
                  </div>
                )}
              </div>
              <div className="mt-10 border-t border-slate-100 pt-4 flex justify-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Performance Timeline</span>
              </div>
            </div>

            {/* Top Selling Items */}
            <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-extrabold text-xl text-slate-800 tracking-tight">Top Sellers</h2>
                <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center">
                  <BarChart3 size={16} className="text-slate-600" />
                </div>
              </div>
              {data?.topItems && data.topItems.length > 0 ? (
                <div className="space-y-4">
                  {data.topItems.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm shadow-inner ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'}`}>
                          #{idx + 1}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{item.orders} orders</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                   <p className="text-sm font-bold text-slate-400">No top items yet.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
