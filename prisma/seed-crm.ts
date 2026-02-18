/**
 * Sadece aşamaları ve CRM bölüm/alanlarını seed'ler. Kullanıcı oluşturmaz.
 * Production'da başvuru kartını açmak için: npx tsx prisma/seed-crm.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { slug: "lead", name: "Lead", sortOrder: 0 },
  { slug: "applied", name: "Applied", sortOrder: 1 },
  { slug: "reviewing", name: "Reviewing", sortOrder: 2 },
  { slug: "visa", name: "Visa", sortOrder: 3 },
  { slug: "enrolled", name: "Enrolled", sortOrder: 4 },
];

const CRM_SECTIONS = [
  { slug: "personal", name: "Kişisel Bilgiler", sortOrder: 0 },
  { slug: "parents", name: "Aile Bilgileri", sortOrder: 1 },
  { slug: "passport", name: "Pasaport / Kimlik", sortOrder: 2 },
  { slug: "education", name: "Eğitim Bilgileri", sortOrder: 3 },
  { slug: "documents", name: "Belgeler", sortOrder: 4 },
];

type CrmFieldSeed = {
  slug: string;
  label: string;
  type: "TEXT" | "EMAIL" | "TEL" | "TEXTAREA" | "DATE" | "RADIO" | "SELECT" | "CHECKBOX" | "FILE";
  sectionSlug: string;
  sortOrder: number;
  required?: boolean;
  allowMultiple?: boolean;
  options?: { value: string; label: string }[];
};

const CRM_FIELDS: CrmFieldSeed[] = [
  { slug: "full_name", label: "Adınız Soyadınız", type: "TEXT", sectionSlug: "personal", sortOrder: 0, required: true },
  { slug: "birth_date", label: "Doğum Tarihi", type: "DATE", sectionSlug: "personal", sortOrder: 1 },
  { slug: "birth_place", label: "Doğum Yeri", type: "TEXT", sectionSlug: "personal", sortOrder: 2 },
  { slug: "email", label: "E-Posta", type: "EMAIL", sectionSlug: "personal", sortOrder: 3 },
  { slug: "email_confirm", label: "E-Posta Doğrulama", type: "EMAIL", sectionSlug: "personal", sortOrder: 4 },
  { slug: "phone", label: "Telefon", type: "TEL", sectionSlug: "personal", sortOrder: 5 },
  { slug: "address", label: "Adresiniz", type: "TEXT", sectionSlug: "personal", sortOrder: 6 },
  { slug: "city", label: "Şehir", type: "TEXT", sectionSlug: "personal", sortOrder: 7 },
  { slug: "postal_code", label: "Posta Kodu", type: "TEXT", sectionSlug: "personal", sortOrder: 8 },
  { slug: "country", label: "Ülke", type: "SELECT", sectionSlug: "personal", sortOrder: 9, options: [
    { value: "TR", label: "Türkiye" }, { value: "DE", label: "Almanya" }, { value: "AT", label: "Avusturya" },
    { value: "CH", label: "İsviçre" }, { value: "US", label: "ABD" }, { value: "GB", label: "Birleşik Krallık" },
    { value: "NL", label: "Hollanda" }, { value: "FR", label: "Fransa" }, { value: "IT", label: "İtalya" },
    { value: "ES", label: "İspanya" }, { value: "AZ", label: "Azerbaycan" }, { value: "KZ", label: "Kazakistan" },
    { value: "OTHER", label: "Diğer" },
  ] },
  { slug: "marital_status", label: "Medeni Durum", type: "RADIO", sectionSlug: "personal", sortOrder: 10, options: [{ value: "single", label: "Bekâr" }, { value: "married", label: "Evli" }, { value: "other", label: "Diğer" }] },
  { slug: "father_first_name", label: "Baba Adı", type: "TEXT", sectionSlug: "parents", sortOrder: 0 },
  { slug: "father_last_name", label: "Baba Soyadı", type: "TEXT", sectionSlug: "parents", sortOrder: 1 },
  { slug: "father_birth_date", label: "Baba Doğum Tarihi", type: "DATE", sectionSlug: "parents", sortOrder: 2 },
  { slug: "father_birth_place", label: "Baba Doğum Yeri", type: "TEXT", sectionSlug: "parents", sortOrder: 3 },
  { slug: "father_residence", label: "Baba İkamet Şehri/İlçesi", type: "TEXT", sectionSlug: "parents", sortOrder: 4 },
  { slug: "father_phone", label: "Baba Telefon", type: "TEL", sectionSlug: "parents", sortOrder: 5 },
  { slug: "father_email", label: "Baba Mail", type: "TEXT", sectionSlug: "parents", sortOrder: 6 },
  { slug: "mother_first_name", label: "Anne Adı", type: "TEXT", sectionSlug: "parents", sortOrder: 7 },
  { slug: "mother_last_name", label: "Anne Soyadı", type: "TEXT", sectionSlug: "parents", sortOrder: 8 },
  { slug: "mother_birth_date", label: "Anne Doğum Tarihi", type: "DATE", sectionSlug: "parents", sortOrder: 9 },
  { slug: "mother_birth_place", label: "Anne Doğum Yeri", type: "TEXT", sectionSlug: "parents", sortOrder: 10 },
  { slug: "mother_residence", label: "Anne İkamet Şehri/İlçesi", type: "TEXT", sectionSlug: "parents", sortOrder: 11 },
  { slug: "mother_phone", label: "Anne Telefon", type: "TEL", sectionSlug: "parents", sortOrder: 12 },
  { slug: "mother_email", label: "Anne Mail", type: "TEXT", sectionSlug: "parents", sortOrder: 13 },
  { slug: "germany_visited", label: "Daha önce Almanya'da bulundunuz mu?", type: "CHECKBOX", sectionSlug: "passport", sortOrder: 0 },
  { slug: "germany_dates", label: "Bulunma Tarihleri", type: "TEXTAREA", sectionSlug: "passport", sortOrder: 1 },
  { slug: "passport_type", label: "Pasaport Türü", type: "RADIO", sectionSlug: "passport", sortOrder: 2, options: [{ value: "normal", label: "Normal" }, { value: "green", label: "Yeşil" }, { value: "other", label: "Diğer" }] },
  { slug: "passport_number", label: "Pasaport Numarası", type: "TEXT", sectionSlug: "passport", sortOrder: 3 },
  { slug: "passport_authority", label: "Pasaport Veren makam", type: "TEXT", sectionSlug: "passport", sortOrder: 4 },
  { slug: "passport_issue_date", label: "Pasaport Veriliş Tarihi", type: "TEXT", sectionSlug: "passport", sortOrder: 5 },
  { slug: "passport_expiry_date", label: "Pasaport Geçerlilik Tarihi", type: "TEXT", sectionSlug: "passport", sortOrder: 6 },
  { slug: "graduation_status", label: "Mezuniyet Durumu", type: "RADIO", sectionSlug: "education", sortOrder: 0, options: [{ value: "high_school", label: "Lise mezunu" }, { value: "university", label: "Üniversite mezunu" }, { value: "student", label: "Öğrenci" }, { value: "other", label: "Diğer" }] },
  { slug: "financial_proof", label: "Finansal Kanıt", type: "RADIO", sectionSlug: "education", sortOrder: 1, options: [] },
  { slug: "high_school_name", label: "Lise Adı", type: "TEXT", sectionSlug: "education", sortOrder: 2 },
  { slug: "high_school_city", label: "Lise Şehir", type: "TEXT", sectionSlug: "education", sortOrder: 3 },
  { slug: "high_school_start", label: "Lise Başlangıç Tarihi (Ay/Yıl)", type: "TEXT", sectionSlug: "education", sortOrder: 4 },
  { slug: "high_school_end", label: "Lise Bitiş Tarihi (Gün/Ay/Yıl)", type: "TEXT", sectionSlug: "education", sortOrder: 5 },
  { slug: "high_school_type", label: "Lise Türü", type: "TEXT", sectionSlug: "education", sortOrder: 6 },
  { slug: "osym_taken", label: "ÖSYM Üniversite sınavına girdiniz mi?", type: "CHECKBOX", sectionSlug: "education", sortOrder: 7 },
  { slug: "osym_result_date", label: "ÖSYM Yerleştirme Sonuç Tarihi", type: "TEXT", sectionSlug: "education", sortOrder: 8 },
  { slug: "university_name", label: "Üniversitenizin Adı", type: "TEXT", sectionSlug: "education", sortOrder: 9 },
  { slug: "university_department", label: "Üniversite Bölüm Adı", type: "TEXT", sectionSlug: "education", sortOrder: 10 },
  { slug: "university_start", label: "Üniversite Başlangıç Tarihi (Ay/Yıl)", type: "TEXT", sectionSlug: "education", sortOrder: 11 },
  { slug: "german_certificate", label: "Almanca Sertifikası", type: "TEXT", sectionSlug: "education", sortOrder: 12 },
  { slug: "german_level", label: "Almanca Seviyesi", type: "RADIO", sectionSlug: "education", sortOrder: 13, options: [{ value: "a1", label: "A1" }, { value: "a2", label: "A2" }, { value: "b1", label: "B1" }, { value: "b2", label: "B2" }, { value: "c1", label: "C1" }, { value: "c2", label: "C2" }] },
  { slug: "work_internship", label: "İş/Staj Tecrübesi", type: "TEXT", sectionSlug: "education", sortOrder: 14 },
  { slug: "university_preferences", label: "Üniversite ve Bölüm Tercihleri", type: "TEXTAREA", sectionSlug: "education", sortOrder: 15 },
  { slug: "consultancy_contract", label: "Danışmanlık Sözleşmesi", type: "FILE", sectionSlug: "documents", sortOrder: 0 },
  { slug: "biometric_photo", label: "Biyometrik Fotoğraf", type: "FILE", sectionSlug: "documents", sortOrder: 1 },
  { slug: "cv", label: "CV", type: "FILE", sectionSlug: "documents", sortOrder: 2 },
  { slug: "passport_file", label: "Pasaport", type: "FILE", sectionSlug: "documents", sortOrder: 3 },
  { slug: "id_card", label: "Kimlik Kartı", type: "FILE", sectionSlug: "documents", sortOrder: 4 },
  { slug: "high_school_diploma", label: "Lise Diploması", type: "FILE", sectionSlug: "documents", sortOrder: 5 },
  { slug: "high_school_graduation", label: "Lise Mezuniyet Belgesi (E-devlet)", type: "FILE", sectionSlug: "documents", sortOrder: 6 },
  { slug: "high_school_transcript", label: "Lise Transkripti", type: "FILE", sectionSlug: "documents", sortOrder: 7 },
  { slug: "open_high_school", label: "Açık Lise Öğrenim/Mezuniyet Belgesi", type: "FILE", sectionSlug: "documents", sortOrder: 8 },
  { slug: "osym_exam_result", label: "ÖSYM Sınav Sonuç Belgesi", type: "FILE", sectionSlug: "documents", sortOrder: 9 },
  { slug: "osym_placement", label: "ÖSYM Yerleştirme Belgesi", type: "FILE", sectionSlug: "documents", sortOrder: 10 },
  { slug: "university_student_doc", label: "Üniversite Öğrenci Belgesi", type: "FILE", sectionSlug: "documents", sortOrder: 11 },
  { slug: "university_transcript", label: "Üniversite Transkripti", type: "FILE", sectionSlug: "documents", sortOrder: 12 },
  { slug: "residence_doc", label: "İkamet Belgesi", type: "FILE", sectionSlug: "documents", sortOrder: 13 },
  { slug: "other_documents", label: "Diğer Belgeler", type: "FILE", sectionSlug: "documents", sortOrder: 14, allowMultiple: true },
];

async function main() {
  for (const s of DEFAULT_STAGES) {
    await prisma.stage.upsert({
      where: { slug: s.slug },
      update: { name: s.name, sortOrder: s.sortOrder },
      create: s,
    });
  }
  console.log("Aşamalar güncellendi.");

  for (const sec of CRM_SECTIONS) {
    await prisma.crmSection.upsert({
      where: { slug: sec.slug },
      update: { name: sec.name, sortOrder: sec.sortOrder },
      create: sec,
    });
  }
  console.log("CRM bölümleri güncellendi.");

  const sectionMap = await prisma.crmSection.findMany({ select: { id: true, slug: true } }).then((list) => Object.fromEntries(list.map((s) => [s.slug, s.id])));

  for (const f of CRM_FIELDS) {
    const sectionId = sectionMap[f.sectionSlug] ?? null;
    await prisma.crmField.upsert({
      where: { slug: f.slug },
      update: {
        label: f.label,
        type: f.type,
        sectionId,
        sortOrder: f.sortOrder,
        required: f.required ?? false,
        allowMultiple: f.allowMultiple ?? false,
        options: f.options ? JSON.parse(JSON.stringify(f.options)) : undefined,
      },
      create: {
        slug: f.slug,
        label: f.label,
        type: f.type,
        sectionId,
        sortOrder: f.sortOrder,
        required: f.required ?? false,
        allowMultiple: f.allowMultiple ?? false,
        options: f.options ? JSON.parse(JSON.stringify(f.options)) : undefined,
      },
    });
  }
  console.log("CRM alanları güncellendi.");
}

main()
  .then(() => {
    console.log("CRM seed tamamlandı.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
