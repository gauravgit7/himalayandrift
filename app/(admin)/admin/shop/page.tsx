import type { Metadata } from "next";
import {
  getAllProducts, getShopSettings, getShopOrders,
} from "@/lib/supabase/queries";
import { ShopAdmin }       from "@/features/admin/ShopAdmin";
import { ShopOrdersAdmin } from "@/features/admin/ShopOrdersAdmin";

export const metadata: Metadata = { title: "Shop | Admin" };

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function AdminShopPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "orders" ? "orders" : "products";

  const [products, settings, orders] = await Promise.all([
    getAllProducts(), getShopSettings(), getShopOrders(),
  ]);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-hd-ink-50">Shop</h1>
        <p className="text-sm text-hd-ink-400 mt-0.5">
          Merch, stock and the orders waiting on you.
        </p>
      </div>

      <div className="flex items-center gap-1 bg-hd-ink-900 rounded-xl p-1 w-fit">
        <a
          href="/admin/shop?tab=products"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "products"
              ? "bg-hd-ember-600 text-white"
              : "text-hd-ink-400 hover:text-hd-ink-200"
          }`}
        >
          Products
          {products.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-hd-ink-800 text-hd-ink-400">
              {products.length}
            </span>
          )}
        </a>
        <a
          href="/admin/shop?tab=orders"
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "orders"
              ? "bg-hd-ember-600 text-white"
              : "text-hd-ink-400 hover:text-hd-ink-200"
          }`}
        >
          Orders
          {pendingOrders > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-900/40 text-amber-400">
              {pendingOrders}
            </span>
          )}
        </a>
      </div>

      {activeTab === "products" ? (
        <ShopAdmin initialProducts={products} initialSettings={settings} />
      ) : (
        <ShopOrdersAdmin initialOrders={orders} />
      )}
    </div>
  );
}
