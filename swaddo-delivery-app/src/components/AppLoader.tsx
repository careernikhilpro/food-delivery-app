"use client";

interface AppLoaderProps {
  type?: "earnings" | "profile" | "floating-cash" | "default";
}

export default function AppLoader({ type = "default" }: AppLoaderProps) {
  if (type === "profile") {
    return (
      <div className="px-5 pt-8 pb-28 max-w-md mx-auto min-h-screen bg-[#F8FAFC] animate-pulse">
        {/* Header */}
        <div className="h-8 bg-slate-200 rounded-lg w-32 mb-6"></div>

        {/* Profile Card */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 mb-6 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200 shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            <div className="h-6 bg-slate-200 rounded w-16 mt-2"></div>
          </div>
        </div>

        {/* Accordions */}
        <div className="space-y-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm flex justify-between items-center">
              <div className="flex gap-3 items-center w-full">
                <div className="w-6 h-6 bg-slate-200 rounded-md"></div>
                <div className="h-4 bg-slate-200 rounded w-40"></div>
              </div>
              <div className="w-5 h-5 bg-slate-200 rounded-full"></div>
            </div>
          ))}
        </div>

        {/* Bottom Buttons */}
        <div className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-slate-200 rounded-md"></div>
          <div className="h-4 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="bg-slate-200 rounded-[20px] py-4 h-[56px] w-full"></div>
      </div>
    );
  }

  if (type === "floating-cash") {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 animate-pulse">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-md mx-auto px-4 h-14 flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
            <div className="h-5 bg-slate-200 rounded w-32"></div>
          </div>
        </div>
        
        <div className="flex-1 max-w-md mx-auto w-full p-6 pb-24">
          {/* Main Cash Card */}
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm mb-6 flex flex-col items-center">
            <div className="h-3 bg-slate-200 rounded w-24 mb-4"></div>
            <div className="h-12 bg-slate-200 rounded w-40 mb-3"></div>
            <div className="h-3 bg-slate-200 rounded w-20 mb-8"></div>
            <div className="h-3 w-full bg-slate-200 rounded-full"></div>
          </div>

          {/* Bank Details Card */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
              <div className="h-4 bg-slate-200 rounded w-40"></div>
            </div>
            <div className="h-32 bg-slate-100 rounded-xl w-full"></div>
          </div>

          {/* Action Button */}
          <div className="h-14 bg-slate-200 rounded-xl w-full"></div>
        </div>
      </div>
    );
  }

  // Earnings or Default Layout
  return (
    <div className="px-5 pt-3 pb-24 max-w-md mx-auto min-h-screen bg-[#F8FAFC] animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-3">
        <div className="h-7 bg-slate-200 rounded-lg w-28"></div>
        <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
      </div>

      {/* Top Cards Skeleton */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border border-slate-100 rounded-tl-[24px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px] p-4 h-24 shadow-sm flex flex-col justify-center">
          <div className="h-2.5 bg-slate-200 rounded w-16 mb-3"></div>
          <div className="h-7 bg-slate-200 rounded w-20"></div>
        </div>
        <div className="bg-white border border-slate-100 rounded-tl-[24px] rounded-br-[24px] rounded-tr-[8px] rounded-bl-[8px] p-4 h-24 shadow-sm flex flex-col justify-center">
          <div className="h-2.5 bg-slate-200 rounded w-16 mb-3"></div>
          <div className="h-7 bg-slate-200 rounded w-20"></div>
        </div>
      </div>

      {/* Large Chart Block Skeleton */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-4 mb-5 h-36 shadow-sm flex flex-col justify-between">
        <div className="h-3.5 bg-slate-200 rounded w-24 mb-4"></div>
        <div className="flex justify-between items-end h-16 px-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
             <div key={i} className="flex flex-col items-center gap-2">
               <div className={`w-3 bg-slate-200 rounded-t-full ${i%2===0?'h-12':(i%3===0?'h-16':'h-8')}`}></div>
               <div className="w-4 h-2 bg-slate-200 rounded"></div>
             </div>
          ))}
        </div>
      </div>

      {/* List Skeleton */}
      <div className="h-4 bg-slate-200 rounded w-32 mb-3"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-100 rounded-[16px] p-4 flex flex-col shadow-sm">
            <div className="flex justify-between mb-3">
              <div className="space-y-2">
                <div className="h-3.5 bg-slate-200 rounded w-28"></div>
                <div className="h-2.5 bg-slate-200 rounded w-20"></div>
              </div>
              <div className="space-y-1 text-right">
                 <div className="h-2 bg-slate-200 rounded w-12 ml-auto"></div>
                 <div className="h-5 bg-slate-200 rounded w-16 ml-auto mt-1"></div>
              </div>
            </div>
            <div className="h-px bg-slate-100 w-full mb-3"></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <div className="h-2.5 bg-slate-200 rounded w-16"></div>
                <div className="h-2.5 bg-slate-200 rounded w-8"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-2.5 bg-slate-200 rounded w-16"></div>
                <div className="h-2.5 bg-slate-200 rounded w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
