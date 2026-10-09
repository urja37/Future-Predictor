import React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted" | "hero";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantStyles = {
      default: "bg-white border-[#E6E4DF] dark:bg-[#18191B] dark:border-[#282A2D]",
      muted: "bg-[#FAFAF8] border-[#EAE8E2] dark:bg-[#141517] dark:border-[#242628]",
      hero: "bg-white border-[#DCD9D2] dark:bg-[#18191B] dark:border-[#34373B] shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[8px] border transition-colors",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5 border-b border-[#E6E4DF]/60 dark:border-[#282A2D]/60", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold leading-none tracking-tight text-[#141517] dark:text-[#F0F1F2]", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-xs text-[#707275] dark:text-[#909499] mt-1 leading-relaxed", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center p-5 pt-0", className)}
      {...props}
    />
  );
}
