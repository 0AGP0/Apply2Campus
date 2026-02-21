# Panel Tasarım Analizi ve Tutarsızlıklar Raporu

## 1. Revize 3.5.1 (Kişisel Belgeler) Mekaniği – Mevcut Durum

| Revize Gereksinimi | Durum | Açıklama |
|--------------------|-------|----------|
| **Otomatik isimlendirme** (seçilen kategoriye göre) | ❌ **YOK** | `safeFilename(file.name)` ile orijinal dosya adı korunuyor. Kategoriye göre otomatik isim (örn. `Kimlik_Karti_v1.pdf`) yok. |
| **Versiyonlama** | ✅ VAR | `existingCount + 1` ile versiyon hesaplanıyor, UI'da `v{version}` gösteriliyor. |
| **Tarih** | ✅ VAR | `uploadedAt` veritabanında, UI'da gösteriliyor. |
| **Durumlar** (Yüklendi / Onaylandı / Revize istendi) | ✅ VAR | `UPLOADED`, `APPROVED`, `REVISION_REQUESTED` – `lib/document-status.ts` ile etiketleniyor. Danışman CrmCardClient'ta durum değiştirebiliyor. |

---

## 2. Panel Tasarım Tutarsızlıkları

### 2.1 Ana Layout Karşılaştırması

| Panel | Layout Bileşeni | Sidebar | Üst Bar (Desktop) | Mobil Header |
|-------|-----------------|---------|-------------------|--------------|
| **Admin** | AppLayout | AppSidebar | Yok | AppHeader (menü + logo + avatar) |
| **Danışman** | AppLayout | AppSidebar | Yok | AppHeader (menü + logo + avatar) |
| **Operasyon** | AppLayout | AppSidebar | Yok | AppHeader (menü + logo + avatar) |
| **Öğrenci** | StudentDashboardLayout | Kendi sidebar'ı | StudentGlobalBar (bildirim + profil) | Mobil header + StudentGlobalBar (compact) |

**Fark:** Öğrenci panelinde üst bar (bildirim + profil) her sayfada var; Admin/Danışman/Operasyon'da desktop'ta üst bar yok.

---

### 2.2 Sayfa Başlığı (Header) Karşılaştırması

| Sayfa | Kullanılan Bileşen | Bildirim/Aksiyon |
|-------|--------------------|------------------|
| **Panel ana sayfa** | PanelLayout | ConsultantNotifications (actions) |
| **Panel görevler** | PanelLayout | Yok |
| **Panel müsait saatler** | PanelLayout | Yok |
| **Admin özet** | PanelLayout (AdminOverviewClient) | Yok |
| **Admin diğer sayfalar** | PanelLayout | Varyasyonlu |
| **Öğrenci listesi** | PanelLayout | Admin/Operasyon link |
| **Öğrenci detay (profil, belgeler vb.)** | **PageHeader** + StudentDetailNav | Yok |
| **Operasyon inbox** | PanelLayout | Yok |
| **Operasyon mail detay** | **PageHeader** | Yok |

**Fark:** İki farklı header bileşeni var:
1. **PanelLayout** – `panel-layout__header` (border-bottom, padding, title/subtitle/actions)
2. **PageHeader** – Sol accent çizgisi, back link, shadow, farklı stil

---

### 2.3 Bildirim Erişimi

| Panel | Ana sayfa | İç sayfalar |
|-------|-----------|-------------|
| **Admin** | Yok | Yok |
| **Danışman** | ConsultantNotifications (PanelLayout actions) | Yok |
| **Operasyon** | Tek Inbox linki (PanelLayout actions) | Yok |
| **Öğrenci** | StudentGlobalBar (bildirim ikonu) | StudentGlobalBar (her sayfada) |

**Fark:** Danışman ana sayfada bildirim var, profil/belgeler gibi iç sayfalarda yok. Öğrenci tüm sayfalarda bildirim görebiliyor.

---

### 2.4 İçerik Alanı Yapısı

| Sayfa Grubu | Wrapper | Padding | Max-width |
|-------------|---------|---------|-----------|
| PanelLayout sayfaları | `panel-layout` | `--panel-px`, `--panel-py` | Yok (full width) |
| Öğrenci detay sayfaları | `max-w-[min(100%,1600px)] mx-auto` | `px-3 sm:px-4 lg:px-6` | 1600px |

**Fark:** Öğrenci detay sayfalarında max-width ve farklı padding; PanelLayout sayfalarında bu yok.

---

### 2.5 Özet Tutarsızlıklar

1. **Header bileşeni:** PanelLayout vs PageHeader – görsel ve yapısal fark.
2. **Bildirim erişimi:** Danışman/Operasyon'da sadece ana sayfada, öğrencide her yerde.
3. **Üst bar:** Öğrenci panelinde global bar var, Admin/Danışman/Operasyon'da yok.
4. **Öğrenci detay (profil, belgeler):** PageHeader kullanıyor, diğer sayfalar PanelLayout kullanıyor; danışman bu sayfalara girdiğinde farklı bir header deneyimi yaşıyor.

---

## 3. Önerilen Ortak Tasarım İlkeleri

1. **Tek üst bar:** Tüm panellerde (Admin, Danışman, Operasyon, Öğrenci) sabit üst bar; bildirim + profil burada olsun.
2. **Tek header bileşeni:** PanelLayout veya PageHeader'dan biri seçilsin; tüm iç sayfa başlıkları aynı bileşenle render edilsin.
3. **Öğrenci detay sayfaları:** PageHeader yerine PanelLayout benzeri yapı veya tutarlı stil.
4. **Bildirim:** Danışman/Operasyon/Admin için üst bara ConsultantNotifications eklenebilir (AppHeader genişletilerek).
