import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations", // Bas yeh rehne do, seed wali line mita do
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_BhmGLj1SvHE2@ep-solitary-rice-apujigon.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require"
  },
});