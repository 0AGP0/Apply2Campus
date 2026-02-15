# Apply2Campus – VPS Kurulum Adımları (Ubuntu 22.04)

Mevcut portal: **portal.campusglobal.com.tr** → port **3000**  
Apply2Campus: **apply2campus.com** → port **3001**

---

## Adım 0: Mevcut portalın nerede olduğunu bulma (isteğe bağlı)

```bash
# Port 3000'de çalışan process'in çalışma dizini
ls -l /proc/929/cwd
# veya
pwdx 929
```

PM2 kullanıyorsanız: `pm2 list` ve `pm2 show <id>` ile path görünür.

---

## Adım 1: PostgreSQL kurulumu

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Apply2Campus için veritabanı ve kullanıcı oluştur:

```bash
sudo -u postgres psql -c "CREATE USER apply2campus WITH PASSWORD 'GÜÇLÜ_BİR_ŞİFRE_BURAYA';"
sudo -u postgres psql -c "CREATE DATABASE apply2campus OWNER apply2campus;"
```

`GÜÇLÜ_BİR_ŞİFRE_BURAYA` yerine gerçek bir şifre yazın (tek tırnak içinde).

Bağlantıyı test et:

```bash
sudo -u postgres psql -c "\l" | grep apply2campus
```

---

## Adım 2: Apply2Campus için dizin ve proje

Mevcut portal muhtemelen `/var/www` veya `/root` altında. Apply2Campus’u ayrı yere kuralım:

```bash
sudo mkdir -p /var/www/apply2campus
sudo chown $USER:$USER /var/www/apply2campus
cd /var/www/apply2campus
git clone https://github.com/0AGP0/Appl2Campus.git .
```

(Eğer `git clone` "Appl2Campus" adında alt klasör açarsa: `git clone https://github.com/0AGP0/Appl2Campus.git Appl2Campus && cd Appl2Campus` veya clone sonrası `cd Appl2Campus` yapıp devam edin.)

---

## Adım 3: .env dosyası

```bash
cd /var/www/apply2campus   # veya cd /var/www/apply2campus/Appl2Campus
cp .env.example .env
nano .env
```

Aşağıdaki değerleri **kendi bilgilerinizle** doldurun:

```env
# Veritabanı (Adım 1'de oluşturduğunuz şifre)
DATABASE_URL="postgresql://apply2campus:GÜÇLÜ_BİR_ŞİFRE_BURAYA@localhost:5432/apply2campus?schema=public"

# Canlı URL (https ile)
NEXTAUTH_URL="https://apply2campus.com"
NEXTAUTH_SECRET="buraya-32-karakter-veya-uzun-rastgele-bir-metin"
TOKEN_ENCRYPTION_SECRET="buraya-da-32-karakter-veya-uzun-rastgele-metin"

# Google OAuth (Google Cloud Console'dan alınacak; önce boş bırakıp sonra ekleyebilirsiniz)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

NEXTAUTH_SECRET ve TOKEN_ENCRYPTION_SECRET için sunucuda:

```bash
openssl rand -base64 32
```

iki kez çalıştırıp çıkan değerleri kopyalayabilirsiniz.  
Kaydet: `Ctrl+O`, Enter, `Ctrl+X`.

---

## Adım 4: Bağımlılıklar, Prisma, build

```bash
cd /var/www/apply2campus   # proje kökü
npm install
npx prisma generate
npx prisma db push
npm run build
```

Hata alırsanız çıktıyı kaydedin.

---

## Adım 5: Port 3001’de test

```bash
PORT=3001 npm start
```

Tarayıcıdan `http://SUNUCU_IP:3001` ile açılıyorsa Ctrl+C ile durdurun. Sonra kalıcı çalıştırmak için PM2:

```bash
npm install -g pm2
pm2 start npm --name "apply2campus" -- start -- -p 3001
pm2 save
pm2 startup
```

(Çıkan `pm2 startup` komutunu da çalıştırın.)

---

## Adım 6: Nginx – apply2campus.com için site

```bash
sudo nano /etc/nginx/sites-available/apply2campus.com
```

İçeriği:

```nginx
server {
    listen 80;
    server_name apply2campus.com www.apply2campus.com;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Kaydedip site’ı açın ve Nginx’i test edin:

```bash
sudo ln -s /etc/nginx/sites-available/apply2campus.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Adım 7: SSL (HTTPS) – Let’s Encrypt

apply2campus.com için DNS’in sunucuya yönlendiğinden emin olun. Sonra:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d apply2campus.com -d www.apply2campus.com
```

Sorularda e‑posta girin, kuralları kabul edin. Bittikten sonra:

```bash
sudo systemctl reload nginx
```

Artık `https://apply2campus.com` açılmalı.

---

## Adım 8: İlk kullanıcı (seed)

```bash
cd /var/www/apply2campus
npm run db:seed
```

Böylece admin/danışman hesapları oluşur (şifre .env veya seed dosyasında).

---

## Özet

| Ne            | Nerede / Nasıl                    |
|---------------|-----------------------------------|
| Mevcut portal | portal.campusglobal.com.tr → 3000 |
| Apply2Campus  | /var/www/apply2campus, port 3001  |
| Domain        | apply2campus.com → Nginx → 3001   |
| Veritabanı    | PostgreSQL, DB: apply2campus      |

Mevcut portalın tam dizinini öğrenmek için (isteğe bağlı):

```bash
ls -l /proc/929/cwd
```

Bu adımları sırayla uygulayın; bir yerde takılırsanız tam hata/çıktıyı paylaşırsanız devam edebiliriz.
