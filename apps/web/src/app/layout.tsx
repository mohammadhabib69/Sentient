import type { Metadata } from "next";
import "@/app/globals.css";
import { Geist, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { MSWProvider } from "@/providers/msw-provider";
import { Toaster } from "sonner";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Sentient",
  description: "AI-Native Business Reality Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(geist.variable, jetbrainsMono.variable)}>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <MSWProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster position="bottom-right" richColors theme="system" />
              </AuthProvider>
            </QueryProvider>
          </MSWProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
