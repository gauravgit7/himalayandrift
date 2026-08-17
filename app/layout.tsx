// =============================================================================
// Root Layout - Himalayan Drift
// =============================================================================

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_META }      from "@/lib/constants";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AnthemProvider } from "@/features/anthem/AnthemProvider";
import { AnthemDock }     from "@/features/anthem/AnthemDock";
import { AnthemLyrics }   from "@/features/anthem/AnthemLyrics";
import { getAnthemSettings, getBrandLogos } from "@/lib/supabase/queries";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: {
    default: APP_META.name,
    template: `%s | ${APP_META.shortName}`,
  },
  description: APP_META.description,
  keywords: [
    "Himalayan Drift",
    "motorcycle Nepal",
    "ride calendar",
    "Himalayan riding",
    "adventure riding Nepal",
    "biking community",
  ],
  openGraph: {
    type: "website",
    siteName: APP_META.name,
    title: APP_META.name,
    description: APP_META.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  // ── PWA ────────────────────────────────────────────────────────────────────
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable:    true,
    statusBarStyle: "black-translucent",
    title:      APP_META.shortName,
    startupImage: [
      { url: "/icons/icon-512.png" },
    ],
  },
  icons: {
    // Without an `icon` entry — and with no app/favicon.ico or app/icon.png to
    // fall back on — the browser tab shows a blank sheet. The apple entries
    // below only ever reach iOS home screens.
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/icons/icon-192.png" }],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192" },
      { url: "/icons/icon-512.png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#080808" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  // cover: needed for env(safe-area-inset-*) to work in iOS PWA standalone
  // mode and to prevent the status bar from overlapping content.
  viewportFit: "cover",
};

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched here rather than in a page because the player has to outlive every
  // route change. Both queries are React-cache()d, so the public layout's own
  // call to getBrandLogos costs nothing extra.
  const [anthem, brandLogos] = await Promise.all([
    getAnthemSettings(),
    getBrandLogos(),
  ]);

  return (
    // suppressHydrationWarning: the inline script below may add "light" to the
    // class list before React hydrates, so the server/client class can differ.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          No-flash theme script - runs synchronously before first paint.
          Reads localStorage and applies "light" class immediately so the
          user never sees a dark flash when they have a light preference saved.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('hd-theme');if(t==='light'){document.documentElement.classList.add('light');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AnthemProvider anthem={anthem}>
            {children}
            {/* Both render nothing until the anthem is switched on and started,
                so every other page is untouched. */}
            <AnthemDock logoUrl={brandLogos.logoUrl} />
            <AnthemLyrics />
          </AnthemProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
