/*
  Runs during `npm run build` (on Vercel). Copies the PUBLIC Supabase
  values from Vercel's environment variables into public/assets/js/env.js
  so the browser can read them. Works with the names Vercel's Supabase
  integration creates, or ones you add by hand.

  It refuses to write a secret / service-role key — that key must never
  reach a browser.
*/
import { writeFileSync } from 'node:fs';

const pick = (...names) => names.map((n) => process.env[n]).find((v) => v && v.trim());

const url = pick('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL');
const key = pick(
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY',
);

function isSecret(k) {
  if (k.startsWith('sb_secret_')) return true;
  try {
    const payload = JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString());
    return payload.role === 'service_role';
  } catch { return false; }
}

if (!url || !key) {
  console.log('[write-env] No Supabase env vars found — keeping env.js as is (preview mode unless config.js has keys).');
  process.exit(0);
}
if (isSecret(key)) {
  console.error('[write-env] STOP: that key is a secret/service-role key. Use the anon or publishable key.');
  process.exit(1);
}

writeFileSync('public/assets/js/env.js',
  `// Generated at build time by scripts/write-env.mjs — do not edit.\nexport const ENV = ${JSON.stringify({ supabaseUrl: url.trim(), supabaseAnonKey: key.trim() })};\n`);
console.log(`[write-env] Wrote Supabase settings for ${new URL(url).host}`);
