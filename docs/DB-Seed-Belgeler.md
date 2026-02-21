# Belgeler Sayfası – Veritabanı Kurulumu

**"Belge gözükmüyor"** sorunu genelde seed'lerin çalıştırılmamış olmasından kaynaklanır.

## Gerekli seed'ler

1. **Ana seed** (CRM bölümleri, belge alanları):
   ```bash
   npm run db:seed
   ```
   Bu komut `CrmSection` (örn. "Belgeler" bölümü) ve `CrmField` (Danışmanlık Sözleşmesi, Pasaport, Lise Diploması vb. FILE alanları) kayıtlarını oluşturur.

2. **Belge kategorileri** (Operasyon + Öğrenci evrak):
   ```bash
   npm run db:seed-document-categories
   ```
   Bu komut `DocumentCategory` kayıtlarını oluşturur:
   - Operasyonun yüklediği: Üniversite Kabulü, Sigorta Belgesi, Bloke Hesap, Vize Motivasyon Mektubu, vb.
   - Öğrenci evrak yükle: Danışmanlık Sözleşmesi, Kimlik Kartı, Taksit Ödemesi, vb.

## Öğrenci Dökümanlar yapısı (Revize.txt 3.4)

- **Kişisel Belgeler ve tercümeler** → CRM `documents` bölümündeki FILE alanları
- **Belgeler (Operasyonun yüklediği)** → `DocumentCategory` type: `OPERATION_UPLOADED`
- **Öğrenci İçin Evrak Yükle** → `DocumentCategory` type: `STUDENT_UPLOADED`

Sekmeler kaldırıldı; tüm bölümler tek sayfada alt alta gösterilir.
