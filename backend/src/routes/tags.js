const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', async (req, res) => {
  const tags = await prisma.tag.findMany({
    where: { userId: req.user.id },
    include: { _count: { select: { notes: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(tags);
});

router.post('/', async (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: '태그 이름을 입력해주세요.' });

  const tag = await prisma.tag.create({
    data: { name, color: color || '#64748b', userId: req.user.id },
  });
  res.json(tag);
});

router.put('/:id', async (req, res) => {
  const tag = await prisma.tag.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!tag) return res.status(404).json({ error: '태그를 찾을 수 없습니다.' });

  const updated = await prisma.tag.update({
    where: { id: req.params.id },
    data: { name: req.body.name, color: req.body.color },
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const tag = await prisma.tag.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!tag) return res.status(404).json({ error: '태그를 찾을 수 없습니다.' });

  await prisma.tag.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

module.exports = router;
