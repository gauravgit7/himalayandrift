import type { Metadata } from "next";
import { getAllRideRegistrations } from "@/lib/supabase/queries";
import { RegistrationsAdmin }      from "@/features/admin/RegistrationsAdmin";

export const metadata: Metadata = { title: "Registrations | Admin" };

export default async function AdminRegistrationsPage() {
  const registrations = await getAllRideRegistrations();
  const pending = registrations.filter((r) => r.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Ride Registrations</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          {pending > 0
            ? `${pending} waiting to be checked.`
            : "Sign-ups for every ride, with payment proof where there is a fee."}
        </p>
      </div>

      <RegistrationsAdmin initialRegistrations={registrations} />
    </div>
  );
}
