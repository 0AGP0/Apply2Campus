-- OfferItem tablosunu güncelle: durationWeeks nullable, institutionId/startDate/endDate ekle
-- Teklif gönderme 500 hatasını düzeltir.
-- Kullanım: psql "${DATABASE_URL%%\?*}" -f docs/legacy-fixes/fix-offer-item-schema.sql

-- durationWeeks: NOT NULL → nullable
ALTER TABLE "OfferItem" ALTER COLUMN "durationWeeks" DROP NOT NULL;

-- Kurum kartından eklenen kalemler için yeni kolonlar
ALTER TABLE "OfferItem" ADD COLUMN IF NOT EXISTS "institutionId" TEXT;
ALTER TABLE "OfferItem" ADD COLUMN IF NOT EXISTS "startDate" DATE;
ALTER TABLE "OfferItem" ADD COLUMN IF NOT EXISTS "endDate" DATE;
