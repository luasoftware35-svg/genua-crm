/**
 * Supabase Auth URL yapılandırması (Site URL + redirect listesi).
 * Gerekli: SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens)
 *
 * Kullanım:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/configure-auth-urls.mjs
 */

const PROJECT_REF = "lzgeijdlqadtryfwthqr";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://genua-crm.vercel.app";
const REDIRECT_URLS = [
  `${SITE_URL}/auth/callback`,
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
];

const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN eksik.");
  console.error("");
  console.error("Manuel ayar:");
  console.error(`  https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration`);
  console.error(`  Site URL: ${SITE_URL}`);
  console.error("  Redirect URLs:");
  REDIRECT_URLS.forEach((u) => console.error(`    - ${u}`));
  process.exit(1);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    site_url: SITE_URL,
    uri_allow_list: REDIRECT_URLS.join("\n"),
  }),
});

const body = await res.text();
if (!res.ok) {
  console.error("Auth URL güncellenemedi:", res.status, body);
  process.exit(1);
}

console.log("OK: Supabase Auth URL yapılandırıldı");
console.log("  Site URL:", SITE_URL);
REDIRECT_URLS.forEach((u) => console.log("  Redirect:", u));
