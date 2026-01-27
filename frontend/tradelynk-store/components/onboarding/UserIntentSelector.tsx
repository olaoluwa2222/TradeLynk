// components/onboarding/UserIntentSelector.tsx
"use client";

import { useState } from "react";
import { UserIntent } from "@/lib/hooks/useOnboarding";

interface UserIntentSelectorProps {
  onSelect: (intent: UserIntent) => void;
  initialIntent?: UserIntent;
}

export default function UserIntentSelector({
  onSelect,
  initialIntent = null,
}: UserIntentSelectorProps) {
  const [selected, setSelected] = useState<UserIntent>(initialIntent);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = (intent: UserIntent) => {
    setSelected(intent);
    setIsAnimating(true);

    // Small delay for animation
    setTimeout(() => {
      onSelect(intent);
      setIsAnimating(false);
    }, 300);
  };

  const options = [
    {
      id: "buyer" as UserIntent,
      emoji: "🛍️",
      title: "I want to Buy",
      description: "Browse and purchase amazing products from sellers",
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:border-blue-500",
      selectedBg: "bg-blue-50",
      selectedBorder: "border-blue-500",
    },
    {
      id: "seller" as UserIntent,
      emoji: "💰",
      title: "I want to Sell",
      description: "Create my own website and start selling products",
      color: "from-green-500 to-emerald-600",
      hoverColor: "hover:border-green-500",
      selectedBg: "bg-green-50",
      selectedBorder: "border-green-500",
    },
    {
      id: "both" as UserIntent,
      emoji: "🔄",
      title: "Both - Buy & Sell",
      description: "Shop from others and sell my own products too",
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:border-purple-500",
      selectedBg: "bg-purple-50",
      selectedBorder: "border-purple-500",
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h3
          className="text-2xl font-bold text-black mb-2"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 700,
          }}
        >
          What brings you to TradeLynk?
        </h3>
        <p
          className="text-gray-600 text-sm"
          style={{
            fontFamily: "Clash Display",
            fontWeight: 400,
          }}
        >
          This helps us personalize your experience
        </p>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            disabled={isAnimating}
            className={`
              w-full p-5 rounded-xl border-2 transition-all duration-300 text-left
              transform hover:scale-[1.02] active:scale-[0.98]
              ${
                selected === option.id
                  ? `${option.selectedBg} ${option.selectedBorder} shadow-lg`
                  : `bg-white border-gray-200 ${option.hoverColor} hover:shadow-md`
              }
              ${isAnimating && selected === option.id ? "scale-[1.02]" : ""}
            `}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="flex items-center gap-4">
              {/* Emoji Icon */}
              <div
                className={`
                  w-14 h-14 rounded-xl flex items-center justify-center text-2xl
                  bg-gradient-to-br ${option.color} shadow-md
                  transform transition-transform duration-300
                  ${selected === option.id ? "scale-110" : ""}
                `}
              >
                {option.emoji}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4
                  className="text-lg font-bold text-black mb-1"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 600,
                  }}
                >
                  {option.title}
                </h4>
                <p
                  className="text-sm text-gray-600"
                  style={{
                    fontFamily: "Clash Display",
                    fontWeight: 400,
                  }}
                >
                  {option.description}
                </p>
              </div>

              {/* Selection Indicator */}
              <div
                className={`
                  w-6 h-6 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300
                  ${
                    selected === option.id
                      ? `${option.selectedBorder} bg-gradient-to-br ${option.color}`
                      : "border-gray-300"
                  }
                `}
              >
                {selected === option.id && (
                  <svg
                    className="w-4 h-4 text-white animate-[scaleIn_0.2s_ease-out]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Helper Text */}
      <p
        className="text-center text-gray-500 text-xs mt-6"
        style={{
          fontFamily: "Clash Display",
          fontWeight: 400,
        }}
      >
        💡 You can always change this later in settings
      </p>
    </div>
  );
}
