const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

let prisma;

if (process.env.TURSO_URL) {
  const libsql = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN || '',
  });
  const adapter = new PrismaLibSQL(libsql);
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

module.exports = prisma;
