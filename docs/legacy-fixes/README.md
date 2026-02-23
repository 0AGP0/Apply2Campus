# Sunucuda Çalıştırılacak SQL Düzeltmeleri

`npx prisma migrate dev` shadow database izni gerektirdiği için sunucuda çalıştırılamıyor. Aşağıdaki SQL dosyası ile tüm eksik tablolar ve güncellemeler tek seferde uygulanır.

## Tek Komutla Çalıştırma

Proje kök dizininde:

```bash
source .env && psql "${DATABASE_URL%%\?*}" -f docs/legacy-fixes/run-all-legacy-fixes.sql
```

veya shell script ile:

```bash
chmod +x docs/legacy-fixes/run-legacy-fixes.sh
./docs/legacy-fixes/run-legacy-fixes.sh
```

## Doğrudan psql ile

```bash
psql "postgresql://USER:PASS@HOST:5432/DBNAME" -f docs/legacy-fixes/run-all-legacy-fixes.sql
```

`.env` içindeki `DATABASE_URL`'deki `?schema=public` gibi parametreleri kaldırın (psql desteklemez).

## Ne Yapıyor?

1. **Eksik tablolar:** Announcement, Institution, InstitutionImage, InstitutionService, InstitutionPrice, ConsultantSlot, AppointmentRequest, Task
2. **OfferItem güncellemesi:** `durationWeeks` nullable, `institutionId`, `startDate`, `endDate` kolonları
3. **UserNotification tablosu:** Duyuru ve teklif bildirimleri

İdempotent: Aynı script birden fazla kez çalıştırılabilir, mevcut nesneler atlanır.
