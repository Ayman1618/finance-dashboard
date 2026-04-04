/**
 * Database Seed Script
 *
 * Creates:
 * - 1 Admin user
 * - 1 Analyst user
 * - 2 Viewer users
 *
 * Usage: pnpm db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function hash(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Clear existing data (safe for dev)
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.record.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️  Cleared existing data.");

  // ── Create Users ──────────────────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      email: "admin@finance.local",
      name: "Alex Admin",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash: await hash("Admin@123"),
    },
  });

  const analyst = await prisma.user.create({
    data: {
      email: "analyst@finance.local",
      name: "Sam Analyst",
      role: "ANALYST",
      status: "ACTIVE",
      passwordHash: await hash("Analyst@123"),
    },
  });

  const viewer1 = await prisma.user.create({
    data: {
      email: "viewer@finance.local",
      name: "Jordan Viewer",
      role: "VIEWER",
      status: "ACTIVE",
      passwordHash: await hash("Viewer@123"),
    },
  });

  const viewer2 = await prisma.user.create({
    data: {
      email: "inactive@finance.local",
      name: "Casey Inactive",
      role: "VIEWER",
      status: "INACTIVE",
      passwordHash: await hash("Viewer@123"),
    },
  });

  console.log("👤 Created users:");
  console.log(`   Admin   : ${admin.email} / Admin@123`);
  console.log(`   Analyst : ${analyst.email} / Analyst@123`);
  console.log(`   Viewer  : ${viewer1.email} / Viewer@123`);
  console.log(`   Inactive: ${viewer2.email} / Viewer@123`);

  // ── Create Financial Records ───────────────────────────────────────────────
  const records = [
    // Admin's records
    { amount: 85000, type: "INCOME", category: "SALARY", date: "2024-01-01", description: "Monthly salary - January", createdBy: admin.id },
    { amount: 85000, type: "INCOME", category: "SALARY", date: "2024-02-01", description: "Monthly salary - February", createdBy: admin.id },
    { amount: 85000, type: "INCOME", category: "SALARY", date: "2024-03-01", description: "Monthly salary - March", createdBy: admin.id },
    { amount: 85000, type: "INCOME", category: "SALARY", date: "2024-04-01", description: "Monthly salary - April", createdBy: admin.id },
    { amount: 85000, type: "INCOME", category: "SALARY", date: "2024-05-01", description: "Monthly salary - May", createdBy: admin.id },
    { amount: 85000, type: "INCOME", category: "SALARY", date: "2024-06-01", description: "Monthly salary - June", createdBy: admin.id },
    { amount: 12000, type: "INCOME", category: "FREELANCE", date: "2024-01-15", description: "Website redesign project", createdBy: admin.id },
    { amount: 8500,  type: "INCOME", category: "FREELANCE", date: "2024-03-20", description: "API integration consulting", createdBy: admin.id },
    { amount: 5000,  type: "INCOME", category: "INVESTMENT", date: "2024-02-10", description: "Dividend from mutual funds", createdBy: admin.id },
    { amount: 18000, type: "INCOME", category: "INVESTMENT", date: "2024-05-15", description: "Stock portfolio gain", createdBy: admin.id },

    { amount: 18000, type: "EXPENSE", category: "RENT", date: "2024-01-05", description: "Monthly rent - January", createdBy: admin.id },
    { amount: 18000, type: "EXPENSE", category: "RENT", date: "2024-02-05", description: "Monthly rent - February", createdBy: admin.id },
    { amount: 18000, type: "EXPENSE", category: "RENT", date: "2024-03-05", description: "Monthly rent - March", createdBy: admin.id },
    { amount: 4200,  type: "EXPENSE", category: "FOOD", date: "2024-01-31", description: "Groceries and restaurants - January", createdBy: admin.id },
    { amount: 3800,  type: "EXPENSE", category: "FOOD", date: "2024-02-28", description: "Groceries and restaurants - February", createdBy: admin.id },
    { amount: 1200,  type: "EXPENSE", category: "TRANSPORT", date: "2024-01-20", description: "Uber + metro pass", createdBy: admin.id },
    { amount: 8500,  type: "EXPENSE", category: "HEALTHCARE", date: "2024-02-14", description: "Annual health check + dental", createdBy: admin.id },
    { amount: 15000, type: "EXPENSE", category: "EDUCATION", date: "2024-01-10", description: "Online courses subscription", createdBy: admin.id },
    { amount: 3200,  type: "EXPENSE", category: "ENTERTAINMENT", date: "2024-03-15", description: "Streaming, books, events", createdBy: admin.id },
    { amount: 4500,  type: "EXPENSE", category: "UTILITIES", date: "2024-01-25", description: "Electricity, internet, water", createdBy: admin.id },
    { amount: 12000, type: "EXPENSE", category: "SHOPPING", date: "2024-02-20", description: "Clothing and electronics", createdBy: admin.id },
    { amount: 35000, type: "EXPENSE", category: "TRAVEL", date: "2024-04-10", description: "International trip - Thailand", createdBy: admin.id },

    // Analyst's records
    { amount: 65000, type: "INCOME", category: "SALARY", date: "2024-01-01", description: "Monthly salary", createdBy: analyst.id },
    { amount: 65000, type: "INCOME", category: "SALARY", date: "2024-02-01", description: "Monthly salary", createdBy: analyst.id },
    { amount: 65000, type: "INCOME", category: "SALARY", date: "2024-03-01", description: "Monthly salary", createdBy: analyst.id },
    { amount: 9500,  type: "INCOME", category: "FREELANCE", date: "2024-02-18", description: "Data analysis project", createdBy: analyst.id },
    { amount: 3200,  type: "INCOME", category: "INVESTMENT", date: "2024-03-05", description: "Crypto gains", createdBy: analyst.id },
    { amount: 15000, type: "EXPENSE", category: "RENT", date: "2024-01-05", description: "Monthly rent", createdBy: analyst.id },
    { amount: 3500,  type: "EXPENSE", category: "FOOD", date: "2024-01-31", description: "Food expenses", createdBy: analyst.id },
    { amount: 6000,  type: "EXPENSE", category: "EDUCATION", date: "2024-02-01", description: "Professional certification", createdBy: analyst.id },
  ];

  await prisma.record.createMany({
    data: records.map((r) => ({
      amount: r.amount,
      type: r.type as any,
      category: r.category as any,
      date: new Date(r.date),
      description: r.description,
      createdBy: r.createdBy,
    })),
  });

  console.log(`\n📊 Created ${records.length} financial records.`);
  console.log("\n✅ Seed completed successfully!\n");
  console.log("─────────────────────────────────────");
  console.log("Quick Start:");
  console.log("  POST /api/auth/login");
  console.log('  Body: { "email": "admin@finance.local", "password": "Admin@123" }');
  console.log("─────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
