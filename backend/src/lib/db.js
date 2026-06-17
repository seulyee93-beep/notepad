const { createClient } = require('@libsql/client');

const db = process.env.TURSO_URL
  ? createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_TOKEN || '' })
  : createClient({ url: 'file:./dev.db' });

module.exports = db;
