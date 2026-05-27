"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      storageKey="sentient-theme"
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
