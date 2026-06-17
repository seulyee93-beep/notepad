const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const db = require('../lib/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/auto', async (req, res) => {
  try {
    const DEFAULT_EMAIL = 'owner@notepad.local';
    const now = new Date().toISOString();

    const existing = await db.execute({
      sql: 'SELECT id, email, name FROM "User" WHERE email = ?',
      args: [DEFAULT_EMAIL],
    });

    let user = existing.rows[0];

    if (!user) {
      const userId = randomUUID();
      const hashed = await bcrypt.hash('notepad-default', 10);
      await db.execute({
        sql: 'INSERT INTO "User" (id, email, password, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        args: [userId, DEFAULT_EMAIL, hashed, '나', now, now],
      });
      const notebookId = randomUUID();
      await db.execute({
        sql: 'INSERT INTO "Notebook" (id, name, color, createdAt, updatedAt, userId) VALUES (?, ?, ?, ?, ?, ?)',
        args: [notebookId, '첫 번째 노트북', '#6366f1', now, now, userId],
      });
      user = { id: userId, email: DEFAULT_EMAIL, name: '나' };
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('[auth/auto]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }
    const now = new Date().toISOString();
    const dup = await db.execute({ sql: 'SELECT id FROM "User" WHERE email = ?', args: [email] });
    if (dup.rows.length) return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });

    const userId = randomUUID();
    const hashed = await bcrypt.hash(password, 10);
    await db.execute({
      sql: 'INSERT INTO "User" (id, email, password, name, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      args: [userId, email, hashed, name, now, now],
    });
    const notebookId = randomUUID();
    await db.execute({
      sql: 'INSERT INTO "Notebook" (id, name, color, createdAt, updatedAt, userId) VALUES (?, ?, ?, ?, ?, ?)',
      args: [notebookId, '첫 번째 노트북', '#6366f1', now, now, userId],
    });

    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: userId, email, name } });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.execute({
      sql: 'SELECT id, email, name, password FROM "User" WHERE email = ?',
      args: [email],
    });
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT id, email, name, createdAt FROM "User" WHERE id = ?',
      args: [req.user.id],
    });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
