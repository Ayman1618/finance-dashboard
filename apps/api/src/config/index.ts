import path from "path";
import dotenv from "dotenv";

// In ts-node-dev: __dirname = apps/api/src/config  → go up 3 levels → apps/api/
// In compiled dist: dist/apps/api/src/config → also go up to find .env
// Best solution: find .env relative to CWD (process.cwd()) which is always apps/api when running scripts
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "4000", 10),
  isDevelopment: process.env.NODE_ENV !== "production",

  database: {
    url: requireEnv("DATABASE_URL"),
  },

  jwt: {
    accessSecret: requireEnv("JWT_ACCESS_SECRET"),
    refreshSecret: requireEnv("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
};
