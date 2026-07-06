import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return env;
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const email = "crm@genuadigital.com";
const password = "GenuaCRM2026";

if (!url || !serviceKey) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY eksik. Supabase Dashboard → Settings → API → service_role key'i .env.local dosyasına ekleyin."
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await admin.auth.admin.listUsers();
const user = existing?.users?.find((u) => u.email === email);

if (user) {
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    email_confirm: true,
    password,
  });
  if (error) {
    console.error("Kullanıcı güncellenemedi:", error.message);
    process.exit(1);
  }
  console.log("OK: Kullanıcı onaylandı:", email);
} else {
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Kullanıcı oluşturulamadı:", error.message);
    process.exit(1);
  }
  console.log("OK: Kullanıcı oluşturuldu ve onaylandı:", email);
}

const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error: signInError } = await anon.auth.signInWithPassword({ email, password });
if (signInError) {
  console.error("Giriş testi başarısız:", signInError.message);
  process.exit(1);
}

console.log("OK: Giriş testi başarılı");
console.log("");
console.log("Panel giriş bilgileri:");
console.log("  E-posta:", email);
console.log("  Şifre:", password);
console.log("  URL: http://localhost:3000/login");
