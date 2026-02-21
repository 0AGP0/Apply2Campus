# Apply2Campus – Kurulum ve Kontrol Listesi

Sunucu ve proje için adım adım kontrol rehberi.

---

## 1. Veritabanı Ortamı

**Sunucuda `.env` kontrolü:**
```bash
cd /var/www/apply2campus
cat .env | grep DATABASE_URL
```
Beklenen format: `postgresql://KULLANICI:SIFRE@HOST:5432/apply2campus?schema=public`

Örnek: `postgresql://apply2campus:Apply2Campus2025@localhost:5432/apply2campus?schema=public`

---

## 2. Migration Durumu

**Sunucuda çalıştır:**
```bash
cd /var/www/apply2campus
npx prisma migrate status
```
Beklenen: `Database schema is up to date!` veya tüm migration’lar uygulanmış görünmeli.

**Migration’lar uygulanmamışsa:**
```bash
npx prisma migrate deploy
```

**Not:** "No pending migrations" ama tablo yoksa → `prisma/fix-document-categories.sql` ile manuel tablo oluşturma gerekebilir.

---

## 3. Tablolar – Var mı Kontrol Et

**PostgreSQL’e bağlan:**
```bash
sudo -u postgres psql -d apply2campus -c "\dt"
```

**Belgeler için gerekli tablolar:**
- `CrmSection` – CRM bölümleri
- `CrmField` – CRM alanları (FILE tipi dahil)
- `StudentDocument` – Öğrenci CRM belgeleri
- `DocumentCategory` – Belge kategorileri
- `StudentDocumentByCategory` – Kategoriye göre belgeler

**Tek tek kontrol:**
```bash
sudo -u postgres psql -d apply2campus -c "\dt CrmSection"
sudo -u postgres psql -d apply2campus -c "\dt CrmField"
sudo -u postgres psql -d apply2campus -c "\dt DocumentCategory"
```

---

## 4. İzinler – apply2campus Kullanıcısı

**.env’de kullanıcı `apply2campus` ise:**
```bash
sudo -u postgres psql -d apply2campus -c "
GRANT ALL PRIVILEGES ON TABLE \"CrmSection\" TO apply2campus;
GRANT ALL PRIVILEGES ON TABLE \"CrmField\" TO apply2campus;
GRANT ALL PRIVILEGES ON TABLE \"CrmValue\" TO apply2campus;
GRANT ALL PRIVILEGES ON TABLE \"StudentDocument\" TO apply2campus;
GRANT ALL PRIVILEGES ON TABLE \"DocumentCategory\" TO apply2campus;
GRANT ALL PRIVILEGES ON TABLE \"StudentDocumentByCategory\" TO apply2campus;
"
```

---

## 5. Seed’ler – Veri Doldurma

**Sıra önemli. Sunucuda sırayla çalıştır:**

```bash
cd /var/www/apply2campus
```

### 5.1 CRM (Belgeler bölümü + FILE alanları)
```bash
npm run db:seed-crm
```
Beklenen: `CRM seed tamamlandı.`

### 5.2 Belge kategorileri
```bash
npm run db:seed-document-categories
```
Beklenen: `Document categories: operation 17 | student upload 7`

### 5.3 (Opsiyonel) Ana seed – aşamalar, CRM, demo kullanıcılar
```bash
npm run db:seed
```
**Dikkat:** Yeni kullanıcılar oluşturabilir. Production’da sadece CRM için `db:seed-crm` yeterli.

---

## 6. Veri Kontrolü

**CrmSection kayıtları:**
```bash
sudo -u postgres psql -d apply2campus -c "SELECT id, slug, name FROM \"CrmSection\" ORDER BY \"sortOrder\";"
```
Beklenen: `documents` slug’lı bölüm olmalı.

