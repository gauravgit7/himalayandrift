"use client";

// =============================================================================
// Button - reusable base button with brand variants
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
    "bg-hd-ember-600 text-white hover:bg-hd-ember-500 active:bg-hd-ember-700 " +
    "shadow-sm hover:shadow-glow-ember focus-visible:ring-hd-ember-500",
  secondary:
    "bg-hd-ink-800 text-hd-ink-100 border border-hd-ink-600 " +
    "hover:bg-hd-ink-700 hover:border-hd-ink-500 active:bg-hd-ink-900",
  ghost:
    "bg-transparent text-hd-ink-200 hover:bg-hd-ink-800 hover:text-hd-ink-50 " +
    "active:bg-hd-ink-900",
  danger:
    "bg-red-700 text-white hover:bg-red-600 active:bg-red-800 " +
    "shadow-sm focus-visible:ring-red-500",
  outline:
    "bg-transparent text-hd-ember-400 border border-hd-ember-600 " +
    "hover:bg-hd-ember-600/10 hover:text-hd-ember-300 active:bg-hd-ember-600/20",
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
          "focus-visible:ring-offset-hd-ink-950",
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
