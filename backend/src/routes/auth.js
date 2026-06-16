const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// 로그인 없이 자동 인증 — 기본 사용자가 없으면 생성 후 토큰 반환
router.post('/auto', async (req, res) => {
  try {
    const DEFAULT_EMAIL = 'owner@notepad.local';
    let user = await prisma.user.findUnique({ where: { email: DEFAULT_EMAIL } });

    if (!user) {
      const hashed = await bcrypt.hash('notepad-default', 10);
      user = await prisma.user.create({
        data: { email: DEFAULT_EMAIL, password: hashed, name: '나' },
      });
      await prisma.notebook.create({
        data: { name: '첫 번째 노트북', userId: user.id },
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '365d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    });

    // 기본 노트북 생성
    await prisma.notebook.create({
      data: { name: '첫 번째 노트북', userId: user.id },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, name: true, createdAt: true },
  });
  res.json(user);
});

module.exports = router;
