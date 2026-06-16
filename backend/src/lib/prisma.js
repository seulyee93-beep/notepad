const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');

let prisma;

if (process.env.TURSO_URL) {
  // Prisma 6: pass config directly to PrismaLibSQL (no separate createClient needed)
  const adapter = new PrismaLibSQL({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN || '',
  });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

module.exports = prisma;
