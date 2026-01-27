// lib/hooks/useOnboarding.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/hooks/useAuth";

export type UserIntent = "buyer" | "seller" | "both" | null;

interface OnboardingState {
  userIntent: UserIntent;
  hasSeenWelcomeWizard: boolean;
  hasStorefront: boolean;
  hasFirstProduct: boolean;
  hasSharedLink: boolean;
  completedSteps: number;
  totalSteps: number;
}

interface OnboardingContextType {
  state: OnboardingState;
  setUserIntent: (intent: UserIntent) => void;
  markWelcomeWizardSeen: () => void;
  markStorefrontCreated: () => void;
  markFirstProductAdded: () => void;
  markLinkShared: () => void;
  shouldShowWelcomeWizard: () => boolean;
  resetOnboarding: () => void;
  isOnboardingComplete: () => boolean;
  getOnboardingProgress: () => {
    completed: number;
    total: number;
    percentage: number;
  };
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

const ONBOARDING_STORAGE_KEY = "tradelynk_onboarding";

const defaultState: OnboardingState = {
  userIntent: null,
  hasSeenWelcomeWizard: false,
  hasStorefront: false,
  hasFirstProduct: false,
  hasSharedLink: false,
  completedSteps: 0,
  totalSteps: 5,
};

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setState((prev) => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error("Failed to load onboarding state:", error);
      }
      setIsLoaded(true);
    }
  }, []);

  // Sync with user role if already a seller
  useEffect(() => {
    if (isAuthenticated && user) {
      const isSeller =
        user.role === "SELLER" || user.role === "BOTH" || user.role === "ADMIN";
      if (isSeller) {
        setState((prev) => ({
          ...prev,
          hasStorefront: true,
          userIntent: user.role === "BOTH" ? "both" : "seller",
        }));
      }
    }
  }, [isAuthenticated, user]);

  // Calculate completed steps
  useEffect(() => {
    const steps = [
      true, // Account created (always true if viewing)
      user?.isEmailVerified || user?.verified || false,
      state.hasStorefront,
      state.hasFirstProduct,
      state.hasSharedLink,
    ];
    const completed = steps.filter(Boolean).length;
    setState((prev) => ({ ...prev, completedSteps: completed }));
  }, [state.hasStorefront, state.hasFirstProduct, state.hasSharedLink, user]);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<OnboardingState>) => {
    setState((prev) => {
      const updated = { ...prev, ...newState };
      if (typeof window !== "undefined") {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const setUserIntent = useCallback(
    (intent: UserIntent) => {
      saveState({ userIntent: intent });
    },
    [saveState],
  );

  const markWelcomeWizardSeen = useCallback(() => {
    saveState({ hasSeenWelcomeWizard: true });
  }, [saveState]);

  const markStorefrontCreated = useCallback(() => {
    saveState({ hasStorefront: true });
  }, [saveState]);

  const markFirstProductAdded = useCallback(() => {
    saveState({ hasFirstProduct: true });
  }, [saveState]);

  const markLinkShared = useCallback(() => {
    saveState({ hasSharedLink: true });
  }, [saveState]);

  const shouldShowWelcomeWizard = useCallback(() => {
    // Show wizard if:
    // 1. User intent is seller or both
    // 2. Haven't seen wizard before
    // 3. Don't have a storefront yet
    // 4. Is authenticated
    const wantsToSell =
      state.userIntent === "seller" || state.userIntent === "both";
    return (
      isAuthenticated &&
      wantsToSell &&
      !state.hasSeenWelcomeWizard &&
      !state.hasStorefront &&
      isLoaded
    );
  }, [state, isAuthenticated, isLoaded]);

  const resetOnboarding = useCallback(() => {
    setState(defaultState);
    if (typeof window !== "undefined") {
      localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, []);

  const isOnboardingComplete = useCallback(() => {
    return state.completedSteps >= state.totalSteps;
  }, [state.completedSteps, state.totalSteps]);

  const getOnboardingProgress = useCallback(() => {
    const completed = state.completedSteps;
    const total = state.totalSteps;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [state.completedSteps, state.totalSteps]);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        setUserIntent,
        markWelcomeWizardSeen,
        markStorefrontCreated,
        markFirstProductAdded,
        markLinkShared,
        shouldShowWelcomeWizard,
        resetOnboarding,
        isOnboardingComplete,
        getOnboardingProgress,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
