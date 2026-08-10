import type { Metadata }  from "next";
import { getMemberCards, getCardSettings, getBrandLogos, getAllProfiles } from "@/lib/supabase/queries";
import { MembersAdmin }              from "@/features/admin/MembersAdmin";
import { UserRegistrationsAdmin }    from "@/features/admin/UserRegistrationsAdmin";

export const metadata: Metadata = { title: "Members | TVS Nepal Admin" };

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminMembersPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "registrations" ? "registrations" : "cards";

  const [cards, settings, brandLogos, profiles] = await Promise.all([
    getMemberCards(),
    getCardSettings(),
    getBrandLogos(),
    getAllProfiles(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-tvs-charcoal-50">Members</h1>
        <p className="text-sm text-tvs-charcoal-400 mt-0.5">
          Manage member registrations and ID card applications.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-tvs-charcoal-900 rounded-xl p-1 w-fit">
        <a
          href="/admin/members?tab=cards"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "cards"
              ? "bg-tvs-red-600 text-white"
              : "text-tvs-charcoal-400 hover:text-tvs-charcoal-200"
          }`}
        >
          ID Card Applications
          {cards.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-tvs-charcoal-800 text-tvs-charcoal-400">
              {cards.filter((c) => c.status === "pending").length}
            </span>
          )}
        </a>
        <a
          href="/admin/members?tab=registrations"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "registrations"
              ? "bg-tvs-red-600 text-white"
              : "text-tvs-charcoal-400 hover:text-tvs-charcoal-200"
          }`}
        >
          Member Registrations
          {profiles.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-tvs-charcoal-800 text-tvs-charcoal-400">
              {profiles.filter((p) => p.memberStatus === "pending").length}
            </span>
          )}
        </a>
      </div>

      {activeTab === "cards" ? (
        <MembersAdmin initialCards={cards} settings={settings} brandLogos={brandLogos} />
      ) : (
        <UserRegistrationsAdmin initialMembers={profiles} />
      )}
    </div>
  );
}
