import type { MetadataRoute } from "next";
import { createClient }       from "@/lib/supabase/server";

// Revalidate the manifest every hour so name/icon changes propagate quickly
export const revalidate = 3600;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Fetch PWA identity from Supabase (falls back to defaults if not set)
  let appName   = "TVS Nepal Ride Operations";
  let shortName = "TVS Nepal";
  let iconUrl: string | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pwa_settings")
      .select("app_name, short_name, icon_url")
      .eq("id", 1)
      .single();

    if (data) {
      appName   = data.app_name   ?? appName;
      shortName = data.short_name ?? shortName;
      iconUrl   = data.icon_url   ?? null;
    }
  } catch {
    // Supabase unavailable — use defaults silently
  }

  // Icon list: prefer uploaded icon, fall back to static generated files
  const icons: MetadataRoute.Manifest["icons"] = iconUrl
    ? [
        { src: iconUrl, sizes: "192x192", type: "image/png", purpose: "any"      },
        { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "any"      },
        { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ]
    : [
        { src: "/icons/icon-192.png",     sizes: "192x192", type: "image/png", purpose: "any"      },
        { src: "/icons/icon-512.png",     sizes: "512x512", type: "image/png", purpose: "any"      },
        { src: "/icons/icon-maskable.png",sizes: "512x512", type: "image/png", purpose: "maskable" },
      ];

  return {
    name:             appName,
    short_name:       shortName,
    description:      "Annual ride planning and operations platform for AOG & CULT communities",
    start_url:        "/home",
    display:          "standalone",
    background_color: "#0a0a0b",
    theme_color:      "#dc2626",
    orientation:      "portrait-primary",
    categories:       ["sports", "lifestyle"],
    icons,
    shortcuts: [
      {
        name:  "Ride Calendar",
        url:   "/calendar",
        icons: [{ src: iconUrl ?? "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name:  "Our Marshals",
        url:   "/marshals",
        icons: [{ src: iconUrl ?? "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
