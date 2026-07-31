"use client";

import { SWRConfig } from "swr";
import { ReactNode } from "react";
import { api } from "@/lib/api";

const globalCache = new Map();

export default function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{
        provider: () => globalCache, // Global cache map to persist across route changes
        fetcher: (url: string) => api.get(url).then(res => res.data),
        revalidateOnFocus: true,
        refreshInterval: 10000, // Auto-refresh data every 10 seconds silently
      }}
    >
      {children}
    </SWRConfig>
  );
}
