import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Create a pg Pool intance using databse URL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

// Pass the pool into the PrismaPg adapter
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Instantiate PrismaClient with the adapter
export const prisma = new PrismaClient({ adapter });
