import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const OPERATION_CATEGORIES = [
  { slug: "universite_kabulu", name: "Üniversite Kabulü", sortOrder: 0 },
  { slug: "sigorta_belgesi", name: "Sigorta Belgesi", sortOrder: 1 },
  { slug: "bloke_hesap_acilis", name: "Bloke Hesap Açılış Belgesi", sortOrder: 2 },
  { slug: "bloke_hesap_belgesi", name: "Bloke Hesap Belgesi", sortOrder: 3 },
  { slug: "vize_motivasyon", name: "Vize Motivasyon Mektubu", sortOrder: 4 },
  { slug: "dil_kursu_proforma", name: "Dil Kursu Proforma", sortOrder: 5 },
  { slug: "dil_kursu_kayit", name: "Dil Kursu Kayıt Belge", sortOrder: 6 },
  { slug: "konaklama_sozlesme", name: "Konaklama Sözleşme", sortOrder: 7 },
  { slug: "lise_diplomasi_de", name: "Lise Diploması DE", sortOrder: 8 },
  { slug: "lise_mezuniyet_de", name: "Lise Mezuniyet DE", sortOrder: 9 },
  { slug: "lise_transkript_de", name: "Lise Transkript DE", sortOrder: 10 },
  { slug: "acik_lise_ogrenim_de", name: "Açık Lise Öğrenim DE", sortOrder: 11 },
  { slug: "osym_sinav_sonuc_de", name: "ÖSYM Sınav Sonuç DE", sortOrder: 12 },
  { slug: "osym_yerlestirme_de", name: "ÖSYM Yerleştirme Belgesi DE", sortOrder: 13 },
  { slug: "universite_ogrenci_belgesi_de", name: "Üniversite Öğrenci Belgesi DE", sortOrder: 14 },
  { slug: "universite_diploma_de", name: "Üniversite/Önlisans Diploması DE", sortOrder: 15 },
  { slug: "universite_transkript_de", name: "Üniversite/Önlisans Transkripti DE", sortOrder: 16 },
];

const STUDENT_UPLOAD_CATEGORIES = [
  { slug: "danismanlik_sozlesmesi", name: "Danışmanlık Sözleşmesi", sortOrder: 0 },
  { slug: "kimlik_karti", name: "Kimlik Kartı", sortOrder: 1 },
  { slug: "taksit_odemesi", name: "Taksit Ödemesi", sortOrder: 2 },
  { slug: "garantor_belgesi", name: "Garantör Belgesi", sortOrder: 3 },
  { slug: "bloke_hesap_odemesi", name: "Bloke Hesap Ödemesi", sortOrder: 4 },
  { slug: "dil_kursu_odemesi", name: "Dil Kursu Ödemesi", sortOrder: 5 },
  { slug: "okul_kayit_odemesi", name: "Okul Kayıt Ödemesi", sortOrder: 6 },
];

async function main() {
  for (const c of OPERATION_CATEGORIES) {
    await prisma.documentCategory.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, type: "OPERATION_UPLOADED", sortOrder: c.sortOrder },
      update: { name: c.name, sortOrder: c.sortOrder },
    });
  }
  for (const c of STUDENT_UPLOAD_CATEGORIES) {
    await prisma.documentCategory.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, name: c.name, type: "STUDENT_UPLOADED", sortOrder: c.sortOrder },
      update: { name: c.name, sortOrder: c.sortOrder },
    });
  }
  console.log("Document categories: operation", OPERATION_CATEGORIES.length, "| student upload", STUDENT_UPLOAD_CATEGORIES.length);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
