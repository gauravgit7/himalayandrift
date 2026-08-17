// =============================================================================
// /shop/[slug] — one product
// =============================================================================

import type { Metadata } from "next";
import { notFound }      from "next/navigation";
import { getProduct, getShopSettings } from "@/lib/supabase/queries";
import { ProductDetail } from "@/features/shop/ProductDetail";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Stock is on this page, so it must not be served from a cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Not Found" };
  return {
    title:       product.name,
    description: product.shortDescription ?? product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const [settings, product] = await Promise.all([getShopSettings(), getProduct(slug)]);

  // A draft product has a URL but is not published; treat it as absent rather
  // than showing something nobody can buy.
  if (!settings.isEnabled || !product || !product.isActive) notFound();

  return (
    <main className="min-h-dvh py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <ProductDetail product={product} />
    </main>
  );
}
