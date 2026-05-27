"use client";

import * as React from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = React.useState(process.env.NEXT_PUBLIC_ENABLE_MSW !== "true");

  React.useEffect(() => {
    async function enableMocking() {
      if (process.env.NEXT_PUBLIC_ENABLE_MSW === "true") {
        if (typeof window !== "undefined") {
          const { worker } = await import("../mocks/browser");
          await worker.start({
            onUnhandledRequest: "bypass",
            quiet: false,
          });
          setIsReady(true);
        }
      }
    }

    enableMocking();
  }, []);

  if (!isReady) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
}
