// Uses Turso HTTP API directly — avoids @libsql/client migration state bug in v0.6.x
async function setup() {
  const tursoUrl = process.env.TURSO_URL;
  const tursoToken = process.env.TURSO_TOKEN || '';

  if (!tursoUrl) {
    console.log('No TURSO_URL — skipping setup');
    return;
  }

  // Convert libsql:// or https:// to plain hostname
  const host = tursoUrl.replace(/^(libsql|https):\/\//, '');
  const apiUrl = `https://${host}/v2/pipeline`;

  const sqls = [
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

  const requests = sqls.map(sql => ({ type: 'execute', stmt: { sql } }));
  requests.push({ type: 'close' });

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tursoToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const failed = data.results?.filter(r => r.type === 'error');
  if (failed?.length) {
    throw new Error(`SQL error: ${JSON.stringify(failed)}`);
  }

  console.log('Database tables ready');
}

setup().catch(err => {
  console.error('DB setup failed:', err);
  process.exit(1);
});
