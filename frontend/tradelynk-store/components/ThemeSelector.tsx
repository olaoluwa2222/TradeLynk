"use client";

import React, { useState } from "react";
import { Theme, ThemeConfig, THEMES } from "@/types/seller";
import {
  Check,
  Palette,
  Sparkles,
  Zap,
  Crown,
  Users,
  Grid3X3,
} from "lucide-react";

interface ThemeSelectorProps {
  selectedTheme: Theme;
  onThemeChange: (
    theme: Theme,
    primaryColor: string,
    secondaryColor: string
  ) => void;
  customColors?: {
    primary: string;
    secondary: string;
  };
}

// Theme icons mapping
const themeIcons: Record<Theme, React.ElementType> = {
  "modern-clean": Sparkles,
  "bold-vibrant": Zap,
  "minimalist-luxury": Crown,
  "campus-friendly": Users,
  "product-showcase": Grid3X3,
};

export default function ThemeSelector({
  selectedTheme,
  onThemeChange,
  customColors,
}: ThemeSelectorProps) {
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(
    customColors?.primary || "#0F172A"
  );
  const [secondaryColor, setSecondaryColor] = useState(
    customColors?.secondary || "#6366F1"
  );

  const handleThemeSelect = (theme: ThemeConfig) => {
    if (useCustomColors) {
      onThemeChange(theme.id, primaryColor, secondaryColor);
    } else {
      onThemeChange(theme.id, theme.primaryColor, theme.secondaryColor);
      setPrimaryColor(theme.primaryColor);
      setSecondaryColor(theme.secondaryColor);
    }
  };

  const handleColorChange = (type: "primary" | "secondary", color: string) => {
    if (type === "primary") {
      setPrimaryColor(color);
      onThemeChange(selectedTheme, color, secondaryColor);
    } else {
      setSecondaryColor(color);
      onThemeChange(selectedTheme, primaryColor, color);
    }
  };

  const handleCustomColorsToggle = (checked: boolean) => {
    setUseCustomColors(checked);
    if (!checked) {
      const currentTheme = THEMES.find((t) => t.id === selectedTheme);
      if (currentTheme) {
        setPrimaryColor(currentTheme.primaryColor);
        setSecondaryColor(currentTheme.secondaryColor);
        onThemeChange(
          selectedTheme,
          currentTheme.primaryColor,
          currentTheme.secondaryColor
        );
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full mb-4">
          <Palette size={18} className="text-indigo-600" />
          <span className="text-sm font-medium text-indigo-700">
            Choose Your Style
          </span>
        </div>
        <h2
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "Clash Display" }}
        >
          Select a Theme
        </h2>
        <p className="text-gray-500 mt-2">
          Pick a style that represents your brand
        </p>
      </div>

      {/* Theme Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isSelected={selectedTheme === theme.id}
            onSelect={() => handleThemeSelect(theme)}
            Icon={themeIcons[theme.id]}
          />
        ))}
      </div>

      {/* Color Customization */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Palette size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Custom Colors</h3>
              <p className="text-sm text-gray-500">
                Fine-tune your brand colors
              </p>
            </div>
          </div>

          {/* Modern Toggle */}
          <button
            onClick={() => handleCustomColorsToggle(!useCustomColors)}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              useCustomColors
                ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                : "bg-gray-200"
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                useCustomColors ? "left-8" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Color Pickers */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden transition-all duration-300 ${
            useCustomColors ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Primary Color
            </label>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="relative">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleColorChange("primary", e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none ring-2 ring-gray-200"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
              <input
                type="text"
                value={primaryColor.toUpperCase()}
                onChange={(e) => handleColorChange("primary", e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Secondary Color
            </label>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
              <div className="relative">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) =>
                    handleColorChange("secondary", e.target.value)
                  }
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none ring-2 ring-gray-200"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>
              <input
                type="text"
                value={secondaryColor.toUpperCase()}
                onChange={(e) => handleColorChange("secondary", e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 border-0 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                placeholder="#6366F1"
              />
            </div>
          </div>
        </div>

        {/* Color Preview */}
        {useCustomColors && (
          <div
            className="mt-6 p-4 rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            }}
          >
            <p className="text-white text-center font-medium text-sm">
              Your custom gradient preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Theme Card Component - Redesigned
function ThemeCard({
  theme,
  isSelected,
  onSelect,
  Icon,
}: {
  theme: ThemeConfig;
  isSelected: boolean;
  onSelect: () => void;
  Icon: React.ElementType;
}) {
  return (
    <div
      onClick={onSelect}
      className={`
        group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
        ${
          isSelected
            ? "ring-2 ring-offset-2 shadow-xl scale-[1.02]"
            : "hover:shadow-lg hover:scale-[1.01] border border-gray-200"
        }
      `}
      style={isSelected ? { outlineColor: theme.primaryColor, boxShadow: `0 0 0 2px ${theme.primaryColor}` } : {}}
    >
      {/* Theme Preview Background */}
      <div
        className="h-36 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.secondaryColor} 100%)`,
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20 blur-xl" />
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full bg-white/10 blur-lg" />
        </div>

        {/* Mock Store Preview */}
        <div className="absolute inset-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-white/30" />
            <div className="h-2 w-16 rounded-full bg-white/30" />
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full rounded-full bg-white/20" />
            <div className="h-2 w-3/4 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Theme Icon */}
        <div className="absolute top-3 right-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon size={16} className="text-white" />
          </div>
        </div>

        {/* Selected Check */}
        {isSelected && (
          <div className="absolute top-3 left-3">
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-lg">
              <Check size={16} style={{ color: theme.primaryColor }} />
            </div>
          </div>
        )}
      </div>

      {/* Theme Info */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-bold text-gray-900">{theme.name}</h3>
            <p className="text-sm text-gray-500">{theme.description}</p>
          </div>
        </div>

        {/* Color Swatches */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex -space-x-1">
            <div
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: theme.primaryColor }}
            />
            <div
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: theme.secondaryColor }}
            />
          </div>
          <div className="flex-1" />
          {/* Features Tags */}
          <div className="flex gap-1">
            {theme.features.slice(0, 2).map((feature, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
