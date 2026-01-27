// components/onboarding/SellerWelcomeWizard.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/lib/hooks/useOnboarding";

interface SellerWelcomeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
}

export default function SellerWelcomeWizard({
  isOpen,
  onClose,
  userName,
}: SellerWelcomeWizardProps) {
  const router = useRouter();
  const { markWelcomeWizardSeen } = useOnboarding();
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Handle animation on mount
  useEffect(() => {
    if (isOpen) {
      // Small delay for entrance animation
      setTimeout(() => setIsVisible(true), 50);

      // Animate through steps
      const stepInterval = setInterval(() => {
        setActiveStep((prev) => (prev < 2 ? prev + 1 : prev));
      }, 800);

      return () => clearInterval(stepInterval);
    } else {
      setIsVisible(false);
      setActiveStep(0);
    }
  }, [isOpen]);

  const handleCreateWebsite = () => {
    markWelcomeWizardSeen();
    onClose();
    router.push("/become-a-seller");
  };

  const handleSkip = () => {
    markWelcomeWizardSeen();
    onClose();
  };

  if (!isOpen) return null;

  const steps = [
    {
      number: 1,
      emoji: "🌐",
      title: "Create Your Website",
      description: "Get your own branded mini-website (2 mins)",
      color: "from-blue-500 to-blue-600",
    },
    {
      number: 2,
      emoji: "📦",
      title: "Add Products",
      description: "Upload items you want to sell",
      color: "from-green-500 to-emerald-600",
    },
    {
      number: 3,
      emoji: "🚀",
      title: "Share & Sell",
      description: "Put your link in Instagram bio & start earning",
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div
      className={`
        fixed inset-0 z-[100] flex items-center justify-center p-4
        transition-all duration-500
        ${isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-transparent"}
      `}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSkip();
      }}
    >
      <div
        className={`
          relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden
          transform transition-all duration-500 ease-out
          ${isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8"}
        `}
      >
        {/* Decorative Header */}
        <div className="bg-gradient-to-br from-black via-gray-900 to-black p-8 pb-12 text-center relative overflow-hidden">
          {/* Animated Background Circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          <div
            className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />

          {/* Confetti Emoji */}
          <div className="text-5xl mb-4 animate-bounce">🎉</div>

          <h2
            className="text-3xl font-bold text-white mb-2"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 700,
            }}
          >
            Welcome to TradeLynk{userName ? `, ${userName.split(" ")[0]}` : ""}!
          </h2>

          <p
            className="text-gray-300 text-base"
            style={{
              fontFamily: "Clash Display",
              fontWeight: 400,
            }}
          >
            You're 3 steps away from selling online
          </p>
        </div>

        {/* Steps Content */}
        <div className="p-6 -mt-6">
          {/* Steps Cards */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`
                  flex items-center gap-4 p-4 rounded-xl transition-all duration-500
                  transform
                  ${
                    activeStep >= index
                      ? "bg-white shadow-md scale-100 opacity-100"
                      : "bg-transparent scale-95 opacity-50"
                  }
                `}
                style={{
                  transitionDelay: `${index * 150}ms`,
                }}
              >
                {/* Step Number/Icon */}
                <div
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-xl
                    bg-gradient-to-br ${step.color} shadow-lg
                    transform transition-all duration-300
                    ${activeStep >= index ? "scale-100" : "scale-90"}
                  `}
                >
                  {step.emoji}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold text-gray-400 uppercase tracking-wider"
                      style={{
                        fontFamily: "Clash Display",
                        fontWeight: 500,
                      }}
                    >
                      Step {step.number}
                    </span>
                    {activeStep >= index && (
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <h3
                    className="text-base font-bold text-black"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 600,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="text-sm text-gray-600"
                    style={{
                      fontFamily: "Clash Display",
                      fontWeight: 400,
                    }}
                  >
                    {step.description}
                  </p>
                </div>

                {/* Checkmark for completed look */}
                {index === 0 && activeStep >= 0 && (
                  <div className="text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Features Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {[
              { emoji: "✅", text: "Free forever" },
              { emoji: "✅", text: "No coding needed" },
              { emoji: "✅", text: "Ready in 2 mins" },
            ].map((feature, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700"
                style={{
                  fontFamily: "Clash Display",
                  fontWeight: 500,
                }}
              >
                {feature.emoji} {feature.text}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleCreateWebsite}
              className="w-full py-4 bg-black text-white font-bold rounded-xl
                       hover:bg-gray-900 active:scale-[0.98] transition-all duration-200
                       flex items-center justify-center gap-2 group shadow-lg"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 700,
              }}
            >
              <span>Create My Website in Minutes</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-3 text-gray-500 font-medium rounded-xl
                       hover:bg-gray-100 active:scale-[0.98] transition-all duration-200"
              style={{
                fontFamily: "Clash Display",
                fontWeight: 500,
              }}
            >
              I'll do this later
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30
                   flex items-center justify-center transition-colors"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
