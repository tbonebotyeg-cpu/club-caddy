import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Club Caddy — Know Every Yardage",
    template: "%s · Club Caddy",
  },
  description:
    "Build your bag, track your rounds, calculate your handicap, and get smart club recommendations for every shot.",
  applicationName: "Club Caddy",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Club Caddy",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
  openGraph: {
    title: "Club Caddy",
    description: "Your golf bag, scorecards, and handicap — in one sharp app.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col">
        {children}
        <Toaster
          position="top-center"
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--surface-elevated)",
              border: "1px solid var(--border-strong)",
              color: "var(--foreground)",
            },
          }}
        />
      </body>
    </html>
  );
}
