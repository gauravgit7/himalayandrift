// =============================================================================
// AdminCalendarView - Phase 5 · Drag-drop monthly calendar using dnd-kit
// 'use client' - DnDContext, local state for rescheduled rides
// Phase 6 persists rescheduled dates to Supabase
// =============================================================================

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  useDraggable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { ChevronLeft, ChevronRight, Info, RotateCcw, Save } from "lucide-react";
import { format, parseISO, addDays } from "@/utils/date";
import { differenceInDays } from "date-fns";
import { getMonthCalendarDays } from "@/utils/date";
import { cn } from "@/utils/cn";
import { ROUTES, MONTHS } from "@/lib/constants";
import type { Ride } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COMMUNITY_BG: Record<string, string> = {
  AOG:      "bg-tvs-red-900/60 border-l-tvs-red-500 text-tvs-red-200",
  CULT:     "bg-tvs-steel-900/60 border-l-tvs-steel-400 text-tvs-steel-200",
  AOGxCULT: "bg-violet-900/60 border-l-violet-500 text-violet-200",
};

// ---------------------------------------------------------------------------
// Draggable ride chip
// ---------------------------------------------------------------------------

function DraggableChip({
  ride,
  isDragged,
}: {
  ride:      Ride;
  isDragged: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id:   ride.id,
    data: { ride },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "px-1.5 py-0.5 rounded text-[11px] border-l-2 truncate cursor-grab active:cursor-grabbing select-none",
        "transition-opacity duration-100 leading-snug",
        COMMUNITY_BG[ride.community] ?? "bg-tvs-charcoal-800 border-l-tvs-charcoal-600 text-tvs-charcoal-200",
        isDragged ? "opacity-40" : "hover:brightness-110"
      )}
      title={`Drag to reschedule: ${ride.title}`}
    >
      <span className="flex items-center gap-1">
        {ride.rideType === "marquee" && <span className="text-yellow-400">★</span>}
        <span className="truncate">{ride.title}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Droppable day cell
// ---------------------------------------------------------------------------

