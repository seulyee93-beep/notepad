const { createClient } = require('@libsql/client');

async function setup() {
  if (!process.env.TURSO_URL) {
    console.log('No TURSO_URL — skipping Turso setup');
    return;
  }

  const client = createClient({
    url: process.env.TURSO_URL,
    authToken: process.env.TURSO_TOKEN || '',
  });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id"        TEXT     NOT NULL PRIMARY KEY,
      "email"     TEXT     NOT NULL,
      "password"  TEXT     NOT NULL,
      "name"      TEXT     NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
    `CREATE TABLE IF NOT EXISTS "Notebook" (
      "id"        TEXT     NOT NULL PRIMARY KEY,
      "name"      TEXT     NOT NULL,
      "color"     TEXT     NOT NULL DEFAULT '#6366f1',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId"    TEXT     NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Note" (
      "id"         TEXT     NOT NULL PRIMARY KEY,
      "title"      TEXT     NOT NULL DEFAULT 'Untitled',
      "content"    TEXT     NOT NULL DEFAULT '',
      "isPinned"   INTEGER  NOT NULL DEFAULT 0,
      "isTrashed"  INTEGER  NOT NULL DEFAULT 0,
      "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId"     TEXT     NOT NULL,
      "notebookId" TEXT,
      FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE,
      FOREIGN KEY ("notebookId") REFERENCES "Notebook"("id") ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Tag" (
      "id"        TEXT     NOT NULL PRIMARY KEY,
      "name"      TEXT     NOT NULL,
      "color"     TEXT     NOT NULL DEFAULT '#64748b',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "userId"    TEXT     NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Tag_userId_name_key" ON "Tag"("userId", "name")`,
    `CREATE TABLE IF NOT EXISTS "NoteTag" (
      "noteId" TEXT NOT NULL,
      "tagId"  TEXT NOT NULL,
      PRIMARY KEY ("noteId", "tagId"),
      FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE,
      FOREIGN KEY ("tagId")  REFERENCES "Tag"("id")  ON DELETE CASCADE
    )`,
  ];

  for (const sql of statements) {
    await client.execute(sql);
  }

  console.log('Database tables ready');
}

setup().catch(err => {
  console.error('DB setup failed:', err);
  process.exit(1);
});
