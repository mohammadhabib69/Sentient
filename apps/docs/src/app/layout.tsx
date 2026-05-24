import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentient Docs",
  description: "Developer documentation for Sentient",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
