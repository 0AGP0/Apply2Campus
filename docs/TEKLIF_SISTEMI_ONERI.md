# Teklif Gönderme Sistemi – Tasarım Önerisi

Bu dokümanda, danışmanın öğrenciye teklif (paket / hizmet önerisi) göndermesi ve öğrencinin bunu görüp yanıtlaması için önerilen sistem yer alıyor.

---

## 1. Amaç

- **Danışman** öğrenciye resmi bir **teklif** oluşturup gönderebilsin (hangi hizmetler, hangi üniversiteler, süre, ücret vb.).
- **Öğrenci** portaldan teklifi görsün, **kabul / red / revize iste** gibi yanıt verebilsin.
- Teklif geçmişi (hangi teklif, ne zaman, hangi durumda) hem danışman hem öğrenci tarafında takip edilebilsin.

---

## 2. Veri Modeli Önerisi

### 2.1 Ana tablo: `Offer` (Teklif)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | cuid | Birincil anahtar |
| `studentId` | String | Hangi öğrenciye |
| `createdById` | String | Teklifi oluşturan danışman/admin (User.id) |
| `title` | String | Teklif başlığı (örn. "2025 Almanya Başvuru Paketi") |
| `summary` | Text? | Kısa özet |
| `body` | Text? | Detaylı açıklama (rich text veya Markdown) |
| `status` | Enum | DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, REVISION_REQUESTED |
| `sentAt` | DateTime? | Ne zaman gönderildi |
| `viewedAt` | DateTime? | Öğrenci ilk ne zaman açtı |
| `respondedAt` | DateTime? | Kabul/red ne zaman yapıldı |
| `responseNote` | Text? | Öğrencinin veya danışmanın notu (red gerekçesi, revize isteği vb.) |
| `version` | Int | Aynı “teklif ailesi” için revizyon numarası (isteğe bağlı) |
| `createdAt` / `updatedAt` | DateTime | |

**Status akışı (önerilen):**

- `DRAFT` → danışman taslak kaydeder, henüz göndermez.
- `SENT` → öğrenciye gönderildi (e-posta veya portal bildirimi).
- `VIEWED` → öğrenci teklifi en az bir kez açtı.
- `ACCEPTED` / `REJECTED` → öğrenci kabul veya red etti.
- `REVISION_REQUESTED` → öğrenci “revize et” dedi; danışman yeni versiyon oluşturabilir.

### 2.2 İsteğe bağlı: Teklif kalemleri (satır bazlı fiyat/hizmet)

Üniversite bazlı veya hizmet bazlı satırlar isterseniz:

**`OfferItem`** (teklif kalemi)

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | cuid | |
| `offerId` | String | Hangi teklif |
| `type` | Enum? | UNIVERSITY, SERVICE, PACKAGE, OTHER |
| `label` | String | Açıklama (örn. "Berlin Üniversitesi", "Vize danışmanlığı") |
| `amount` | Decimal? | Tutar (isteğe bağlı) |
| `sortOrder` | Int | Sıra |

Böylece tek teklif içinde birden fazla üniversite veya hizmet satırı tutulabilir.

### 2.3 İsteğe bağlı: Teklif şablonları

Danışmanlar sık kullandıkları teklifleri şablondan üretebilsin diye:

**`OfferTemplate`**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | cuid | |
| `createdById` | String | Oluşturan (admin/danışman) |
| `name` | String | Şablon adı |
| `title` | String | Varsayılan teklif başlığı |
| `body` | Text? | Varsayılan içerik |
| `createdAt` | DateTime | |

Yeni teklif oluştururken "Şablondan oluştur" ile bu alanlar doldurulur.

---

## 3. Akış Özeti

1. **Danışman tarafı**
   - Öğrenci detay sayfasında "Teklif oluştur" / "Teklif gönder".
   - Başlık, özet, detay (ve istenirse kalemler) girilir.
   - Taslak kaydedilir (`DRAFT`) veya doğrudan "Gönder" (`SENT`).
   - Gönderince: portal bildirimi + isteğe bağlı e-posta (öğrenci e-postasına link veya metin).

