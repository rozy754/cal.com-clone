import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations", // Bas yeh rehne do, seed wali line mita do
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});