// components/onboarding/OnboardingManager.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import SellerWelcomeWizard from "./SellerWelcomeWizard";
import MobileSellerCTA from "./MobileSellerCTA";

/**
 * OnboardingManager
 *
 * This component manages the global onboarding experience:
 * - Shows the Seller Welcome Wizard at the right time
 * - Shows the Mobile Seller CTA for non-sellers
 * - Coordinates between different onboarding components
 *
 * Add this component to your main layout to enable onboarding globally.
 */
export default function OnboardingManager() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { shouldShowWelcomeWizard } = useOnboarding();
  const [showWizard, setShowWizard] = useState(false);

  // Check if we should show the welcome wizard
  useEffect(() => {
    if (!isLoading && isAuthenticated && shouldShowWelcomeWizard()) {
      // Small delay to let the page load first
      const timer = setTimeout(() => {
        setShowWizard(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, shouldShowWelcomeWizard]);

  // Don't render anything while loading
  if (isLoading) return null;

  return (
    <>
      {/* Seller Welcome Wizard - shows for new sellers */}
      <SellerWelcomeWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        userName={user?.name}
      />

      {/* Mobile Seller CTA - sticky bottom bar for non-sellers */}
      <MobileSellerCTA />
    </>
  );
}
