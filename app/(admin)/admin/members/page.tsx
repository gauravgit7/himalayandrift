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
  // Two tabs. There is no card queue any more: approving a member issues their
  // card, so a separate list of card applications would be a second place to
  // make one decision. What survives is the one case a register of accounts
  // cannot show - a walk-in application with no account behind it - and that
  // belongs under the register, not beside it.
  const activeTab = tab === "tiers" ? "tiers" : "register";

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
    { key: "register", href: "/admin/members",            label: "Register",
      badge: profiles.filter((p) => p.memberStatus === "pending").length },
    { key: "tiers",    href: "/admin/members?tab=tiers",  label: "Tiers & Points" },
  ];

  // Legacy paper. Once everyone joins through the one form there will be none
  // of these, and this whole block renders nothing.
  const orphans = walkIns.filter((c) => c.status !== "rejected" && c.status !== "revoked");

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

      {activeTab === "tiers" ? (
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

          {orphans.length > 0 && (
            <section className="pt-8 mt-8 border-t border-hd-ink-800 space-y-4">
              <div>
                <h2 className="text-lg font-black text-hd-ink-50">
                  Applications with no account
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] align-middle bg-hd-ink-800 text-hd-ink-400">
                    {orphans.length}
                  </span>
                </h2>
                <p className="text-sm text-hd-ink-400 mt-1 max-w-2xl">
                  Cards applied for before the join form existed, by people the
                  matcher could not confidently attach to an account. Link one
                  to its owner and it joins the register above; approve it as it
                  stands and it becomes a card with no login behind it.
                </p>
              </div>
              <MembersAdmin
                initialCards={cards}
                settings={settings}
                brandLogos={brandLogos}
                onlyUnlinked
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
