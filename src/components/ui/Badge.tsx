import React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "blue" | "green" | "yellow" | "red" | "outline";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  children,
  ...props
}) => {
  const variantStyles = {
    neutral:
      "bg-[#F2F1ED] text-[#525457] dark:bg-[#25272A] dark:text-[#A0A4A8]",
    blue:
      "bg-[#E1F3FE] text-[#1F6C9F] dark:bg-[#122A3B] dark:text-[#67B2E4]",
    green:
      "bg-[#EDF3EC] text-[#346538] dark:bg-[#152B18] dark:text-[#76BC7C]",
    yellow:
      "bg-[#FBF3DB] text-[#956400] dark:bg-[#2E250E] dark:text-[#DEAE42]",
    red:
      "bg-[#FDEBEC] text-[#9F2F2D] dark:bg-[#321718] dark:text-[#F07B7A]",
    outline:
      "border border-[#E6E4DF] text-[#525457] bg-white dark:border-[#282A2D] dark:text-[#A0A4A8] dark:bg-[#18191B]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-[0.05em] uppercase transition-colors select-none",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
