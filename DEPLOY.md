# Sunucu deploy – veri koruma

**Kural: Projeyi güncellediğinde (git pull + build + restart) sunucudaki hiçbir veri otomatik olarak değişmez veya silinmez.** Aksi açıkça belirtilmedikçe bu böyledir.

## Standart güncelleme (veriye dokunulmaz)

```bash
cd /var/www/apply2campus
git fetch origin
git reset --hard origin/master
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart apply2campus
```

- **prisma migrate deploy** yalnızca henüz uygulanmamış migration’ları çalıştırır (yeni tablo/kolon ekler). Mevcut kayıtları silmez veya sıfırlamaz.
- **Seed hiçbir zaman otomatik çalışmaz.** Sadece siz elle çalıştırırsanız çalışır.

## Veriyi silen / sıfırlayan komutlar (production’da kullanmayın)

- `prisma migrate reset` – Veritabanını siler, migration’ları baştan uygular.
- `prisma db push --force-reset` – Şemayı zorlar; reset ile veri silinebilir.
