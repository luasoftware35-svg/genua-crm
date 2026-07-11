export type OsbTeklifEntry = {
  index: number;
  fileKey: string;
  name: string;
  city: string;
};

export const OSB_TEKLIF_ENTRIES: OsbTeklifEntry[] = [
  { index: 1, fileKey: "Adana", name: "Adana OSB", city: "Adana" },
  { index: 2, fileKey: "Adiyaman", name: "Adıyaman OSB", city: "Adıyaman" },
  { index: 3, fileKey: "Aliaga", name: "Aliağa OSB", city: "Aliağa" },
  { index: 4, fileKey: "Antalya", name: "Antalya OSB", city: "Antalya" },
  { index: 5, fileKey: "Balikesir", name: "Balıkesir OSB", city: "Balıkesir" },
  { index: 6, fileKey: "Baskent-Ankara", name: "Başkent Ankara OSB", city: "Ankara" },
  { index: 7, fileKey: "Bursa", name: "Bursa OSB", city: "Bursa" },
  { index: 8, fileKey: "Cerkezkoy", name: "Çerkezköy OSB", city: "Çerkezköy" },
  { index: 9, fileKey: "Corlu", name: "Çorlu OSB", city: "Çorlu" },
  { index: 10, fileKey: "Denizli", name: "Denizli OSB", city: "Denizli" },
  { index: 11, fileKey: "Dilovasi", name: "Dilovası OSB", city: "Dilovası" },
  { index: 12, fileKey: "Diyarbakir", name: "Diyarbakır OSB", city: "Diyarbakır" },
  { index: 13, fileKey: "Eskisehir", name: "Eskişehir OSB", city: "Eskişehir" },
  { index: 14, fileKey: "Gaziantep", name: "Gaziantep OSB", city: "Gaziantep" },
  { index: 15, fileKey: "Gebze", name: "Gebze OSB", city: "Gebze" },
  { index: 16, fileKey: "Ikitelli", name: "İkitelli OSB", city: "İstanbul" },
  { index: 17, fileKey: "Izmir-Ataturk", name: "İzmir Atatürk OSB", city: "İzmir" },
  { index: 18, fileKey: "Kahramanmaras", name: "Kahramanmaraş OSB", city: "Kahramanmaraş" },
  { index: 19, fileKey: "Kayseri", name: "Kayseri OSB", city: "Kayseri" },
  { index: 20, fileKey: "Kemalpasa", name: "Kemalpaşa OSB", city: "Kemalpaşa" },
  { index: 21, fileKey: "Konya", name: "Konya OSB", city: "Konya" },
  { index: 22, fileKey: "Malatya", name: "Malatya OSB", city: "Malatya" },
  { index: 23, fileKey: "Manisa", name: "Manisa OSB", city: "Manisa" },
  { index: 24, fileKey: "Ostim-Ankara", name: "Ostim Ankara OSB", city: "Ankara" },
  { index: 25, fileKey: "Sakarya", name: "Sakarya OSB", city: "Sakarya" },
  { index: 26, fileKey: "Samsun", name: "Samsun OSB", city: "Samsun" },
  { index: 27, fileKey: "Sanliurfa", name: "Şanlıurfa OSB", city: "Şanlıurfa" },
  { index: 28, fileKey: "Sincan-Ankara", name: "Sincan Ankara OSB", city: "Ankara" },
  { index: 29, fileKey: "Trabzon", name: "Trabzon OSB", city: "Trabzon" },
  { index: 30, fileKey: "Usak", name: "Uşak OSB", city: "Uşak" },
  { index: 31, fileKey: "Mersin", name: "Mersin OSB", city: "Mersin" },
  { index: 32, fileKey: "Hatay", name: "Hatay OSB", city: "Hatay" },
  { index: 33, fileKey: "Elazig", name: "Elazığ OSB", city: "Elazığ" },
  { index: 34, fileKey: "Erzurum", name: "Erzurum OSB", city: "Erzurum" },
  { index: 35, fileKey: "Sivas", name: "Sivas OSB", city: "Sivas" },
  { index: 36, fileKey: "Canakkale", name: "Çanakkale OSB", city: "Çanakkale" },
  { index: 37, fileKey: "Aydin", name: "Aydın OSB", city: "Aydın" },
  { index: 38, fileKey: "Isparta", name: "Isparta OSB", city: "Isparta" },
  { index: 39, fileKey: "Afyonkarahisar", name: "Afyonkarahisar OSB", city: "Afyonkarahisar" },
  { index: 40, fileKey: "Kutahya", name: "Kütahya OSB", city: "Kütahya" },
  { index: 41, fileKey: "Corum", name: "Çorum OSB", city: "Çorum" },
  { index: 42, fileKey: "Amasya", name: "Amasya OSB", city: "Amasya" },
  { index: 43, fileKey: "Tokat", name: "Tokat OSB", city: "Tokat" },
  { index: 44, fileKey: "Ordu", name: "Ordu OSB", city: "Ordu" },
  { index: 45, fileKey: "Giresun", name: "Giresun OSB", city: "Giresun" },
  { index: 46, fileKey: "Van", name: "Van OSB", city: "Van" },
  { index: 47, fileKey: "Mardin", name: "Mardin OSB", city: "Mardin" },
  { index: 48, fileKey: "Batman", name: "Batman OSB", city: "Batman" },
  { index: 49, fileKey: "Osmaniye", name: "Osmaniye OSB", city: "Osmaniye" },
  { index: 50, fileKey: "Karaman", name: "Karaman OSB", city: "Karaman" },
];