2. **Öğrenci tarafı**
   - Dashboard veya "Tekliflerim" sayfasında teklif listesi (SENT, VIEWED, ACCEPTED, REJECTED, REVISION_REQUESTED).
   - Teklife tıklayınca detay sayfası açılır; ilk açılışta `viewedAt` set edilir, status `VIEWED` yapılır.
   - Butonlar: "Kabul et", "Reddet", "Revize iste" (isteğe bağlı).
   - Red/revize isteğinde kısa not alanı.

3. **Danışman tarafı (takip)**
   - Öğrenci detayında "Gönderilen teklifler" listesi.
   - Durum: Taslak, Gönderildi, Görüldü, Kabul, Red, Revize istendi.
   - Revize istenen teklif için "Yeni versiyon oluştur" (kopyala + düzenle → yeni teklif).

---

## 4. API Önerisi

- `GET /api/students/[studentId]/offers` — Öğrencinin teklifleri (danışman/admin veya ilgili öğrenci).
- `POST /api/students/[studentId]/offers` — Yeni teklif oluştur (danışman/admin).
- `GET /api/students/[studentId]/offers/[offerId]` — Tekil teklif (görüntüleme sırasında VIEWED yapılabilir).
- `PATCH /api/students/[studentId]/offers/[offerId]` — Taslak güncelleme veya "Gönder" (status → SENT).
- `POST /api/students/[studentId]/offers/[offerId]/respond` — Öğrenci yanıtı (ACCEPTED / REJECTED / REVISION_REQUESTED + not).

Öğrenci kendi tekliflerini görmek için:

- `GET /api/me/offers` veya `GET /api/students/[studentId]/offers` (session studentId ile yetki kontrolü).

---

## 5. Bildirim Entegrasyonu

- Teklif **gönderildiğinde** (`SENT`): Öğrenci için `ConsultantNotification` veya ayrı bir "teklif bildirimi" ile "Size yeni bir teklif gönderildi" mesajı.
- Teklif **kabul/red/revize** edildiğinde: Danışmana bildirim (mevcut danışman bildirim sistemine eklenebilir).

---

## 6. E-posta ile Gönderim (Opsiyonel)

- "Teklif gönder" denince öğrencinin `studentEmail` veya giriş e-postasına:
  - Kısa metin + portala link (`/dashboard/offers/[offerId]`),
  - veya e-postada özet + "Detay için giriş yapın" linki.
- Gmail API ile öğrenci adına mail göndermek yerine, sistem tarafından (SMTP/transactional email) gönderim daha basit olur; Gmail bağlantısı sadece danışmanın öğrenci gelen kutusunu okuması için kalabilir.

---

## 7. Uygulama Adımları (Öncelik Sırasıyla)

1. **Prisma:** `Offer` modeli (ve istenirse `OfferItem`, `OfferTemplate`) eklenmesi, migration.
2. **API:** Yukarıdaki CRUD + `respond` endpoint’leri, yetki (danışman = kendi öğrencisi, admin = tümü, öğrenci = sadece kendi teklifleri).
3. **Danışman UI:** Öğrenci detay sayfasında "Teklifler" sekmesi veya sayfa, teklif oluşturma/düzenleme/gönder listesi.
4. **Öğrenci UI:** Dashboard’da "Tekliflerim" bloğu veya ayrı sayfa, teklif detayı, kabul/red/revize butonları.
5. **Bildirim:** Teklif gönderildi → öğrenci bildirimi; kabul/red/revize → danışman bildirimi.
6. **İsteğe bağlı:** E-posta ile link, şablonlar, teklif kalemleri (OfferItem).

Bu yapı ile "teklif gönderme" hem takip edilebilir hem de öğrenci tarafında net bir onay/red/revize sürecine bağlanmış olur. İstersen bir sonraki adımda doğrudan Prisma şeması ve ilk API route’larının kodunu yazabilirim.
