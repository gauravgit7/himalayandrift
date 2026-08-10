import type { Metadata }    from "next";
import { getChapters }      from "@/lib/supabase/queries";
import { ChapterEditor }    from "@/features/admin/ChapterEditor";

export const metadata: Metadata = { title: "Chapters | TVS Nepal Admin" };

export default async function AdminChaptersPage() {
  const chapters = await getChapters();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-tvs-charcoal-50">Chapters</h1>
        <p className="text-sm text-tvs-charcoal-400 mt-0.5">
          {chapters.length} chapters — edit details, cover image, and region info
        </p>
      </div>
      <ChapterEditor chapters={chapters} />
    </div>
  );
}
