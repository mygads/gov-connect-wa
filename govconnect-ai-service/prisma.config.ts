
// Prisma configuration for AI Service Vector Database
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // Use AI_DATABASE_URL for vector database
    url: env("AI_DATABASE_URL"),
  },
});
