# Apply2Campus – Canlıya Alma Rehberi

Bu proje **Next.js + Node.js** uygulamasıdır. Sadece dosyaları `public_html` içine kopyalamak **yeterli değildir**; sunucuda Node.js çalıştırmanız gerekir.

---

## 1. Sunucuya Atma (Deploy)

### Önemli

- **public_html** genelde statik HTML/PHP içindir; **Next.js burada çalışmaz**.
- Uygulama bir **Node.js sunucusu** (örn. `npm run build && npm start`) ile çalışır.
- **PostgreSQL** veritabanı gerekir (sunucuda kurulu veya harici servis).

### Aynı VPS’te 2 (veya daha fazla) portal çalışır mı?

**Evet.** Bir VPS’te birden fazla uygulama çalıştırabilirsiniz. Her uygulama **farklı bir port**ta çalışır; Nginx ile domain/subdomain’e göre ilgili porta yönlendirirsiniz.

| Uygulama      | Port  | Domain örneği        |
|---------------|-------|----------------------|
| Mevcut portal | 3000  | `mevcut-site.com`    |
| Apply2Campus  | 3001  | `apply2campus.com` veya `portal.alanadi.com` |

- Apply2Campus’u **3001** (veya boş olan başka bir port) üzerinde çalıştırın ki mevcut portalın portu ile çakışmasın.
- Nginx’te her domain için ayrı `server { ... }` bloğu tanımlayıp `proxy_pass http://127.0.0.1:3000` / `http://127.0.0.1:3001` ile yönlendirin.
- PM2 ile her uygulamayı ayrı process olarak çalıştırın (örn. `apply2campus` ve `mevcut-portal`).

Detay için aşağıdaki “Seçenek A” ve “Port ve Nginx” adımlarına bakın.

---

### Seçenek A: VPS (Kendi sunucunuz – örn. Hostinger VPS, DigitalOcean, Hetzner)

1. **Sunucuda kurulum**
   - Node.js 18+ (örn. `nvm install 18`)
   - PostgreSQL
   - Git (veya projeyi zip ile atıp açma)

2. **Projeyi sunucuya almak**
   ```bash
   cd /var/www   # veya tercih ettiğiniz dizin
   git clone https://github.com/0AGP0/Appl2Campus.git
   cd Appl2Campus
   ```

3. **Ortam değişkenleri (.env)**
   - `.env.example` dosyasını kopyalayıp `.env` yapın.
   - Aşağıdaki değerleri **canlı ortam**a göre doldurun:
     - `DATABASE_URL` → Sunucudaki PostgreSQL bağlantı adresi
     - `NEXTAUTH_URL` → Site adresiniz (örn. `https://apply2campus.com`)
     - `NEXTAUTH_SECRET` → Güçlü rastgele bir parola (örn. `openssl rand -base64 32`)
     - `TOKEN_ENCRYPTION_SECRET` → En az 32 karakter rastgele anahtar
     - `GOOGLE_CLIENT_ID` ve `GOOGLE_CLIENT_SECRET` → Aşağıda “Google OAuth’u Yayına Alma” bölümündeki client bilgileri

4. **Build ve çalıştırma**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push   # veya migrate
   npm run build
   npm start
   ```
   **Port:** Varsayılan **3000**. Aynı sunucuda başka bir uygulama 3000 kullanıyorsa Apply2Campus’u **farklı portta** çalıştırın:
   ```bash
   PORT=3001 npm start
   ```
   veya `package.json` içinde `"start": "next start -p 3001"` yapabilirsiniz. Sürekli açık kalması için **PM2** kullanın:
   ```bash
   npm install -g pm2
   pm2 start npm --name "apply2campus" -- start -- -p 3001
   pm2 save
   pm2 startup
   ```
   (Mevcut portal zaten 3000’de ise Apply2Campus’u 3001’de çalıştırın.)

5. **Nginx ile domain verme (isteğe bağlı)**
   - Nginx’te `proxy_pass http://127.0.0.1:3000` ile uygulamayı dinleyin.
   - SSL için Let’s Encrypt (örn. `certbot`) kullanın.
   - Böylece `https://siteniz.com` doğrudan bu uygulamaya gider; `public_html` kullanmak zorunda kalmazsınız.

   **Aynı sunucuda 2 portal:** İki ayrı `server { ... }` bloğu:
   ```nginx
   # Mevcut portal (port 3000)
   server {
       server_name mevcut-site.com;
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   # Apply2Campus (port 3001)
   server {
       server_name apply2campus.com;   # veya portal.alanadi.com
       location / {
           proxy_pass http://127.0.0.1:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   SSL için her iki `server_name` için de `certbot` (Let’s Encrypt) kullanın.

### Seçenek B: Railway / Render / Vercel (Yönetilen hosting)

- **Railway / Render:** Repo’yu bağlayıp “Deploy” deyin; `DATABASE_URL` ve diğer env’leri panelden girin. PostgreSQL ekleyebilirsiniz.
- **Vercel:** Next.js için uygundur; veritabanı ayrı (örn. Vercel Postgres veya harici PostgreSQL) tanımlanır.
- Bu platformlarda **“public html”** yok; uygulama otomatik build edilir ve bir URL (örn. `https://xxx.railway.app`) ile yayına alınır.

