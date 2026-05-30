"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: userResponse, isLoading, isError } = useCurrentUser();
  const { user } = useAuthStore();

  React.useEffect(() => {
    // If not loading and there's an error or no user data, redirect to login
    if (!isLoading) {
      if (isError || !userResponse) {
        // Only redirect if we are not already on an auth page (just in case)
        if (!pathname.startsWith("/login") && !pathname.startsWith("/register")) {
          router.push("/login");
        }
      }
    }
  }, [isLoading, isError, userResponse, pathname, router]);

  // Show a loading state until we confirm auth status
  if (isLoading || (!userResponse && !isError)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-mist-teal" />
      </div>
    );
  }

  // If authenticated, render children
  return <>{children}</>;
}
