import React from "react";
import { cn } from "../../lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  className,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
  ...props
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min || 1)) * 100));

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#E6E4DF] dark:bg-[#282A2D] rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  );
};
