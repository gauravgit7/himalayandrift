// =============================================================================
// Ride detail — loading skeleton
//
// Without a loading.tsx, App Router navigation holds the OLD page on screen
// until the entire RSC payload for the new one is ready. Tapping a ride from
// /rides looked like nothing had happened, then the page jumped — which reads
// as "slow" regardless of how long the fetch actually took.
//
// This gives the tap an immediate answer. Mirrors the real layout closely
// enough that the arriving page settles into it rather than replacing it.
// =============================================================================

export default function RideDetailLoading() {
  return (
    <div className="min-h-dvh pb-20 animate-pulse">

      {/* Hero */}
      <section className="dark-surface relative bg-gradient-to-b from-hd-ember-950 via-hd-ink-950 to-hd-ink-950 pt-24 pb-10 px-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-3 w-28 rounded bg-hd-ink-800" />
          <div className="flex gap-2">
            <div className="h-5 w-20 rounded-full bg-hd-ink-800" />
            <div className="h-5 w-24 rounded-full bg-hd-ink-800" />
          </div>
          <div className="h-11 w-3/4 max-w-xl rounded bg-hd-ink-800" />
          <div className="flex flex-wrap gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-28 rounded bg-hd-ink-800/70" />
            ))}
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-10 w-40 rounded-lg bg-hd-ink-800" />
            <div className="h-10 w-28 rounded-lg bg-hd-ink-800/60" />
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="grid lg:grid-cols-[1fr_340px] gap-8">

          {/* Left column */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800" />
              ))}
            </div>
            <div className="h-40 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800" />
            <div className="h-64 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800" />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="h-72 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800" />
            <div className="h-44 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800" />
            <div className="h-56 rounded-xl bg-hd-ink-900/60 border border-hd-ink-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
