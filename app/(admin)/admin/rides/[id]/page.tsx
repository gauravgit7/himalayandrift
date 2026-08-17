// =============================================================================
// Admin - Edit Ride - Phase 6 · Supabase data
// Dynamic route: /admin/rides/[id]
// =============================================================================

import type { Metadata }         from "next";
import Link                      from "next/link";
import { notFound }              from "next/navigation";
import { ArrowLeft }             from "lucide-react";
import { ROUTES }                from "@/lib/constants";
import { getRide, getMarshals, getSeries, getPaymentSettings } from "@/lib/supabase/queries";
import { RideForm }              from "@/features/admin/RideForm";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const ride   = await getRide(id);
  return { title: ride ? `Edit: ${ride.title} | Admin` : "Edit Ride | Admin" };
}

export default async function EditRidePage({ params }: Props) {
  const { id } = await params;

  const [ride, marshals, series, payment] = await Promise.all([
    getRide(id), getMarshals(), getSeries(), getPaymentSettings(),
  ]);
  if (!ride) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.adminRides}
          className="flex items-center gap-1.5 text-sm text-hd-ink-400 hover:text-hd-ink-100 transition-colors"
        >
          <ArrowLeft className="size-4" />
          All Rides
        </Link>
        <span className="text-hd-ink-700">/</span>
        <span className="text-sm text-hd-ink-200 font-medium truncate max-w-[200px]">
          {ride.title}
        </span>
      </div>
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Edit Ride</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">{ride.slug}</p>
      </div>
      <RideForm mode="edit" initialData={ride} rideId={ride.id} marshals={marshals} series={series}
        defaultTiers={payment.defaultTiers} />
    </div>
  );
}