export const OSB_TEKLIF_MAIL_BODY = `Sayın Yetkili,

Genua Digital Media olarak, sanayi kuruluşlarına yönelik kurumsal web tasarım ve dijital dönüşüm hizmetleri sunan bir dijital ajansız. OSB bünyesinde faaliyet gösteren değerli üye firmalarınıza yönelik bir iş birliği önerisini değerlendirmenizi rica ederiz.

Günümüzde kurumsal dijital varlık, firmaların gerek yurt içi gerekse yurt dışı pazarlardaki güvenilirliğini ve rekabet gücünü doğrudan etkileyen bir unsur haline gelmiştir. Bu doğrultuda, Organize Sanayi Bölgesi üyesi firmalara özel olarak hazırladığımız, indirimli fiyatlandırma içeren web tasarım ve dijital dönüşüm paketlerimizi bilgilerinize sunmak isteriz. Söz konusu paketler; kurumsal web sitesi tasarımı, arama motoru görünürlüğü ve ihracatçı firmalar için çoklu dil desteği seçeneklerini kapsamaktadır.

Söz konusu teklifin, uygun görüldüğü takdirde OSB'nizin resmi duyuru veya bülten kanalları aracılığıyla üye firmalarınıza iletilmesini, ilgi duyan firmaların ise doğrudan tarafımızla iletişime geçebilmesini rica ederiz. Bu iş birliği, herhangi bir maliyet veya yükümlülük doğurmaksızın, üye firmalarınıza sunulan hizmet yelpazesine katma değer sağlayacaktır.

Detaylı teklif dosyamız ekte yer almaktadır. Konuyu değerlendirmeniz ve uygun gördüğünüz bir tarihte tarafımızla görüşme imkânı sağlamanız durumunda memnuniyet duyarız.`;

