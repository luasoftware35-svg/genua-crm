# Genua Digital CRM

Hedef müşteri (OSB/BOSB/SOSB) takip paneli — [genuadigital.com](https://www.genuadigital.com)

## Teknoloji

- Next.js 14 (App Router)
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS + shadcn/ui
- TypeScript

## Kurulum

```bash
npm install
cp .env.local.example .env.local
# .env.local içine Supabase URL + anon key (+ opsiyonel service role)
npm run bootstrap:auth   # ilk CRM kullanıcısı
npm run dev
```

http://localhost:3000 → `/login`

## Ortam değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Bootstrap/seed scriptleri (Vercel'de opsiyonel) |
| `NEXT_PUBLIC_SITE_URL` | Canlı site adresi (varsayılan: `https://genua-crm.vercel.app`) |
| `NEXT_PUBLIC_ALLOW_SIGNUP` | `true` ise login sayfasında hesap oluşturma açılır |
| `TITAN_SMTP_USER` | Titan kurumsal e-posta adresi |
| `TITAN_SMTP_PASS` | Titan mailbox şifresi |
| `TITAN_MAIL_FROM` | Gönderen adresi (genelde SMTP user ile aynı) |
| `TITAN_MAIL_FROM_NAME` | Gönderen adı (varsayılan: Genua Digital) |
| `TITAN_SMTP_HOST` | `smtp.titan.email` (varsayılan) |
| `TITAN_SMTP_PORT` | `587` veya `465` |

## Canlı site

**https://genua-crm.vercel.app**

Giriş: `crm@genuadigital.com` (şifre bootstrap script ile ayarlanır)

## Özellikler

| Sayfa | Özellikler |
|-------|-----------|
| `/companies` | PDF önizlemeli import, filtreler, şehir sütunu, toplu seçim/silme/export |
| `/companies/[id]` | Firma düzenleme, denetim PDF (tek firma), otomatik site denetimi |
| `/cities` | Şehir bazlı firma grupları (Bursa, Sakarya, …) |
| `/pipeline` | Kanban sürükle-bırak |
| `/follow-ups` | Bugün / bu hafta takipler |
| `/dashboard` | KPI + grafikler |

## PDF tipleri

- **Firma listesi** (BOSB/SOSB tablo PDF) → Ana sayfa **PDF Yükle** + önizleme
- **Denetim raporu** (tek firma) → Firma detay sayfası **Denetim PDF**

OSB → şehir eşlemesi: BOSB=Bursa, SOSB=Sakarya, DOSB=Denizli

## Scriptler

```bash
npm run seed:pdf -- "/path/to/liste.pdf"
npm run bootstrap:auth
npm run test:titan-mail -- opsiyonel-alici@firma.com
```

## Titan Mail

Titan REST API sunmaz; **SMTP** ile gönderim yapılır (`nodemailer`).

1. Titan panelinde **Third-party email access** açın
2. **2FA kapalı** olmalı (SMTP için Titan kuralı)
3. Vercel'e env ekleyin: `TITAN_SMTP_USER`, `TITAN_SMTP_PASS`, `TITAN_MAIL_FROM`
4. Local test: `npm run test:titan-mail`

Panelden **Titan ile Gönder** → firma adı + denetim bulguları şablona işlenir → pipeline `Mail Atıldı` olur.

SMTP: `smtp.titan.email:587` (STARTTLS) veya `:465` (SSL)

## Vercel deploy

Proje: **genua-crm** — https://genua-crm.vercel.app

Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (opsiyonel)
- `NEXT_PUBLIC_SITE_URL` = `https://genua-crm.vercel.app`

Supabase Auth redirect:

```bash
# Dashboard'dan veya access token ile:
npm run configure:auth-urls
```

Redirect URL: `https://genua-crm.vercel.app/auth/callback`

Titan env'leri de Production/Preview'a ekleyin.

## Sonraki adım

- Mail şablonu özelleştirme (HTML, ek dosya)
