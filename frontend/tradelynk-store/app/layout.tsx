import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import UnverifiedBanner from "@/components/UnverifiedBanner";
import InAppNotifications from "@/components/InAppNotifications";

export const metadata: Metadata = {
  title: "TradeLynk - Campus Marketplace",
  description: "Buy and sell items on campus with TradeLynk",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <Navbar />
          <UnverifiedBanner /> {/* ✅ NEW: Show banner if user is unverified */}
          <InAppNotifications />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
