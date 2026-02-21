-- StudentDocument tablosuna version ve status sütunları ekle
-- "The column StudentDocument.version does not exist" hatası alıyorsan çalıştır.

-- DocumentStatus enum (yoksa oluştur)
DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'APPROVED', 'REVISION_REQUESTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- StudentDocument sütunları
ALTER TABLE "StudentDocument" ADD COLUMN IF NOT EXISTS "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED';
ALTER TABLE "StudentDocument" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
