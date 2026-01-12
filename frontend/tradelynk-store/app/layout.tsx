import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import UnverifiedBanner from "@/components/UnverifiedBanner";
import InAppNotifications from "@/components/InAppNotifications";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "TradeLynk - Online Marketplace",
  description:
    "Buy and sell items online with TradeLynk - Nigeria's trusted marketplace",
  icons: {
    icon: "/Logo Icon.png",
    shortcut: "/Logo Icon.png",
    apple: "/Logo Icon.png",
  },
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
          <Toaster position="top-center" />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