### “public_html” kullanmak istiyorsanız

- Klasik **sadece public_html** sunan hosting (cPanel, sadece PHP) bu projeyi **doğrudan** çalıştıramaz.
- Ya **Node.js destekleyen** bir hosting / VPS kullanın ya da yukarıdaki gibi Railway/Render/Vercel ile yayına alıp, istersen kendi domain’inizi bu servise yönlendirin.

---

## 2. Google OAuth’u “Test”ten “Yayında” (Publish) Yapma

Gmail bağlantısı (öğrenci OAuth) ve isteğe bağlı danışman girişi için Google OAuth client kullanıyorsunuz. “Test” modunda yalnızca sizin eklediğiniz test kullanıcıları giriş yapabilir; herkes için açmak için yayına almanız gerekir.

### Adım 1: Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → Projenizi seçin (veya yeni proje oluşturun).
2. **APIs & Services** → **Credentials** → Kullandığınız **OAuth 2.0 Client ID**’yi açın (Web application).

### Adım 2: Authorized redirect URIs (Canlı URL)

1. **Credentials** → İlgili OAuth client → **Edit**.
2. **Authorized redirect URIs** kısmına **canlı** adresinizi ekleyin:
   - Örnek: `https://apply2campus.com/api/oauth/gmail/callback`
   - NextAuth Google ile giriş kullanıyorsanız: `https://apply2campus.com/api/auth/callback/google`
3. **Authorized JavaScript origins** (varsa): `https://apply2campus.com`
4. **Save**.

### Adım 3: OAuth consent screen’i “Production”a almak

1. **APIs & Services** → **OAuth consent screen**.
2. Şu an **Testing** modundadır; sadece “Test users” listesindeki hesaplar giriş yapabilir.
3. **“PUBLISH APP”** (veya “Make public” / “Move to Production”) butonuna tıklayın.
4. Uyarıyı onaylayın: Uygulama “Production”a geçer, artık herhangi bir Google hesabı giriş yapabilir (izin ekranı gösterilir).

### Adım 4: Gmail API ve hassas kapsamlar (Gmail kullanıyorsanız)

- Gmail API (e-posta okuma/gönderme) **hassas kapsam** sayılır.
- **Kullanıcı sayısı 100’den azsa** genelde “Verification” zorunlu olmaz; sadece “unverified app” uyarısı çıkar, kullanıcı “Advanced” → “Go to Apply2Campus” ile devam edebilir.
- **100+ kullanıcı** veya kurumsal kullanım için Google’a **OAuth verification** başvurusu yapmanız gerekir (OAuth consent screen’den “Prepare for verification” / “Submit for verification”).

### Özet checklist (Google)

- [ ] OAuth client’ta **Authorized redirect URIs** = `https://SITENIZ.com/api/oauth/gmail/callback` (ve varsa callback/google).
- [ ] OAuth consent screen → **Publish app** (Production).
- [ ] Gerekirse Gmail API’nin projede **enabled** olduğunu kontrol edin (APIs & Services → Library → Gmail API → Enable).

---

## 3. Canlı Ortam Checklist

- [ ] Sunucu / hosting’de **Node.js 18+** ve **PostgreSQL** var.
- [ ] `.env` dosyası oluşturuldu; `NEXTAUTH_URL` = canlı site URL’i (https ile).
- [ ] `DATABASE_URL` canlı veritabanına işaret ediyor.
- [ ] `NEXTAUTH_SECRET` ve `TOKEN_ENCRYPTION_SECRET` güçlü ve rastgele.
- [ ] Google OAuth client’ta canlı **redirect URI** ve **origin** eklendi.
- [ ] OAuth consent screen **Production** (yayında).
- [ ] `npm run build` ve `npm start` (veya PM2) ile uygulama çalışıyor.
- [ ] İlk açılışta gerekirse `npm run db:seed` ile admin kullanıcı oluşturuldu.

Bu adımları tamamladığınızda proje canlıya alınmış ve Google OAuth “test”ten çıkıp yayında olur.
