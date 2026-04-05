import app from "./app";
import { prisma } from "./database/client";

// Config is loaded inside app.ts already via import chain
// We need to read port after dotenv is initialized
const PORT = parseInt(process.env.PORT || "4000", 10);
const ENV = process.env.NODE_ENV || "development";

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully.");

    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Finance Dashboard API`);
      console.log(`   Environment : ${ENV}`);
      console.log(`   Port        : ${PORT}`);
      console.log(`   API Base    : http://localhost:${PORT}/api`);
      console.log(`   Docs        : http://localhost:${PORT}/api/docs`);
      console.log(`   Health      : http://localhost:${PORT}/api/health\n`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log("✅ Database disconnected. Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
