const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const CATEGORIES = [
  "Delivery", "Driver", "Sales", "Telecalling", "Customer Support", "Back Office",
  "Data Entry", "Office Assistant", "Receptionist", "Security Guard", "Field Executive",
  "Marketing", "Retail", "Warehouse", "Logistics", "Technician", "Healthcare",
  "Hospitality", "Education", "Construction", "IT & Software", "Finance", "HR", "Design",
];

async function main() {
  for (const name of CATEGORIES) {
    await prisma.jobCategory.upsert({ where: { name }, update: {}, create: { name } });
  }

  const adminEmail = "admin@workora.app";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: "ADMIN", emailVerified: true },
    });
    console.log(`Seeded admin account: ${adminEmail} / ChangeMe123! — change this password immediately.`);
  }

  console.log(`Seeded ${CATEGORIES.length} job categories.`);
}

main().finally(() => prisma.$disconnect());
