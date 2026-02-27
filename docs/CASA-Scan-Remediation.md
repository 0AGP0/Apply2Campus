# CASA Tarama Raporu – Düzeltme Rehberi

Bu dokümanda TAC Security CASA raporundaki maddeler için yapılacaklar özetlenir.

---

## 1. Proxy / Sunucu Bilgi Sızıntısı (Low) – CWE 204

**Sorun:** TRACE/OPTIONS/TRACK ile nginx ve Next.js sürümü tespit ediliyor; `Server`, `X-Powered-By` bilgisi sızıyor.

**Yapılacaklar (sunucu / nginx):**

- **TRACE ve TRACK’i kapatın.** OPTIONS CORS için gerekebilir; sadece TRACE/TRACK’i engelleyin.
- **Server header’ı gizleyin** (nginx sürümü görünmesin).
- **X-Powered-By:** Uygulama tarafında `next.config.js` içinde `powerByHeader: false` zaten eklendi. Nginx veya reverse proxy’de de `X-Powered-By`’ı kaldırın/silmeyin (uygulama set etmiyorsa proxy’de eklemeyin).
- **Özel hata sayfaları** kullanın (4xx/5xx) böylece varsayılan nginx/Next.js hata sayfaları sızmasın.

**Örnek nginx konfigürasyonu** (site `server` bloğuna eklenebilir):

```nginx
# Sürüm bilgisini kapat
server_tokens off;

# TRACE ve TRACK metodlarını reddet
if ($request_method ~ ^(TRACE|TRACK)$) {
    return 405;
}

# İsteğe bağlı: X-Powered-By'ı kaldır (proxy'de backend'den gelen header'ı silmek için)
proxy_hide_header X-Powered-By;
# İsteğe bağlı: Server header'ı özelleştir (boş veya generic)
more_clear_headers Server;
# veya: add_header Server "Web";  (generic değer)
```

---

## 2. Sub Resource Integrity (SRI) Eksik (Low) – CWE 345

**Sorun:** `fonts.googleapis.com` üzerinden yüklenen Material Icons linkinde `integrity` attribute yok.

**Uygulama tarafı:** `app/layout.tsx` içinde ilgili link’e `crossOrigin="anonymous"` eklendi (SRI kullanılacaksa gerekli).

**SRI için iki seçenek:**

- **A) Self-host (önerilen):** Material Icons font dosyasını (woff2) ve CSS’i kendi sunucunuza alın; kendi CSS link’inize `integrity` ve `crossOrigin="anonymous"` ekleyin. Hash’i oluşturmak için:
  ```bash
  openssl dgst -sha384 -binary public/fonts/material-icons-outlined.css | openssl base64 -A
  ```
  Layout’ta örnek:
  ```html
  <link rel="stylesheet" href="/fonts/material-icons-outlined.css" integrity="sha384-..." crossOrigin="anonymous" />
  ```
- **B) Google CDN’de kalmak:** Google Fonts, icon CSS için sabit bir SRI hash sunmuyor (içerik user-agent’a göre değişebilir). Bu maddeyi TAC’a “Third-party is Google; vendor does not provide SRI for this resource; we use crossorigin=anonymous” şeklinde açıklayıp kabul edilmesini isteyebilirsiniz.

---

## 3. Cross-Origin-Resource-Policy (Info) – CWE 693

**Durum:** `next.config.js` içinde tüm sayfalar için `Cross-Origin-Resource-Policy: same-origin` header’ı eklendi. Deploy sonrası yanıtlarda bu header’ın geldiğini doğrulayın.

---

## 4. Server / X-Powered-By Sürüm Sızıntısı (Info) – CWE 497

**Durum:**

- Uygulama: `powerByHeader: false` ile Next.js artık `X-Powered-By` göndermiyor.
- Sunucu: Nginx tarafında `server_tokens off;` ve isteğe bağlı `proxy_hide_header X-Powered-By;` / `more_clear_headers Server;` ile sürüm bilgisi azaltıldı (yukarıdaki nginx örneği).

---

## 5. Strict-Transport-Security (HSTS) (Info) – CWE 319

**Durum:** `next.config.js` headers’a `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` eklendi. Production’da HTTPS kullandığınızdan emin olun.

**İsteğe bağlı:** [HSTS Preload](https://hstspreload.org/) listesine eklenmek için aynı header yeterli; siteyı listeye gönderebilirsiniz.

---

## 6. Information Disclosure – Suspicious Comments (Info) – CWE 615

**Durum:** Rapor, Next.js ve core-js gibi üçüncü parti minify edilmiş JS içindeki “query”, “select”, “from” gibi kelimeleri “şüpheli yorum” olarak işaretliyor. Bunlar framework/kütüphane kodunda; uygulama kaynak kodunuzda değil.

**Yapılacak:** TAC’a **False Positive** olarak bildirin: “Findings are inside Next.js and core-js bundled/minified code, not application source; we do not control third-party bundle content.”

---

## 7. Modern Web Application (Info)

Bilgilendirme amaçlı; aksiyon gerekmez.

---

## 8. Storable and Cacheable Content / Cache-Control (Info) – CWE 524, 525

**Durum:** `next.config.js` içinde hassas sayfalar için ayrı header kuralları eklendi:

- `Cache-Control: no-store, no-cache, must-revalidate, private`
- `Pragma: no-cache`
- `Expires: 0`

Kapsanan yollar: `/login`, `/register`, `/dashboard`, `/admin`, `/students`, `/operasyon`, `/gizlilik`, `/kullanim-kosullari` (ve alt path’leri).

Static asset’ler (`/_next/static/...`) için uzun `max-age` kalabilir; sadece kullanıcıya özel/hassas sayfalar no-store ile işaretlendi.

---

## Özet Kontrol Listesi

| # | Madde                         | Uygulama (Next.js)     | Sunucu (nginx)                    |
|---|-------------------------------|------------------------|-----------------------------------|
| 1 | Proxy/server disclosure       | -                      | TRACE/TRACK kapat, server_tokens off, proxy_hide_header |
| 2 | SRI                           | crossOrigin eklendi    | Self-host veya TAC’a açıklama     |
| 3 | CORP                          | same-origin eklendi    | -                                 |
| 4 | Server/X-Powered-By           | powerByHeader: false   | server_tokens off, header temizleme |
| 5 | HSTS                          | Header eklendi         | -                                 |
| 6 | Suspicious comments           | -                      | TAC’a false positive bildirimi   |
| 7 | Modern web app                | -                      | -                                 |
| 8 | Cache-Control                 | Hassas sayfalar no-store| -                                 |

Deploy sonrası bir sonraki CASA revalidation’da bu maddelerin “resolved” sayılması için gerekirse TAC’a düzeltme kanıtı (ör. ekran görüntüsü veya curl çıktısı) ile birlikte bildirim yapın.
