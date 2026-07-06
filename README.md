# Genua CRM

Genua Digital Media için satış takip (mini-CRM) uygulaması.

## Teknoloji

- Next.js 14 (App Router)
- Supabase (Postgres + Auth) — sonraki adım
- Tailwind CSS + shadcn/ui
- TypeScript, Recharts, dnd-kit, papaparse

## Kurulum

```bash
npm install
npm run dev
```

http://localhost:3000 → `/login` yönlendirir. Herhangi bir e-posta/şifre ile giriş yapabilirsiniz.

## Özellikler

| Sayfa | Özellikler |
|-------|-----------|
| `/dashboard` | KPI kartları, kaynak/pipeline grafikleri, bugün takipler |
| `/companies` | Arama, filtreler, **CSV import**, **firma ekle**, tıklanabilir tablo |
| `/companies/[id]` | Firma düzenleme, denetim bulguları, kişi CRUD, aktivite ekleme, deal yönetimi |
| `/pipeline` | Kanban + **sürükle-bırak** aşama değiştirme |
| `/follow-ups` | Bugün/bu hafta takipler, +1/+7 gün erteleme, hızlı aşama değiştirme |
| `/login` | Mock auth (cookie tabanlı, middleware korumalı) |

## CSV Import

1. `/companies` → **CSV İçe Aktar**
2. Sütun eşleştirmesini kontrol et (firma adı zorunlu)
3. Önizle → İçe aktar
4. Her firma için otomatik `yeni` aşamasında deal oluşturulur

Desteklenen sütun alias'ları: firma, website, email, telefon, kaynak, sektör vb.

## Supabase (sonraki adım)

Migration: `supabase/migrations/20250706120000_initial_schema.sql`

`.env.local.example` dosyasını kopyalayıp URL + anon key girin.

## Sonraki adımlar

- Supabase bağlantısı (mock store → gerçek DB)
- Otomatik site analizi (import sonrası)
- Titan Mail entegrasyonu (otomatik mail gönderimi)
