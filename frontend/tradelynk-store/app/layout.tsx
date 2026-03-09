import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { OnboardingProvider } from "@/lib/hooks/useOnboarding";
import { CartProvider } from "@/lib/hooks/useCart";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import UnverifiedBanner from "@/components/UnverifiedBanner";
import InAppNotifications from "@/components/InAppNotifications";
import { OnboardingManager } from "@/components/onboarding";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Tradelynk — Automate Instagram & WhatsApp Sales | AI Sales Assistant",
  description:
    "Stop losing sales to slow replies. Tradelynk gives Instagram sellers a storefront and WhatsApp AI Sales Assistant that works 24/7.",
  keywords: [
    "instagram selling",
    "whatsapp sales automation",
    "AI sales assistant",
    "online storefront",
    "instagram seller tools",
    "ecommerce Nigeria",
  ],
  icons: {
    icon: "/Logo Icon.png",
    shortcut: "/Logo Icon.png",
    apple: "/Logo Icon.png",
  },
  openGraph: {
    title: "Tradelynk — Automate Instagram & WhatsApp Sales",
    description:
      "Your AI Sales Assistant works 24/7 on WhatsApp — answering customers, sending product details, and closing sales while you sleep.",
    url: "https://tradelynk.app",
    siteName: "Tradelynk",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tradelynk — Automate Instagram & WhatsApp Sales",
    description:
      "Stop losing sales to slow replies. AI-powered WhatsApp assistant + storefront for Instagram sellers.",
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
          <CartProvider>
            <OnboardingProvider>
              <Navbar />
              <CartDrawer />
              <UnverifiedBanner /> {/* ✅ Show banner if user is unverified */}
              <InAppNotifications />
              <OnboardingManager /> {/* ✅ Global onboarding components */}
              <Toaster position="top-center" />
              <main>{children}</main>
            </OnboardingProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
