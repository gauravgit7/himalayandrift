// =============================================================================
// Admin Settings — PWA identity + push notifications
// =============================================================================

import type { Metadata }              from "next";
import { createClient }               from "@/lib/supabase/server";
import { PwaSettingsAdmin }           from "@/features/admin/PwaSettingsAdmin";
import { PushNotificationsAdmin }     from "@/features/admin/PushNotificationsAdmin";
import { CardSettingsAdmin }          from "@/features/admin/CardSettingsAdmin";
import { PaymentSettingsAdmin }       from "@/features/admin/PaymentSettingsAdmin";
import { MusicAdmin }                from "@/features/admin/MusicAdmin";
import { getCardSettings, getPaymentSettings, getAnthemSettings,
         getAllAnthemTracks } from "@/lib/supabase/queries";
import { APP_META }                   from "@/lib/constants";

export const metadata: Metadata = { title: "Settings | Admin" };

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getPwaSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pwa_settings")
    .select("app_name, short_name, icon_url")
    .eq("id", 1)
    .single();

  return {
    appName:   data?.app_name   ?? APP_META.name,
    shortName: data?.short_name ?? APP_META.shortName,
    iconUrl:   data?.icon_url   ?? null,
  };
}

async function getPushData() {
  const supabase = await createClient();

  const [settingsRes, countRes] = await Promise.all([
    supabase
      .from("push_settings")
      .select("enabled, prompt_style, prompt_delay_secs, prompt_page")
      .eq("id", 1)
      .single(),
    supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true }),
  ]);

  return {
    settings: {
      enabled:         settingsRes.data?.enabled          ?? true,
      promptStyle:     (settingsRes.data?.prompt_style    ?? "banner") as "banner" | "modal",
      promptDelaySecs: settingsRes.data?.prompt_delay_secs ?? 5,
      promptPage:      (settingsRes.data?.prompt_page     ?? "rides")  as "home" | "rides" | "any",
    },
    subscriberCount: countRes.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminSettingsPage() {
  const [pwa, push, cardSettings, paymentSettings, anthem, tracks] = await Promise.all([
    getPwaSettings(), getPushData(), getCardSettings(), getPaymentSettings(),
    getAnthemSettings(), getAllAnthemTracks(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-10 max-w-3xl">

      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Settings</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          App identity, push notifications, membership cards, ride payments and
          the community anthem
        </p>
      </div>

      {/* ── PWA Identity ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="block w-3 h-px bg-hd-ember-600 rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
            App Identity
          </h2>
        </div>
        <PwaSettingsAdmin initial={pwa} />
      </section>

      {/* ── Push Notifications ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="block w-3 h-px bg-hd-ink-500 rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-hd-ink-400">
            Push Notifications
          </h2>
        </div>
        <PushNotificationsAdmin
          initialSettings={push.settings}
          subscriberCount={push.subscriberCount}
        />
      </section>

      {/* ── Membership Card ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="block w-3 h-px bg-hd-ember-600 rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
            Membership Card
          </h2>
        </div>
        <CardSettingsAdmin initial={cardSettings} />
      </section>

      {/* ── Ride Payments ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="block w-3 h-px bg-hd-ember-600 rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
            Ride Payments
          </h2>
        </div>
        <PaymentSettingsAdmin initialSettings={paymentSettings} />
      </section>

      {/* ── Anthem ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="block w-3 h-px bg-hd-ember-600 rounded-full" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-hd-ember-400">
            Anthem
          </h2>
        </div>
        <MusicAdmin initialTracks={tracks} initialEnabled={anthem.isEnabled} />
      </section>

    </div>
  );
}
