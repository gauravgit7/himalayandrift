// Redirect to the canonical print page, which lives outside the public layout
// so the Navbar does not overlap the print/download button.
import { redirect } from "next/navigation";

export default async function LegacyMemberCardPage({
  params,
}: {
  params: Promise<{ accessCode: string }>;
}) {
  const { accessCode } = await params;
  redirect(`/card/${accessCode}`);
}
