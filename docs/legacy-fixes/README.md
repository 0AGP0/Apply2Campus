# Legacy Fix SQL Scriptleri

Bu klasördeki SQL dosyaları, migration geçmişi eksik veya bozulmuş sunucularda manuel düzeltme için tutulmuştur.

**Yeni kurulumda bu dosyalara gerek yoktur.** Normal akış:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Ne Zaman Kullanılır?

Sadece aşağıdaki durumlarda, veritabanına manuel bağlanıp ilgili dosyayı çalıştırın:

| Dosya | Durum |
|-------|--------|
| `fix-student-document-columns.sql` | `StudentDocument.version` veya `status` sütunu yok hatası alıyorsanız |
| `fix-document-categories.sql` | `DocumentCategory` veya `StudentDocumentByCategory` tabloları eksikse |
| `fix-missing-migrations.sql` | Student tablosunda `visaCity`, `visaInstitution`, `visaNotes`, `visaProgramStartDate` sütunları yoksa |

**Not:** Scriptler idempotent tasarlanmıştır; zaten varsa hata vermez.
