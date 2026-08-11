// =============================================================================
// PWA icon generator — Himalayan Drift
// Usage: node scripts/generate-pwa-icons.mjs <path-to-logo>
// Example: node scripts/generate-pwa-icons.mjs public/brand/logo-primary.jpeg
//
// Outputs three files in public/icons/:
//   icon-192.png      — 192×192  (Android home screen, Chrome install dialog)
//   icon-512.png      — 512×512  (splash screen, high-DPI)
//   icon-maskable.png — 512×512  (Android adaptive icons, ink bg + safe-zone padding)
// =============================================================================

import sharp  from "sharp";
import { mkdirSync } from "fs";

const logoPath = process.argv[2];

if (!logoPath) {
  console.error('Usage: node scripts/generate-pwa-icons.mjs "<path-to-logo>"');
  process.exit(1);
}

// Brand palette, sampled from public/brand/logo-primary.jpeg
const INK    = { r: 10,  g: 10,  b: 11,  alpha: 1 }; // near-black badge field
const CLEAR  = { r: 0,   g: 0,   b: 0,   alpha: 0 };

mkdirSync("public/icons", { recursive: true });

/**
 * The supplied artwork is a badge on a solid dark field, so it already carries
 * its own margin. Trim that away first, otherwise the script's padding stacks
 * on top of it and the mark ends up floating small inside the icon.
 */
async function trimmedLogo() {
  return sharp(logoPath)
    .trim({ threshold: 20 })
    .png()
    .toBuffer();
}

async function generate() {
  console.log(`\nUsing logo: ${logoPath}\n`);

  const source = await trimmedLogo();

  // ── icon-192 & icon-512: logo on dark background ──────────────────────────
  for (const size of [192, 512]) {
    const padding   = Math.round(size * 0.06);
    const innerSize = size - padding * 2;

    await sharp(source)
      .resize(innerSize, innerSize, {
        fit:        "contain",
        background: CLEAR,
      })
      .png()
      .toBuffer()
      .then((logoBuffer) =>
        sharp({
          create: { width: size, height: size, channels: 4, background: INK },
        })
          .composite([{ input: logoBuffer, gravity: "center" }])
          .png()
          .toFile(`public/icons/icon-${size}.png`)
      );

    console.log(`✓  public/icons/icon-${size}.png`);
  }

  // ── icon-maskable: logo on the ink field with 15% safe-zone padding ───────
  // Android clips adaptive icons to a circle/squircle.
  // Everything within the inner 80% is guaranteed visible (the "safe zone").
  // We pad the logo to 70% of the canvas so it sits well inside the safe zone.
  const maskSize    = 512;
  const safeZone    = Math.round(maskSize * 0.70);

  await sharp(source)
    .resize(safeZone, safeZone, {
      fit:        "contain",
      background: CLEAR,
    })
    .png()
    .toBuffer()
    .then((logoBuffer) =>
      sharp({
        create: { width: maskSize, height: maskSize, channels: 4, background: INK },
      })
        .composite([{ input: logoBuffer, gravity: "center" }])
        .png()
        .toFile("public/icons/icon-maskable.png")
    );

  console.log("✓  public/icons/icon-maskable.png");
  console.log("\nDone! Restart the dev server to see the updated icons.\n");
}

generate().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