const OSB_TEKLIF_SUBJECTS: Record<string, string> = {
  "Adana OSB":
    "Adana OSB — Üye Firmalara Özel Kurumsal Web Tasarım ve Dijital Dönüşüm İş Birliği Teklifi",
  "Adıyaman OSB":
    "Adıyaman Organize Sanayi Bölgesi — Üye Sanayi Firmalarına Dijital Dönüşüm İş Birliği Önerisi",
  "Aliağa OSB":
    "Aliağa OSB — Üye Firmalara Yönelik Kurumsal Web Tasarım ve Dijital Görünürlük Teklifi",
  "Antalya OSB":
    "Antalya OSB — Üye Firmalara Özel Web Tasarım, SEO ve İhracat Odaklı Dijital Dönüşüm Teklifi",
  "Balıkesir OSB":
    "Balıkesir OSB (BALOSB) — Üye Firmalara Özel Kurumsal Dijital Dönüşüm İş Birliği Teklifi",
  "Başkent Ankara OSB":
    "Başkent OSB — Üye Sanayi Firmalarına Yönelik Kurumsal Web ve Dijital Dönüşüm İş Birliği Önerisi",
  "Bursa OSB":
    "Bursa Organize Sanayi Bölgesi — Üye Firmalara Özel Dijital Dönüşüm Paketi İş Birliği Teklifi",
  "Çerkezköy OSB":
    "Çerkezköy OSB — Üye Firmalara Özel Kurumsal Web Tasarım ve Dijital Dönüşüm Teklifi",
  "Çorlu OSB":
    "Çorlu 1. OSB — Sanayi Üyelerine Yönelik Kurumsal Web Tasarım İş Birliği Önerisi",
  "Denizli OSB":
    "Denizli OSB — Üye Firmalara Özel Web Tasarım ve Dijital Dönüşüm İş Birliği Teklifi",
  "Dilovası OSB":
    "Dilovası OSB — Üye Sanayi Firmalarına Kurumsal Dijital Dönüşüm İş Birliği Teklifi",
  "Diyarbakır OSB":
    "Diyarbakır OSB — Üye Firmalara Özel Kurumsal Web ve Dijital Dönüşüm Paketi Teklifi",
  "Eskişehir OSB":
    "Eskişehir OSB — Üye Firmalara Yönelik Web Tasarım ve Dijital Görünürlük İş Birliği Önerisi",
  "Gaziantep OSB":
    "Gaziantep OSB — Üye Sanayi Firmalarına Özel Dijital Dönüşüm ve Web Tasarım Teklifi",
  "Gebze OSB":
    "Gebze OSB — Üye Firmalara Özel Kurumsal Web Tasarım ve Dijital Dönüşüm İş Birliği Teklifi",
  "İkitelli OSB":
    "İkitelli OSB — Üye Firmalara Yönelik Kurumsal Dijital Dönüşüm ve Web Tasarım Teklifi",
  "İzmir Atatürk OSB":
    "İzmir Atatürk OSB — Üye Firmalara Özel Web Tasarım ve İhracat Odaklı Dijital Dönüşüm Teklifi",
  "Kahramanmaraş OSB":
    "Kahramanmaraş OSB — Üye Sanayi Firmalarına Kurumsal Dijital Dönüşüm İş Birliği Önerisi",
  "Kayseri OSB":
    "Kayseri OSB — Üye Firmalara Özel Kurumsal Web Tasarım ve Dijital Dönüşüm Teklifi",
  "Kemalpaşa OSB":
    "Kemalpaşa OSB (KOSBİ) — Üye Firmalara Yönelik Dijital Dönüşüm İş Birliği Teklifi",
  "Konya OSB":
    "Konya OSB — Üye Sanayi Firmalarına Özel Web Tasarım ve Dijital Dönüşüm Paketi Teklifi",
  "Malatya OSB":
    "Malatya OSB — Üye Firmalara Özel Kurumsal Web ve Dijital Dönüşüm İş Birliği Teklifi",
  "Manisa OSB":
    "Manisa OSB (MOSB) — Üye Firmalara Yönelik Kurumsal Dijital Dönüşüm İş Birliği Önerisi",
  "Ostim Ankara OSB":
    "OSTİM OSB — Üye Sanayi Firmalarına Özel Web Tasarım ve Dijital Dönüşüm Teklifi",
  "Sakarya OSB":
    "Sakarya 1. OSB — Üye Firmalara Özel Kurumsal Dijital Dönüşüm İş Birliği Teklifi",
  "Samsun OSB":
    "Samsun OSB — Üye Sanayi Firmalarına Yönelik Web Tasarım ve Dijital Dönüşüm Teklifi",
  "Şanlıurfa OSB":
    "Şanlıurfa OSB — Üye Firmalara Özel Kurumsal Web Tasarım İş Birliği Önerisi",
  "Sincan Ankara OSB":
    "ASO 1. OSB (Sincan) — Üye Firmalara Özel Dijital Dönüşüm ve Web Tasarım Teklifi",
  "Trabzon OSB":
    "Trabzon Arsin OSB — Üye Sanayi Firmalarına Kurumsal Dijital Dönüşüm İş Birliği Teklifi",
  "Uşak OSB":
    "Uşak OSB — Üye Firmalara Özel Web Tasarım ve Dijital Dönüşüm İş Birliği Teklifi",
  "Mersin OSB":
    "Mersin (Tarsus) OSB — Üye Firmalara Özel Kurumsal Web Tasarım ve Dijital Dönüşüm Teklifi",
  "Hatay OSB":
    "Hatay (Antakya) OSB — Üye Sanayi Firmalarına Dijital Dönüşüm İş Birliği Önerisi",
  "Elazığ OSB":
    "Elazığ OSB — Üye Firmalara Yönelik Kurumsal Web ve Dijital Dönüşüm Teklifi",
  "Erzurum OSB":
    "Erzurum 1. OSB — Üye Firmalara Özel Web Tasarım ve Dijital Görünürlük İş Birliği Teklifi",
  "Sivas OSB":
    "Sivas OSB — Üye Sanayi Firmalarına Kurumsal Dijital Dönüşüm İş Birliği Teklifi",
  "Çanakkale OSB":
    "Çanakkale OSB — Üye Firmalara Özel Kurumsal Web Tasarım İş Birliği Önerisi",
  "Aydın OSB":
    "Aydın OSB — Üye Firmalara Özel Dijital Dönüşüm ve Web Tasarım Paketi Teklifi",
  "Isparta OSB":
    "Isparta (Süleyman Demirel) OSB — Üye Firmalara Yönelik Kurumsal Dijital Dönüşüm Teklifi",
  "Afyonkarahisar OSB":
    "Afyonkarahisar OSB — Üye Sanayi Firmalarına Web Tasarım ve Dijital Dönüşüm İş Birliği Teklifi",
  "Kütahya OSB":
    "Kütahya OSB — Üye Firmalara Özel Kurumsal Web Tasarım ve Dijital Dönüşüm Teklifi",
  "Çorum OSB":
    "Çorum OSB — Üye Firmalara Yönelik Kurumsal Dijital Dönüşüm İş Birliği Önerisi",
  "Amasya OSB":
    "Amasya OSB — Üye Firmalara Özel Web Tasarım ve Dijital Görünürlük Teklifi",
  "Tokat OSB":
    "Tokat OSB — Üye Sanayi Firmalarına Kurumsal Dijital Dönüşüm İş Birliği Teklifi",
  "Ordu OSB":
    "Ordu (Fatsa) OSB — Üye Firmalara Özel Kurumsal Web ve Dijital Dönüşüm Teklifi",
  "Giresun OSB":
    "Giresun OSB — Üye Firmalara Yönelik Web Tasarım ve Dijital Dönüşüm İş Birliği Önerisi",
  "Van OSB":
    "Van OSB — Üye Sanayi Firmalarına Özel Kurumsal Dijital Dönüşüm Teklifi",
  "Mardin OSB":
    "Mardin 2. OSB — Üye Firmalara Özel Web Tasarım ve Dijital Dönüşüm İş Birliği Teklifi",
  "Batman OSB":
    "Batman OSB — Üye Firmalara Yönelik Kurumsal Web Tasarım İş Birliği Önerisi",
  "Osmaniye OSB":
    "Osmaniye OSB — Üye Sanayi Firmalarına Dijital Dönüşüm ve Web Tasarım Teklifi",
  "Karaman OSB":
    "Karaman OSB — Üye Firmalara Özel Kurumsal Dijital Dönüşüm İş Birliği Teklifi",
};

