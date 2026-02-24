import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PublicEnv } from "./public-env";
import "./globals.css";
import { Providers } from "./providers";
import { GlobalPlayer } from "@/components/features/player/global-player";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WIPStudio",
  description: "Audio collaboration workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-14 sm:pb-16`}
      >
        <PublicEnv />
        <Providers>
          {children}
          <GlobalPlayer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
