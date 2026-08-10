"use client";

// =============================================================================
// Button - reusable base button with TVS brand variants
// =============================================================================

import { forwardRef } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    "bg-tvs-red-600 text-white hover:bg-tvs-red-500 active:bg-tvs-red-700 " +
    "shadow-sm hover:shadow-glow-red focus-visible:ring-tvs-red-500",
  secondary:
    "bg-tvs-charcoal-800 text-tvs-charcoal-100 border border-tvs-charcoal-600 " +
    "hover:bg-tvs-charcoal-700 hover:border-tvs-charcoal-500 active:bg-tvs-charcoal-900",
  ghost:
    "bg-transparent text-tvs-charcoal-200 hover:bg-tvs-charcoal-800 hover:text-tvs-charcoal-50 " +
    "active:bg-tvs-charcoal-900",
  danger:
    "bg-red-700 text-white hover:bg-red-600 active:bg-red-800 " +
    "shadow-sm focus-visible:ring-red-500",
  outline:
    "bg-transparent text-tvs-red-400 border border-tvs-red-600 " +
    "hover:bg-tvs-red-600/10 hover:text-tvs-red-300 active:bg-tvs-red-600/20",
};

const SIZE_STYLES: Record<Size, string> = {
  sm: "h-8  px-3  text-xs  gap-1.5",
  md: "h-10 px-4  text-sm  gap-2",
  lg: "h-12 px-6  text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          "inline-flex items-center justify-center font-medium rounded-lg",
          "transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "focus-visible:ring-offset-tvs-charcoal-950",
          "select-none cursor-pointer",
          // Disabled state
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
          // Variant + size
          VARIANT_STYLES[variant],
          SIZE_STYLES[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