**CrmField (documents bölümünde FILE alanları):**
```bash
sudo -u postgres psql -d apply2campus -c "
SELECT cf.slug, cf.label, cf.type 
FROM \"CrmField\" cf 
JOIN \"CrmSection\" cs ON cf.\"sectionId\" = cs.id 
WHERE cs.slug = 'documents' AND cf.type = 'FILE' 
ORDER BY cf.\"sortOrder\"
LIMIT 5;
"
```
Beklenen: Danışmanlık Sözleşmesi, Pasaport vb. en az 5 satır.

**DocumentCategory kayıtları:**
```bash
sudo -u postgres psql -d apply2campus -c "SELECT slug, name, type FROM \"DocumentCategory\" ORDER BY type, \"sortOrder\" LIMIT 10;"
```
Beklenen: OPERATION_UPLOADED ve STUDENT_UPLOADED kategorileri.

---

## 7. API Kontrolü

**Not:** API istekleri giriş (session) gerektirir. Cookie ile test etmek zor; tarayıcıda giriş yapıp Network sekmesinden kontrol edebilirsin.

**Giriş yapmadan test (401 beklenir):**
```bash
curl -s -o /dev/null -w "%{http_code}" https://SITE_ADRESINIZ/api/crm/form
```
Beklenen: `401` (Unauthorized)

**Giriş yaptıktan sonra** tarayıcıda:
- F12 → Network
- Belgeler sayfasına git
- `/api/crm/form` → Status 200, Response’ta `sections` dolu olmalı
- `/api/students/[id]/crm` → Status 200
- `/api/document-categories` → Status 200, `categories` dolu olmalı

---

## 8. Belgeler Sayfası Akışı

| Sayfa | Rol | Kullandığı API’ler |
|-------|-----|--------------------|
| `/dashboard/dokumanlar` | Öğrenci | /api/crm/form, /api/students/{id}/crm, /api/document-categories, /api/students/{id}/documents-by-category |
| `/students/{id}/belgeler` | Danışman/Admin | Aynı API’ler |

**Hata mesajları:**
- `Veriler yüklenemedi` → `/api/crm/form` veya `/api/students/{id}/crm` 200 dönmüyor
- `Belge alanları tanımlı değil` → CrmSection/CrmField boş veya `documents` bölümünde FILE alanı yok

---

## 9. Uygulama Yeniden Başlatma

Veri veya kod değişikliği sonrası:
```bash
pm2 restart all
# veya
systemctl restart apply2campus
```

---

## 10. Özet Komutlar (Sunucu)

Tüm kontroller tek seferde:
```bash
cd /var/www/apply2campus

# Migration
npx prisma migrate status

# Tablolar var mı
sudo -u postgres psql -d apply2campus -c "\dt CrmSection" -c "\dt DocumentCategory"

# İzinler (apply2campus kullanıcısı için)
sudo -u postgres psql -d apply2campus -c "
GRANT ALL PRIVILEGES ON TABLE \"CrmSection\" TO apply2campus;
GRANT ALL PRIVILEGES ON TABLE \"CrmField\" TO apply2campus;
GRANT ALL PRIVILEGES ON TABLE \"DocumentCategory\" TO apply2campus;
GRANT ALL PRIVILEGES ON TABLE \"StudentDocumentByCategory\" TO apply2campus;
"

# Seed
npm run db:seed-crm
npm run db:seed-document-categories

# Restart
pm2 restart all
```

---

## Sorun Giderme

| Belirti | Olası sebep | Çözüm |
|---------|-------------|-------|
| Tablo yok | Migration uygulanmamış | `prisma migrate deploy` veya `fix-document-categories.sql` |
| permission denied | apply2campus yetkisi yok | GRANT komutlarını çalıştır |
| Belge alanları tanımlı değil | CrmSection/CrmField boş | `npm run db:seed-crm` |
| Veriler yüklenemedi | API 401/403/500 | Session/cookie kontrolü, Network sekmesi |
| Sayfa boş ama API 200 | Frontend cache | Hard refresh (Ctrl+Shift+R) |
