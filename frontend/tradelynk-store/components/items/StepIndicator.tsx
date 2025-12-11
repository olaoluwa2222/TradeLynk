import React from "react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps,
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2 md:gap-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <React.Fragment key={step}>
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? "bg-black text-white"
                    : isActive
                    ? "bg-black text-white border-2 border-black"
                    : "bg-gray-100 text-gray-400 border-2 border-gray-200"
                }`}
              >
                {isCompleted ? (
                  <Check size={20} className="font-bold" />
                ) : (
                  <span className="text-sm font-semibold">{stepNumber}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="text-center flex-1 md:flex-none">
                <p
                  className={`text-xs md:text-sm font-medium transition-colors duration-300 ${
                    isActive || isCompleted ? "text-black" : "text-gray-400"
                  }`}
                >
                  {step}
                </p>
              </div>

              {/* Connecting Line */}
              {stepNumber < totalSteps && (
                <div
                  className={`hidden md:block h-1 w-12 transition-all duration-300 ${
                    isCompleted ? "bg-black" : "bg-gray-200"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </p>
        <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};
