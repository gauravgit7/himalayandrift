// Minimal layout for /signin and /signup — no Navbar or Footer.
import Link from "next/link";
import { ROUTES } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-hd-ink-950 flex flex-col">
      <header className="px-6 py-5">
        <Link
          href={ROUTES.home}
          className="inline-flex items-center gap-2 group"
        >
          <div className="size-8 rounded-lg bg-hd-ember-600 flex items-center justify-center shadow-glow-ember group-hover:bg-hd-ember-500 transition-colors">
            <span className="text-white font-black text-sm leading-none">T</span>
          </div>
          <span className="text-white font-bold text-sm">Himalayan Drift</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>
    </div>
  );
}
