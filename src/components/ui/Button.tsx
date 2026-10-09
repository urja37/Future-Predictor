import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#141517] text-white hover:bg-[#282A2D] dark:bg-[#EDEDED] dark:text-[#111213] dark:hover:bg-[#FFFFFF] shadow-none",
      secondary:
        "bg-[#F2F1ED] text-[#141517] hover:bg-[#EAE8E2] dark:bg-[#222426] dark:text-[#EDEDED] dark:hover:bg-[#2C2E30]",
      outline:
        "border border-[#E6E4DF] bg-white text-[#141517] hover:bg-[#FAFAF8] dark:border-[#282A2D] dark:bg-[#18191B] dark:text-[#EDEDED] dark:hover:bg-[#222426]",
      ghost:
        "text-[#141517] hover:bg-[#F2F1ED] dark:text-[#EDEDED] dark:hover:bg-[#222426]",
      danger:
        "bg-[#B42318] text-white hover:bg-[#912018] dark:bg-[#F04438] dark:text-white dark:hover:bg-[#D92D20]",
    };

    const sizeStyles = {
      sm: "h-8 px-2.5 text-xs rounded-[6px] gap-1.5",
      md: "h-9 px-3.5 text-sm rounded-[6px] gap-2",
      lg: "h-11 px-5 text-base rounded-[8px] gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
