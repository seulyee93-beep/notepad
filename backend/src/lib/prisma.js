const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');

let prisma;

if (process.env.TURSO_URL) {
  // Prisma 6.x: PrismaLibSQL(url: string, options?: { authToken?: string })
  const adapter = new PrismaLibSQL(process.env.TURSO_URL, {
    authToken: process.env.TURSO_TOKEN || '',
  });
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

module.exports = prisma;
