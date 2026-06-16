const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(auth);

router.get('/', async (req, res) => {
  const notebooks = await prisma.notebook.findMany({
    where: { userId: req.user.id },
    include: { _count: { select: { notes: { where: { isTrashed: false } } } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(notebooks);
});

router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: '노트북 이름을 입력해주세요.' });

  const notebook = await prisma.notebook.create({
    data: { name, color: color || '#6366f1', userId: req.user.id },
  });
  res.json(notebook);
});

router.put('/:id', async (req, res) => {
  const notebook = await prisma.notebook.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!notebook) return res.status(404).json({ error: '노트북을 찾을 수 없습니다.' });

  const updated = await prisma.notebook.update({
    where: { id: req.params.id },
    data: { name: req.body.name, color: req.body.color },
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const notebook = await prisma.notebook.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!notebook) return res.status(404).json({ error: '노트북을 찾을 수 없습니다.' });

  await prisma.notebook.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
