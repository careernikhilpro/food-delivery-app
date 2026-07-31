"use client";

import { ReactNode } from "react";

export default function PageTransitionWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full flex flex-col">
      {children}
    </div>
  );
}
