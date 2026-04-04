import { PrismaClient } from "@prisma/client";
import { config } from "../config";

// Prisma singleton — avoids creating multiple connections during hot reload in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.isDevelopment ? ["query", "error", "warn"] : ["error"],
  });

if (config.isDevelopment) {
  globalForPrisma.prisma = prisma;
}
