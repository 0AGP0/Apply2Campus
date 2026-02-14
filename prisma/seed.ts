import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_STAGES = [
  { slug: "lead", name: "Lead", sortOrder: 0 },
  { slug: "applied", name: "Applied", sortOrder: 1 },
  { slug: "reviewing", name: "Reviewing", sortOrder: 2 },
  { slug: "visa", name: "Visa", sortOrder: 3 },
  { slug: "enrolled", name: "Enrolled", sortOrder: 4 },
];

async function main() {
  const adminEmail = "admin@educonsult.local";
  const consultantEmail = "sarah@educonsult.local";
  const password = "password123";

  const passwordHash = await bcrypt.hash(password, 10);

  for (const s of DEFAULT_STAGES) {
    await prisma.stage.upsert({
      where: { slug: s.slug },
      update: { name: s.name, sortOrder: s.sortOrder },
      create: s,
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin Team",
      passwordHash,
      role: "ADMIN",
    },
  });

  const consultant = await prisma.user.upsert({
    where: { email: consultantEmail },
    update: {},
    create: {
      email: consultantEmail,
      name: "Sarah Jenkins",
      passwordHash,
      role: "CONSULTANT",
    },
  });

  const student1 = await prisma.student.upsert({
    where: { id: "seed-student-1" },
    update: {},
    create: {
      id: "seed-student-1",
      name: "Alex Johnson",
      studentEmail: "alex.johnson@example.com",
      gmailAddress: "alex.j.edu@gmail.com",
      stage: "applied",
      assignedConsultantId: consultant.id,
    },
  });

  // Öğrenci girişi: Alex Johnson kendi dashboard'una giriş yapabilsin
  await prisma.user.upsert({
    where: { email: student1.studentEmail! },
    update: {},
    create: {
      email: student1.studentEmail!,
      name: student1.name,
      passwordHash,
      role: "STUDENT",
      studentId: student1.id,
    },
  });

  const student2 = await prisma.student.upsert({
    where: { id: "seed-student-2" },
    update: {},
    create: {
      id: "seed-student-2",
      name: "Chen Wei",
      studentEmail: "chen.wei@example.com",
      gmailAddress: null,
      stage: "lead",
      assignedConsultantId: consultant.id,
    },
  });

  console.log("Seed completed:");
  console.log("  Admin:", admin.email);
  console.log("  Consultant:", consultant.email, "(password: " + password + ")");
  console.log("  Student login:", student1.studentEmail, "(password: " + password + ") -> dashboard");
  console.log("  Students:", student1.name, ",", student2.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
