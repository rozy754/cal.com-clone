import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  // Yeh explicitly aapke live Neon pointer ko pool queue me bypass karega
  const liveString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_BhmGLj1SvHE2@ep-solitary-rice-apujigon.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const pool = new Pool({ connectionString: liveString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = db;
}

export default db;