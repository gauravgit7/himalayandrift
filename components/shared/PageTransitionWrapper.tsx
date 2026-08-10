// =============================================================================
// PageTransitionWrapper - Phase 9 · Page-level enter animation
// 'use client' - uses usePathname to key each route change.
// Renders as <main> so the layout doesn't need a separate <main> tag.
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

interface PageTransitionWrapperProps {
  children:   React.ReactNode;
  className?: string;
}

export function PageTransitionWrapper({
  children,
  className,
}: PageTransitionWrapperProps) {
  const pathname = usePathname();

  return (
    <motion.main
      key={pathname}
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.main>
  );
}