function DroppableCell({
  dateStr,
  dayNum,
  isCurrentMonth,
  rides,
  activeRideId,
}: {
  dateStr:       string;
  dayNum:        number;
  isCurrentMonth: boolean;
  rides:         Ride[];
  activeRideId:  string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: dateStr });
  const isToday = dateStr === format(new Date(), "yyyy-MM-dd");

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-h-[80px] p-1 border-b border-r border-tvs-charcoal-800/50 transition-colors duration-100",
        isCurrentMonth ? "bg-transparent" : "bg-tvs-charcoal-900/30",
        isOver && "bg-tvs-red-950/30 border-tvs-red-800/40",
        isOver && "ring-1 ring-inset ring-tvs-red-700/40"
      )}
    >
      {/* Day number */}
      <span
        className={cn(
          "inline-flex items-center justify-center text-xs font-semibold mb-1 w-6 h-6 rounded-full",
          isToday
            ? "bg-tvs-red-600 text-white font-bold"
            : isCurrentMonth
            ? "text-tvs-charcoal-300"
            : "text-tvs-charcoal-700"
        )}
      >
        {dayNum}
      </span>

      {/* Drop hint */}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[9px] font-bold text-tvs-red-400 uppercase tracking-wider">
            Drop here
          </span>
        </div>
      )}

      {/* Ride chips */}
      {isCurrentMonth && (
        <div className="flex flex-col gap-0.5">
          {rides.slice(0, 3).map((ride) => (
            <DraggableChip
              key={ride.id}
              ride={ride}
              isDragged={ride.id === activeRideId}
            />
          ))}
          {rides.length > 3 && (
            <span className="text-[10px] text-tvs-charcoal-500 pl-1">
              +{rides.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag overlay (ride chip shown while dragging)
// ---------------------------------------------------------------------------

function DragOverlayChip({ ride }: { ride: Ride }) {
  return (
    <div
      className={cn(
        "px-2 py-1 rounded text-xs border-l-2 shadow-lg cursor-grabbing select-none max-w-[180px]",
        COMMUNITY_BG[ride.community] ?? "bg-tvs-charcoal-800 border-l-tvs-charcoal-600 text-tvs-charcoal-200"
      )}
    >
      {ride.title}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface AdminCalendarViewProps {
  initialRides: Ride[];
}

export function AdminCalendarView({ initialRides }: AdminCalendarViewProps) {
  const [rides,       setRides]       = useState<Ride[]>(initialRides);
  const [year,        setYear]        = useState(2026);
  const [month,       setMonth]       = useState(4); // May
  const [activeRide,  setActiveRide]  = useState<Ride | null>(null);
  const [changes,     setChanges]     = useState<Record<string, { from: string; to: string }>>({});
  const [saveFeedback, setSaveFeedback] = useState(false);

  // ── Sensors (pointer + touch) ──────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // ── Calendar grid ──────────────────────────────────────────────────────
  const days  = getMonthCalendarDays(year, month);
  const weeks = useMemo(() => {
    const arr: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) arr.push(days.slice(i, i + 7));
    return arr;
  }, [days]);

  // ── Rides by start-date lookup ─────────────────────────────────────────
  const ridesByDate = useMemo(() => {
    const map: Record<string, Ride[]> = {};
    rides.forEach((r) => {
      if (!map[r.startDate]) map[r.startDate] = [];
      map[r.startDate].push(r);
    });
    return map;
  }, [rides]);

  // ── Navigation ────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // ── DnD handlers ──────────────────────────────────────────────────────
  const handleDragStart = ({ active }: DragStartEvent) => {
    const ride = rides.find((r) => r.id === active.id);
    setActiveRide(ride ?? null);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveRide(null);
    if (!over || active.id === over.id) return;

    const rideId     = active.id as string;
    const newDateStr = over.id as string;
    const ride       = rides.find((r) => r.id === rideId);
    if (!ride) return;

    // Preserve duration, shift start and end
    const duration   = differenceInDays(parseISO(ride.endDate), parseISO(ride.startDate));
    const newStart   = newDateStr;
    const newEnd     = format(addDays(parseISO(newDateStr), duration), "yyyy-MM-dd");

    if (newStart === ride.startDate) return; // no change

    setRides((prev) =>
      prev.map((r) =>
        r.id === rideId ? { ...r, startDate: newStart, endDate: newEnd } : r
      )
    );
    setChanges((prev) => ({
      ...prev,
      [rideId]: { from: ride.startDate, to: newStart },
    }));
    // Phase 6: persist to Supabase
  };

  // ── Reset changes ─────────────────────────────────────────────────────
  const resetChanges = () => {
    setRides(initialRides);
    setChanges({});
  };

  // ── Save (Phase 6 placeholder) ────────────────────────────────────────
  const saveChanges = async () => {
    setSaveFeedback(true);
    await new Promise((res) => setTimeout(res, 800));
    // Phase 6: batch upsert to Supabase
    console.log("[Phase 5] Drag-drop changes (not persisted):", changes);
    setSaveFeedback(false);
    setChanges({});
  };

  const pendingCount = Object.keys(changes).length;

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Month nav */}
        <div className="flex items-center gap-1 bg-tvs-charcoal-900 border border-tvs-charcoal-800 rounded-lg overflow-hidden">
          <button onClick={prevMonth} className="p-2 hover:bg-tvs-charcoal-800 text-tvs-charcoal-400 hover:text-tvs-charcoal-50 transition-colors">
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-3 py-1.5 text-sm font-bold text-tvs-charcoal-50 min-w-[130px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 hover:bg-tvs-charcoal-800 text-tvs-charcoal-400 hover:text-tvs-charcoal-50 transition-colors">
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Pending changes indicator */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-300 text-xs font-semibold">
            <Info className="size-3.5 shrink-0" />
            {pendingCount} unsaved {pendingCount === 1 ? "change" : "changes"}
          </div>
        )}

        {/* Actions */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={resetChanges}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tvs-charcoal-700 text-tvs-charcoal-400 hover:text-tvs-charcoal-50 text-xs font-medium transition-colors"
            >
              <RotateCcw className="size-3.5" />
              Undo All
            </button>
            <button
              onClick={saveChanges}
              disabled={saveFeedback}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tvs-red-600 hover:bg-tvs-red-500 text-white text-xs font-semibold transition-colors disabled:opacity-60"
            >
              <Save className="size-3.5" />
              {saveFeedback ? "Saving…" : "Save Changes"}
            </button>
          </div>
        )}

        {/* Rides in month */}
        <span className={cn("text-xs text-tvs-charcoal-500", pendingCount === 0 && "ml-auto")}>
          {rides.filter((r) =>
            r.startDate.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)
          ).length}{" "}
          rides this month
        </span>
      </div>

      {/* ── Phase note ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tvs-charcoal-900/60 border border-tvs-charcoal-800/40 text-xs text-tvs-charcoal-500">
        <Info className="size-3.5 text-tvs-charcoal-600 shrink-0" />
        Drag ride chips to reschedule - duration is preserved. Changes shown locally until saved (Phase 6 persists to Supabase).
      </div>

      {/* ── DnD calendar ── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-xl border border-tvs-charcoal-800/50 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-tvs-charcoal-800/50">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-bold text-tvs-charcoal-500 uppercase tracking-wide bg-tvs-charcoal-900/50">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day) => {
                const dateStr       = format(day, "yyyy-MM-dd");
                const isCurrentMo   = day.getMonth() === month;
                return (
                  <DroppableCell
                    key={dateStr}
                    dateStr={dateStr}
                    dayNum={day.getDate()}
                    isCurrentMonth={isCurrentMo}
                    rides={isCurrentMo ? (ridesByDate[dateStr] ?? []) : []}
                    activeRideId={activeRide?.id ?? null}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Floating chip while dragging */}
        <DragOverlay>
          {activeRide && <DragOverlayChip ride={activeRide} />}
        </DragOverlay>
      </DndContext>

      {/* ── Change log ── */}
      {pendingCount > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-bold text-tvs-charcoal-500 uppercase tracking-wider">
            Pending Changes
          </p>
          {Object.entries(changes).map(([id, { from, to }]) => {
            const ride = rides.find((r) => r.id === id);
            return (
              <div key={id} className="flex items-center gap-2 text-xs text-tvs-charcoal-400 bg-tvs-charcoal-900/60 border border-tvs-charcoal-800/40 rounded-lg px-3 py-2">
                <span className="font-medium text-tvs-charcoal-200 truncate">{ride?.title ?? id}</span>
                <span className="text-tvs-charcoal-600">·</span>
                <span className="text-tvs-red-400 line-through">{from}</span>
                <span className="text-tvs-charcoal-600">→</span>
                <span className="text-emerald-400">{to}</span>
                <button
                  onClick={() => {
                    const original = initialRides.find((r) => r.id === id);
                    if (original) {
                      setRides((prev) => prev.map((r) => (r.id === id ? original : r)));
                      setChanges((prev) => { const e = { ...prev }; delete e[id]; return e; });
                    }
                  }}
                  className="ml-auto text-tvs-charcoal-600 hover:text-tvs-red-400 transition-colors"
                  title="Undo this change"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
