# Lokal Test Rehberi

## Şu anki durum

- Proje derleniyor (`npm run build` başarılı).
- Test için **PostgreSQL** ve **.env** dosyası gerekiyor.

## Hızlı test adımları

### 1. `.env` dosyası oluştur

Proje kökünde (Apply2Campus içinde) `.env` dosyası yok. Oluşturmak için:

```bash
copy .env.example .env
```

Sonra `.env` dosyasını açıp şunları doldur:

| Değişken | Ne yazacaksın |
|----------|----------------|
| `DATABASE_URL` | PostgreSQL bağlantı adresi. Örnek: `postgresql://postgres:sifre@localhost:5432/educonsult` |
| `NEXTAUTH_URL` | `http://localhost:3000` (zaten örnekte var) |
| `NEXTAUTH_SECRET` | Uzun rastgele bir metin (örn. 32+ karakter). Örnek: `my-super-secret-key-12345-change-in-production` |
| `TOKEN_ENCRYPTION_SECRET` | En az 32 karakter. Örnek: `token-encryption-secret-key-32-chars-minimum` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Gmail test için gerekli; ilk aşamada **boş bırakabilirsin**. Sadece giriş ve öğrenci listesi test edeceksen gerek yok. |

### 2. PostgreSQL

- Bilgisayarında PostgreSQL kurulu ve çalışıyor olmalı.
- Veritabanı oluştur (örnek):
  ```sql
  CREATE DATABASE educonsult;
  ```
- `.env` içindeki `DATABASE_URL` bu veritabanına işaret etmeli.

### 3. Veritabanı ve seed

```bash
npx prisma db push
npm run db:seed
```

Seed sonrası:

- **Admin:** `admin@educonsult.local` / `password123`
- **Danışman:** `sarah@educonsult.local` / `password123`

### 4. Uygulamayı çalıştır

```bash
npm run dev
```

Tarayıcıda: **http://localhost:3000**

- Giriş: `sarah@educonsult.local` veya `admin@educonsult.local`, şifre: `password123`
- Öğrenci listesi, öğrenci detayı, admin paneli bu haliyle test edilebilir.

### Gmail (Connect / Sync / Gönder) test etmek istersen

- Google Cloud Console’da proje aç.
- Gmail API’yi etkinleştir.
- OAuth 2.0 Client ID oluştur (Web application).
- Redirect URI: `http://localhost:3000/api/oauth/gmail/callback`
- Client ID ve Secret’ı `.env` içine `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` olarak yaz.

---

**Özet:** Evet, localde test edebilirsin. Koşul: `.env` dosyasını oluşturup `DATABASE_URL`, `NEXTAUTH_SECRET` ve `TOKEN_ENCRYPTION_SECRET` doldurman ve PostgreSQL’in çalışıyor olması. Google bilgilerini boş bırakırsan sadece Gmail bağlama/sync/gönder çalışmaz; giriş ve öğrenci/admin sayfaları çalışır.
