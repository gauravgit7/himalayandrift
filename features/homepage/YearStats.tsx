// =============================================================================
// YearStats - Phase 3 · Animated yearly statistics strip
// 'use client' - counter animations on viewport entry
// =============================================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Flag, Users, Map, Star, CheckCircle, Clock } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatItemConfig {
  icon:    React.ReactNode;
  value:   number;
  suffix?: string;
  label:   string;
  color:   string;
}

interface YearStatsProps {
  totalRides:     number;
  completedRides: number;
  upcomingRides:  number;
  marqueeCount:   number;
}

// ---------------------------------------------------------------------------
// Counter hook
// ---------------------------------------------------------------------------

function useCounter(end: number, duration = 1400, active = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let startTime: number | null = null;
    let raf: number;

    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * end));
      if (progress < 1) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, active]);

  return count;
}

// ---------------------------------------------------------------------------
// Single stat cell
// ---------------------------------------------------------------------------

function StatCell({
  icon,
  value,
  suffix = "",
  label,
  color,
  active,
  delay,
}: StatItemConfig & { active: boolean; delay: number }) {
  const count = useCounter(value, 1300, active);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={active ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-col items-center gap-2 py-6 px-4"
    >
      <span className={`text-2xl ${color}`}>{icon}</span>
      <p className="text-3xl sm:text-4xl font-black text-hd-ink-50 tabular-nums">
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="text-xs text-hd-ink-400 text-center leading-snug">{label}</p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function YearStats({
  totalRides,
  completedRides,
  upcomingRides,
  marqueeCount,
}: YearStatsProps) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const stats: StatItemConfig[] = [
    {
      icon:   <Flag className="size-6" />,
      value:  totalRides,
      label:  "Total Rides in 2026",
      color:  "text-hd-ember-500",
    },
    {
      icon:   <CheckCircle className="size-6" />,
      value:  completedRides,
      label:  "Rides Completed",
      color:  "text-emerald-500",
    },
    {
      icon:   <Clock className="size-6" />,
      value:  upcomingRides,
      label:  "Rides Upcoming",
      color:  "text-hd-slate-400",
    },
    {
      icon:   <Star className="size-6" />,
      value:  marqueeCount,
      label:  "Marquee Expeditions",
      color:  "text-violet-400",
    },
  ];

  return (
    <section
      ref={ref}
      className="relative overflow-hidden border-y border-hd-ink-800/60"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 gradient-card opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-r from-hd-ember-950/20 via-transparent to-hd-slate-900/10 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-hd-ink-800/60">
          {stats.map((s, i) => (
            <StatCell
              key={s.label}
              {...s}
              active={inView}
              delay={i * 0.07}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
