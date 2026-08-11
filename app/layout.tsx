// =============================================================================
// Root Layout - Himalayan Drift
// =============================================================================

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { APP_META }      from "@/lib/constants";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
