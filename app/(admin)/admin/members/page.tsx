import type { Metadata }  from "next";
import {
  getMemberCards, getCardSettings, getBrandLogos, getAllProfiles,
  getMembershipTiers, getMembershipSettings,
} from "@/lib/supabase/queries";
import { MembersAdmin }              from "@/features/admin/MembersAdmin";
import { UserRegistrationsAdmin }    from "@/features/admin/UserRegistrationsAdmin";
import { TiersAdmin }                from "@/features/admin/TiersAdmin";

export const metadata: Metadata = { title: "Members | Admin" };

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminMembersPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "registrations" ? "registrations"
    : tab === "tiers"       ? "tiers"
    : "cards";

  const [cards, settings, brandLogos, profiles, tiers, membership] = await Promise.all([
    getMemberCards(),
    getCardSettings(),
    getBrandLogos(),
    getAllProfiles(),
    getMembershipTiers(),
    getMembershipSettings(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Members</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          Manage member registrations and ID card applications.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-hd-ink-900 rounded-xl p-1 w-fit">
        <a
          href="/admin/members?tab=cards"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "cards"
              ? "bg-hd-ember-600 text-white"
              : "text-hd-ink-400 hover:text-hd-ink-200"
          }`}
        >
          ID Card Applications
          {cards.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-hd-ink-800 text-hd-ink-400">
              {cards.filter((c) => c.status === "pending").length}
            </span>
          )}
        </a>
        <a
          href="/admin/members?tab=registrations"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "registrations"
              ? "bg-hd-ember-600 text-white"
              : "text-hd-ink-400 hover:text-hd-ink-200"
          }`}
        >
          Member Registrations
          {profiles.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-hd-ink-800 text-hd-ink-400">
              {profiles.filter((p) => p.memberStatus === "pending").length}
            </span>
          )}
        </a>
        <a
          href="/admin/members?tab=tiers"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "tiers"
              ? "bg-hd-ember-600 text-white"
              : "text-hd-ink-400 hover:text-hd-ink-200"
          }`}
        >
          Tiers &amp; Points
        </a>
      </div>

      {activeTab === "cards" ? (
        <MembersAdmin initialCards={cards} settings={settings} brandLogos={brandLogos} />
      ) : activeTab === "tiers" ? (
        <TiersAdmin initialTiers={tiers} initialSettings={membership} />
      ) : (
        <UserRegistrationsAdmin
          initialMembers={profiles}
          tiers={tiers}
          tiersEnabled={membership.tiersEnabled}
        />
      )}
    </div>
  );
}
