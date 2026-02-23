#!/bin/bash
# Apply2Campus – Sunucuda SQL düzeltmelerini çalıştır
# Kullanım: ./docs/legacy-fixes/run-legacy-fixes.sh
# veya: bash docs/legacy-fixes/run-legacy-fixes.sh

set -e
cd "$(dirname "$0")/../.."

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "$DATABASE_URL" ]; then
  echo "HATA: DATABASE_URL tanımlı değil. .env dosyasını kontrol edin."
  exit 1
fi

# ?schema=public gibi parametreleri kaldır (psql desteklemiyor)
DB_URL="${DATABASE_URL%%\?*}"

echo "Veritabanı: $DB_URL"
echo "SQL dosyası çalıştırılıyor..."
psql "$DB_URL" -f docs/legacy-fixes/run-all-legacy-fixes.sql

echo ""
echo "Başarıyla tamamlandı."
