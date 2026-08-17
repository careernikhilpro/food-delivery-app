"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Check, X } from "lucide-react";

export default function Settings() {
  const [codEnabled, setCodEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/settings/cod")
      .then(res => res.json())
      .then(data => {
        setCodEnabled(data.enabled);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const toggleCod = async () => {
    const token = localStorage.getItem("swaddo_admin_token");
    const newState = !codEnabled;
    try {
      setCodEnabled(newState);
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + "/admin/settings/cod", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ enabled: newState })
      });
      if (!res.ok) throw new Error("Failed to update");
      alert(`Cash on Delivery turned ${newState ? 'ON' : 'OFF'}`);
    } catch (err) {
      alert("Failed to update setting");
      setCodEnabled(!newState); // revert
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">System Settings</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Cash on Delivery</h2>
              <p className="text-gray-500 mt-1 text-sm">Enable or disable COD globally for all orders.</p>
            </div>

            {isLoading ? (
              <div className="w-14 h-7 bg-gray-200 rounded-full animate-pulse"></div>
            ) : (
              <button 
                onClick={toggleCod}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${codEnabled ? 'bg-[#00A14F]' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${codEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            )}
          </div>
          <div className="mt-4 p-4 rounded-xl bg-gray-50 text-sm text-gray-600 border border-gray-100">
            <strong>Status:</strong> Cash on Delivery is currently 
            <span className={`ml-2 font-bold ${codEnabled ? 'text-green-600' : 'text-red-500'}`}>
              {codEnabled ? 'AVAILABLE' : 'UNAVAILABLE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
