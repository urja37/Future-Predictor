import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-8 w-full rounded-[6px] border border-[#E6E4DF] bg-white px-2.5 py-1 text-sm text-[#141517] placeholder:text-[#8C8E91] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#141517] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#282A2D] dark:bg-[#18191B] dark:text-[#F0F1F2] dark:placeholder:text-[#606368] dark:focus-visible:ring-[#EDEDED] font-mono",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
