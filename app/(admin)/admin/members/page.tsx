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
  // The register is the default now. Approving a member issues their card, so
  // the walk-in applications tab is the exception it always should have been:
  // paper that has not yet found a person.
  const activeTab = tab === "applications" ? "applications"
    : tab === "tiers"                      ? "tiers"
    : "register";

  const [cards, settings, brandLogos, profiles, tiers, membership] = await Promise.all([
    getMemberCards(),
    getCardSettings(),
    getBrandLogos(),
    getAllProfiles(),
    getMembershipTiers(),
    getMembershipSettings(),
  ]);

  const walkIns   = cards.filter((c) => !c.userId);
  const uncarded  = profiles.filter((p) =>
    p.memberStatus === "approved" &&
    !cards.some((c) => c.userId === p.id && c.status === "approved")).length;

  const tabs: { key: string; href: string; label: string; badge?: number }[] = [
    { key: "register",     href: "/admin/members",                    label: "Register",       badge: profiles.filter((p) => p.memberStatus === "pending").length },
    { key: "applications", href: "/admin/members?tab=applications",   label: "Card applications", badge: walkIns.filter((c) => c.status === "pending").length },
    { key: "tiers",        href: "/admin/members?tab=tiers",          label: "Tiers & Points" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Members</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          Approving a member issues their card. There is one decision here, not two.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-hd-ink-900 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={t.href}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.key
                ? "bg-hd-ember-600 text-white"
                : "text-hd-ink-400 hover:text-hd-ink-200"
            }`}
          >
            {t.label}
            {!!t.badge && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-hd-ink-800 text-hd-ink-400">
                {t.badge}
              </span>
            )}
          </a>
        ))}
      </div>

      {activeTab === "applications" ? (
        <MembersAdmin initialCards={cards} settings={settings} brandLogos={brandLogos} />
      ) : activeTab === "tiers" ? (
        <TiersAdmin initialTiers={tiers} initialSettings={membership} />
      ) : (
        <>
          {uncarded > 0 && (
            <p className="text-xs text-hd-ink-400 px-3 py-2 rounded-lg bg-hd-ink-900 border border-hd-ink-800 w-fit">
              {uncarded} approved {uncarded === 1 ? "member has" : "members have"} no card
              — mostly people approved before the queues were merged. Filter by
              <span className="text-hd-ink-200 font-semibold"> No card</span> to work through them.
            </p>
          )}
          <UserRegistrationsAdmin
            initialMembers={profiles}
            initialCards={cards}
            tiers={tiers}
            tiersEnabled={membership.tiersEnabled}
          />
        </>
      )}
    </div>
  );
}
