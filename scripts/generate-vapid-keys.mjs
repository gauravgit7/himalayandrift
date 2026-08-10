// =============================================================================
// VAPID key generator for Web Push
// Run once: node scripts/generate-vapid-keys.mjs
// Copy the output into your .env.local file
// =============================================================================

import webPush from "web-push";

const keys = webPush.generateVAPIDKeys();

console.log("\n✅  VAPID keys generated — add these to .env.local:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:admin@tvsnepal.com`);
console.log("\n⚠️   Never commit these to git. Add to .gitignore if not already.\n");
