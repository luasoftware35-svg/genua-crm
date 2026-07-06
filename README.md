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
| `SUPABASE_SERVICE_ROLE_KEY` | Sadece seed/bootstrap scriptleri (git'e koyma) |

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
```

## Vercel deploy

1. GitHub repo'yu Vercel'e bağla
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

Redirect URL: Supabase Auth → `https://your-domain.vercel.app/auth/callback`

## Sonraki adım

- Titan Mail entegrasyonu (toplu gerçek mail gönderimi)
