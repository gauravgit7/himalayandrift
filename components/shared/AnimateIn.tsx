// =============================================================================
// AnimateIn - Phase 9 · Reusable scroll-triggered animation primitives
// 'use client' - Framer Motion cannot run on the server.
// Server Components can still import these as client component children.
// =============================================================================

"use client";

import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Shared easing curve
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = [0.25, 0.46, 0.45, 0.94] as const;

// ---------------------------------------------------------------------------
// Variant library
// ---------------------------------------------------------------------------

const VARIANTS = {
  fadeUp: {
    hidden: { opacity: 0, y: 28 },
    show:   { opacity: 1, y: 0 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    show:   { opacity: 1 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: -36 },
    show:   { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: 36 },
    show:   { opacity: 1, x: 0 },
  },
} as const;

type Variant = keyof typeof VARIANTS;

// ---------------------------------------------------------------------------
// AnimateIn - single element, scroll-triggered
// ---------------------------------------------------------------------------

interface AnimateInProps {
  children:  React.ReactNode;
  className?: string;
  variant?:  Variant;
  delay?:    number;
  duration?: number;
}

export function AnimateIn({
  children,
  className,
  variant  = "fadeUp",
  delay    = 0,
  duration = 0.5,
}: AnimateInProps) {
  return (
    <motion.div
      className={className}
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerContainer - wraps children that should animate with a stagger delay.
// Must be the CSS grid / flex container so StaggerItems are direct children.
// ---------------------------------------------------------------------------

interface StaggerContainerProps {
  children:   React.ReactNode;
  className?: string;
  stagger?:   number;
  delayStart?:number;
}

export function StaggerContainer({
  children,
  className,
  stagger    = 0.08,
  delayStart = 0,
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: stagger,
            delayChildren:   delayStart,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// StaggerItem - direct child of StaggerContainer; receives stagger timing
// automatically via variants inheritance.
// ---------------------------------------------------------------------------

interface StaggerItemProps {
  children:   React.ReactNode;
  className?: string;
}

const STAGGER_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 22 },
  show:   {
    opacity: 1,
    y:       0,
    transition: { duration: 0.45, ease: EASE_OUT_EXPO },
  },
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div className={className} variants={STAGGER_ITEM_VARIANTS}>
      {children}
    </motion.div>
  );
}
