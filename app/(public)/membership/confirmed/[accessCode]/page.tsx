// =============================================================================
// /membership/confirmed/[accessCode] — Save Your Code screen
// This is the ONLY time the access code is shown. The user must save it.
// =============================================================================

import type { Metadata }  from "next";
import { ConfirmedClient } from "@/features/membership/ConfirmedClient";

export const metadata: Metadata = { title: "Application Submitted | Himalayan Drift" };

export default async function MembershipConfirmedPage({
  params,
}: {
  params: Promise<{ accessCode: string }>;
}) {
  const { accessCode } = await params;
  return <ConfirmedClient accessCode={accessCode} />;
}
