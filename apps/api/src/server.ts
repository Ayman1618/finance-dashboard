import { config } from "./config";
import app from "./app";
import { prisma } from "./database/client";

async function bootstrap() {
  try {
    // Verify database connection before starting
    await prisma.$connect();
    console.log("✅ Database connected successfully.");

    const server = app.listen(config.port, () => {
      console.log(`\n🚀 Finance Dashboard API`);
      console.log(`   Environment : ${config.env}`);
      console.log(`   Port        : ${config.port}`);
      console.log(`   API Base    : http://localhost:${config.port}/api`);
      console.log(`   Docs        : http://localhost:${config.port}/api/docs`);
      console.log(`   Health      : http://localhost:${config.port}/api/health\n`);
    });

    // Graceful shutdown
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