export function sourcePdfName(fileKey: string): string {
  return `Genua-Digital-${fileKey}-OSB-Teklifi-2026.pdf`;
}

export function destPdfName(index: number, fileKey: string): string {
  const slug = fileKey.replace(/-/g, "_");
  return `${String(index).padStart(2, "0")}_${slug}_OSB.pdf`;
}

export function buildOsbTeklifSubject(entry: OsbTeklifEntry): string {
  return (
    OSB_TEKLIF_SUBJECTS[entry.name] ??
    `${entry.name} — Üye Firmalara Özel Kurumsal Dijital Dönüşüm İş Birliği Teklifi`
  );
}

export function buildOsbTeklifMail(entry: OsbTeklifEntry) {
  return {
    subject: buildOsbTeklifSubject(entry),
    body: OSB_TEKLIF_MAIL_BODY,
  };
}

export function buildMailMetinleriMarkdown(entries: OsbTeklifEntry[]): string {
  const blocks = entries.map((entry) => {
    const { subject, body } = buildOsbTeklifMail(entry);
    return `## ${entry.index}. ${entry.name}
**Kime:** *(OSB yönetim e-postası)*
**Konu:** ${subject}

${body}

Saygılarımızla,
Umut Avcı
Genua Digital Media
hello@genuadigital.com | 0551 124 53 06 | genuadigital.com`;
  });

  return `# Genel OSB Teklif Dosyaları — Mail Metinleri
Her mailin sonunda ilgili PDF teklif dosyası ek olarak gönderilecektir.
Gönderen: Genua Digital / hello@genuadigital.com

---

${blocks.join("\n\n---\n\n")}
`;
}
