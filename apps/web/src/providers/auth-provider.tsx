"use client";

import * as React from "react";
// import { useAuthStore } from "@/store/auth.store"
// import { useRouter, usePathname } from "next/navigation"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Fix for blank screen when returning from OAuth via the browser "Back" button (BFCache)
  React.useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return <>{children}</>;
}
